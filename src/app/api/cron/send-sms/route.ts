import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, createInitialReviewMessage, createCustomInitialMessage } from '@/lib/twilio'
import type { Database } from '@/types/database'

// Protect the cron endpoint - Vercel automatically handles cron authentication
function validateCronRequest(request: NextRequest): boolean {
  // Check for Vercel cron header
  const cronHeader = request.headers.get('x-vercel-cron')

  // Also check for custom secret as fallback
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  // Allow if either Vercel cron header is present OR custom secret matches
  return !!(cronHeader || (expectedSecret && authHeader === `Bearer ${expectedSecret}`))
}

export async function GET(request: NextRequest) {
  // Validate cron request
  if (!validateCronRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - not a valid cron request' },
      { status: 401 }
    )
  }

  let response = NextResponse.json({
    message: 'Processing SMS messages'
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return (request as any).cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            (request as any).cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  try {
    // Find all review requests that should be sent now
    const now = new Date().toISOString()

    // First, get the review requests without JOINs
    const { data: reviewRequests, error: fetchError } = await (supabase as any)
      .from('review_requests')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .limit(50) // Process in batches to avoid timeouts

    if (fetchError) {
      console.error('Error fetching pending requests:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch pending requests' },
        { status: 500 }
      )
    }

    if (!reviewRequests || reviewRequests.length === 0) {
      return NextResponse.json({
        message: 'No messages to send',
        processed: 0
      })
    }

    // Get unique user IDs and customer IDs
    const userIds = [...new Set(reviewRequests.map((req: any) => req.user_id))]
    const customerIds = [...new Set(reviewRequests.map((req: any) => req.customer_id))]

    // Fetch profiles and customers separately
    const { data: profiles, error: profilesError } = await (supabase as any)
      .from('profiles')
      .select('id, business_name, google_review_url')
      .in('id', userIds)

    const { data: customers, error: customersError } = await (supabase as any)
      .from('customers')
      .select('id, name, phone')
      .in('id', customerIds)

    if (profilesError || customersError) {
      console.error('Error fetching profiles or customers:', { profilesError, customersError })
      return NextResponse.json(
        { error: 'Failed to fetch related data' },
        { status: 500 }
      )
    }

    // Create lookup maps
    const profileMap = new Map()
    const customerMap = new Map()

    profiles?.forEach((profile: any) => profileMap.set(profile.id, profile))
    customers?.forEach((customer: any) => customerMap.set(customer.id, customer))

    // Combine data manually
    const pendingRequests = reviewRequests.map((request: any) => ({
      ...request,
      profiles: profileMap.get(request.user_id),
      customers: customerMap.get(request.customer_id)
    })).filter((request: any) => request.profiles && request.customers)

    if (!pendingRequests || pendingRequests.length === 0) {
      return NextResponse.json({
        message: 'No messages to send after filtering',
        processed: 0
      })
    }

    // Fetch SMS templates for all users
    const { data: smsTemplates } = await (supabase as any)
      .from('sms_templates')
      .select('*')
      .in('user_id', userIds)
      .eq('type', 'initial')
      .eq('is_active', true)

    // Create a map of user ID to template for quick lookup
    const templateMap = new Map()
    if (smsTemplates) {
      smsTemplates.forEach((template: any) => {
        templateMap.set(template.user_id, template)
      })
    }

    const results = []
    const sentCount = { success: 0, failed: 0 }

    // Process each request
    for (const request of pendingRequests) {
      try {
        // Create the sentiment gate URL
        const sentimentGateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${(request as any).token}`

        // Log the URL being sent for debugging
        console.log(`Sending SMS with URL: ${sentimentGateUrl} for customer: ${(request as any).customers.name}`)

        // Get the user's custom template
        const userTemplate = templateMap.get((request as any).profiles.id)

        // Create the SMS message using custom template if available
        const message = createCustomInitialMessage({
          customerName: (request as any).customers.name,
          businessName: (request as any).profiles.business_name,
          sentimentGateUrl,
          template: userTemplate ? {
            greeting: userTemplate.greeting,
            opening_line: userTemplate.opening_line,
            request_line: userTemplate.request_line,
            sign_off: userTemplate.sign_off
          } : undefined
        })

        // Send SMS
        const smsResult = await sendSMS((request as any).customers.phone, message)

        if (smsResult.success) {
          // Update request status to 'sent'
          const { error: updateError } = await (supabase as any)
            .from('review_requests')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              sms_message_sid: smsResult.messageSid,
            })
            .eq('id', (request as any).id)

          if (updateError) {
            console.error(`Error updating request ${(request as any).id}:`, updateError)
            results.push({
              id: (request as any).id,
              customer: (request as any).customers.name,
              status: 'sms_sent_but_db_update_failed',
              error: updateError.message,
            })
          } else {
            sentCount.success++
            results.push({
              id: (request as any).id,
              customer: (request as any).customers.name,
              status: 'success',
              messageSid: smsResult.messageSid,
            })
          }
        } else {
          // Mark as failed
          const { error: updateError } = await (supabase as any)
            .from('review_requests')
            .update({
              status: 'failed',
            })
            .eq('id', (request as any).id)

          sentCount.failed++
          results.push({
            id: (request as any).id,
            customer: (request as any).customers.name,
            status: 'failed',
            error: smsResult.error,
          })

          if (updateError) {
            console.error(`Error updating failed request ${(request as any).id}:`, updateError)
          }
        }

        // Add a small delay between SMS sends to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Unexpected error processing request ${(request as any).id}:`, error)
        sentCount.failed++
        results.push({
          id: (request as any).id,
          customer: (request as any).customers?.name || 'Unknown',
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Log summary
    console.log(`SMS Cron Summary: ${sentCount.success} sent, ${sentCount.failed} failed`)

    response = NextResponse.json({
      message: 'SMS sending completed',
      processed: pendingRequests.length,
      success: sentCount.success,
      failed: sentCount.failed,
      results,
    })
    return response

  } catch (error) {
    console.error('Unexpected error in SMS cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}