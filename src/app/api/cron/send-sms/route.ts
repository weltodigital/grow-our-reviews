import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, createInitialReviewMessage } from '@/lib/twilio'
import type { Database } from '@/types/database'

// Protect the cron endpoint with a secret
function validateCronSecret(request: NextRequest): boolean {
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  if (!expectedSecret) {
    console.error('CRON_SECRET environment variable not set')
    return false
  }

  return authHeader === `Bearer ${expectedSecret}`
}

export async function GET(request: NextRequest) {
  // Validate cron secret
  if (!validateCronSecret(request)) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    )
  }

  let response = NextResponse.json({
    message: 'Processing SMS messages'
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  try {
    // Find all review requests that should be sent now
    const now = new Date().toISOString()

    const { data: pendingRequests, error: fetchError } = await supabase
      .from('review_requests')
      .select(`
        *,
        profiles!inner(business_name, google_review_url),
        customers!inner(name, phone)
      `)
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

    if (!pendingRequests || pendingRequests.length === 0) {
      return NextResponse.json({
        message: 'No messages to send',
        processed: 0
      })
    }

    const results = []
    const sentCount = { success: 0, failed: 0 }

    // Process each request
    for (const request of pendingRequests) {
      try {
        // Create the sentiment gate URL
        const sentimentGateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${request.token}`

        // Create the SMS message
        const message = createInitialReviewMessage({
          customerName: request.customers.name,
          businessName: request.profiles.business_name,
          sentimentGateUrl,
        })

        // Send SMS
        const smsResult = await sendSMS(request.customers.phone, message)

        if (smsResult.success) {
          // Update request status to 'sent'
          const { error: updateError } = await supabase
            .from('review_requests')
            .update({
              status: 'sent',
              sent_at: new Date().toISOString(),
              sms_message_sid: smsResult.messageSid,
            })
            .eq('id', request.id)

          if (updateError) {
            console.error(`Error updating request ${request.id}:`, updateError)
            results.push({
              id: request.id,
              customer: request.customers.name,
              status: 'sms_sent_but_db_update_failed',
              error: updateError.message,
            })
          } else {
            sentCount.success++
            results.push({
              id: request.id,
              customer: request.customers.name,
              status: 'success',
              messageSid: smsResult.messageSid,
            })
          }
        } else {
          // Mark as failed
          const { error: updateError } = await supabase
            .from('review_requests')
            .update({
              status: 'failed',
            })
            .eq('id', request.id)

          sentCount.failed++
          results.push({
            id: request.id,
            customer: request.customers.name,
            status: 'failed',
            error: smsResult.error,
          })

          if (updateError) {
            console.error(`Error updating failed request ${request.id}:`, updateError)
          }
        }

        // Add a small delay between SMS sends to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Unexpected error processing request ${request.id}:`, error)
        sentCount.failed++
        results.push({
          id: request.id,
          customer: request.customers?.name || 'Unknown',
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