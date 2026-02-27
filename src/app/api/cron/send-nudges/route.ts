import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, createNudgeMessage } from '@/lib/twilio'
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
    message: 'Processing nudge messages'
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
    // Find review requests that need nudge SMS
    // Criteria: status = 'sent', nudge_sent = false, nudge_enabled = true,
    // and sent_at is older than user's nudge_delay_hours
    const { data: nudgeRequests, error: fetchError } = await supabase
      .from('review_requests')
      .select(`
        *,
        profiles!inner(
          business_name,
          google_review_url,
          nudge_enabled,
          nudge_delay_hours
        ),
        customers!inner(name, phone)
      `)
      .eq('status', 'sent')
      .eq('nudge_sent', false)
      .eq('profiles.nudge_enabled', true)
      .not('sent_at', 'is', null)
      .limit(50) // Process in batches

    if (fetchError) {
      console.error('Error fetching nudge requests:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch nudge requests' },
        { status: 500 }
      )
    }

    if (!nudgeRequests || nudgeRequests.length === 0) {
      return NextResponse.json({
        message: 'No nudge messages to send',
        processed: 0
      })
    }

    // Filter requests that are past their nudge delay time
    const now = new Date()
    const eligibleRequests = nudgeRequests.filter((request: any) => {
      const sentAt = new Date(request.sent_at!)
      const nudgeDelayMs = request.profiles.nudge_delay_hours * 60 * 60 * 1000
      const nudgeTime = new Date(sentAt.getTime() + nudgeDelayMs)

      return now >= nudgeTime
    })

    if (eligibleRequests.length === 0) {
      return NextResponse.json({
        message: 'No nudge messages ready to send yet',
        processed: 0,
        checking: nudgeRequests.length
      })
    }

    const results = []
    const sentCount = { success: 0, failed: 0 }

    // Process each eligible request
    for (const request of eligibleRequests) {
      try {
        // Create the sentiment gate URL
        const sentimentGateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${(request as any).token}`

        // Create the nudge SMS message
        const message = createNudgeMessage({
          customerName: request.customers.name,
          businessName: request.profiles.business_name,
          sentimentGateUrl,
        })

        // Send nudge SMS
        const smsResult = await sendSMS(request.customers.phone, message)

        // Update nudge_sent status regardless of SMS success/failure
        const { error: updateError } = await supabase
          .from('review_requests')
          .update({
            nudge_sent: true,
            nudge_sent_at: new Date().toISOString(),
          })
          .eq('id', request.id)

        if (updateError) {
          console.error(`Error updating nudge status for request ${request.id}:`, updateError)
        }

        if (smsResult.success) {
          sentCount.success++
          results.push({
            id: request.id,
            customer: request.customers.name,
            status: 'success',
            messageSid: smsResult.messageSid,
          })
        } else {
          sentCount.failed++
          results.push({
            id: request.id,
            customer: request.customers.name,
            status: 'failed',
            error: smsResult.error,
          })
        }

        // Add a small delay between SMS sends to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Unexpected error processing nudge request ${request.id}:`, error)
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
    console.log(`Nudge SMS Cron Summary: ${sentCount.success} sent, ${sentCount.failed} failed`)

    response = NextResponse.json({
      message: 'Nudge SMS sending completed',
      processed: eligibleRequests.length,
      success: sentCount.success,
      failed: sentCount.failed,
      results,
    })
    return response

  } catch (error) {
    console.error('Unexpected error in nudge SMS cron:', error)
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