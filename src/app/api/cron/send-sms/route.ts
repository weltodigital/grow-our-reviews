import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, createInitialReviewMessage, createCustomInitialMessage } from '@/lib/twilio'
import { buildReviewUrl } from '@/lib/review-url'
import { redactPhone } from '@/lib/redact'
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

    // SCALABILITY: Configurable batch size based on environment variable
    // Default 50, but can be increased as user base grows
    const SMS_BATCH_SIZE = parseInt(process.env.SMS_BATCH_SIZE || '50')
    console.log(`SMS cron processing up to ${SMS_BATCH_SIZE} messages this batch`)

    // MONITORING: Check queue depth before processing for capacity planning
    const { count: totalPendingCount, error: countError } = await (supabase as any)
      .from('review_requests')
      .select('id', { count: 'exact', head: true })
      .in('status', ['scheduled', 'queued'])
      .lte('scheduled_for', now)

    if (totalPendingCount && totalPendingCount > 0) {
      console.log(`Queue depth: ${totalPendingCount} messages pending (processing ${Math.min(SMS_BATCH_SIZE, totalPendingCount)})`)

      // ALERT: Log warnings if queue is backing up
      if (totalPendingCount > SMS_BATCH_SIZE * 3) {
        console.warn(`🚨 SMS QUEUE WARNING: ${totalPendingCount} messages pending, >3x batch size. Consider increasing batch size or frequency.`)
      }
      if (totalPendingCount > SMS_BATCH_SIZE * 6) {
        console.error(`🚨 SMS QUEUE CRITICAL: ${totalPendingCount} messages pending, >6x batch size. Queue backup detected!`)
      }
    }

    // Get review requests - both scheduled and queued messages
    // Priority order:
    // 1. Scheduled messages by scheduled_for (oldest first)
    // 2. Queued messages by scheduled_for (oldest first)
    // This ensures fair FIFO processing regardless of status
    const { data: reviewRequests, error: fetchError } = await (supabase as any)
      .from('review_requests')
      .select('*')
      .in('status', ['scheduled', 'queued'])
      .lte('scheduled_for', now)
      .order('scheduled_for', { ascending: true })
      .order('created_at', { ascending: true }) // Secondary sort for same scheduled_for
      .limit(SMS_BATCH_SIZE)

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

    // Fetch profiles and customers separately. Skip cancelled users so their
    // queued/scheduled requests don't keep firing SMS after they've stopped
    // paying. We deliberately don't require stripe_customer_id here — under
    // the no-card 7-day trial, trial users have a valid subscription_status
    // of 'trialing' and need to be able to send SMS without a Stripe customer.
    // The auth guard already blocks trial users whose trial has expired.
    const { data: profiles, error: profilesError } = await (supabase as any)
      .from('profiles')
      .select('id, business_name, google_review_url')
      .in('id', userIds)
      .in('subscription_status', ['active', 'trialing'])

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

    // For fairness, interleave requests from different users if we have queued messages
    // This prevents one user's bulk upload from monopolizing the queue
    const hasQueuedMessages = pendingRequests.some((req: any) => req.status === 'queued')

    if (hasQueuedMessages && pendingRequests.length > 10) {
      // Group by user_id while maintaining order within each user's messages
      const userGroups = new Map()
      pendingRequests.forEach((req: any) => {
        if (!userGroups.has(req.user_id)) {
          userGroups.set(req.user_id, [])
        }
        userGroups.get(req.user_id).push(req)
      })

      // Round-robin through users to create a fair interleaved order
      const interleavedRequests = []
      const userArrays = Array.from(userGroups.values())
      let maxLength = Math.max(...userArrays.map((arr: any[]) => arr.length))

      for (let i = 0; i < maxLength; i++) {
        for (const userArray of userArrays) {
          if (i < userArray.length) {
            interleavedRequests.push(userArray[i])
          }
        }
      }

      console.log(`Interleaved ${pendingRequests.length} requests from ${userGroups.size} users for fairness`)
      pendingRequests.splice(0, pendingRequests.length, ...interleavedRequests)
    }

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
        // SECURITY: Check if customer has opted out (STOP message protection)
        const { data: suppression } = await supabase
          .from('sms_suppressions')
          .select('id')
          .eq('phone_number', (request as any).customers.phone)
          .eq('user_id', (request as any).user_id)
          .limit(1)
          .single()

        if (suppression) {
          // Customer has opted out - mark as suppressed and skip
          const { error: suppressError } = await (supabase as any)
            .from('review_requests')
            .update({ status: 'suppressed' })
            .eq('id', (request as any).id)

          if (suppressError) {
            console.error(`Error marking request ${(request as any).id} as suppressed:`, suppressError)
          } else {
            console.log(`Request ${(request as any).id} suppressed - customer ${redactPhone((request as any).customers.phone)} has opted out`)
          }

          results.push({
            requestId: (request as any).id,
            status: 'suppressed',
            reason: 'Customer has opted out'
          })
          continue // Skip to next request
        }

        // Create the sentiment gate URL with a slug for trust signal
        const sentimentGateUrl = buildReviewUrl(
          (request as any).token,
          (request as any).profiles.business_name
        )

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

        // Send SMS (pass user_id for per-user rate limiting)
        const smsResult = await sendSMS((request as any).customers.phone, message, (request as any).user_id)

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
          // Handle rate limited vs other failures differently
          if (smsResult.rateLimited) {
            // Mark as queued with reason instead of keeping as scheduled
            const { error: updateError } = await (supabase as any)
              .from('review_requests')
              .update({
                status: 'queued',
                queued_reason: smsResult.queuedReason || 'rate_limited',
                queued_at: new Date().toISOString()
              })
              .eq('id', (request as any).id)

            console.log(`SMS rate limited for request ${(request as any).id}, marked as queued`)

            sentCount.failed++
            results.push({
              id: (request as any).id,
              customer: (request as any).customers.name,
              status: 'queued',
              queuedReason: smsResult.queuedReason,
              error: smsResult.error,
            })

            if (updateError) {
              console.error(`Error updating queued request ${(request as any).id}:`, updateError)
            }

            // For per-user limits, continue to other users' messages
            // For platform limits, stop processing entirely
            if (smsResult.queuedReason?.includes('platform_')) {
              console.log('Platform SMS rate limit reached - stopping SMS sending for this batch')
              break
            }
          } else {
            // Mark as failed for other errors (invalid phone number, etc.)
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

    // Track health metrics
    try {
      const { healthMetrics } = await import('@/lib/health-metrics')
      await healthMetrics.increment('sms_sent', sentCount.success)
      if (sentCount.failed > 0) {
        await healthMetrics.increment('sms_failed', sentCount.failed)
      }
      // Note: Queue depth is tracked in real-time via direct database queries
      // in health status endpoints, not as daily metrics
    } catch (error) {
      console.error('Failed to track health metrics:', error)
    }

    // SCALABILITY METRICS: Calculate queue backup risk
    const remainingAfterBatch = Math.max(0, (totalPendingCount || 0) - pendingRequests.length)
    const hoursToProcessRemaining = remainingAfterBatch > 0 ? Math.ceil(remainingAfterBatch / (SMS_BATCH_SIZE * 12)) : 0

    response = NextResponse.json({
      message: 'SMS sending completed',
      processed: pendingRequests.length,
      success: sentCount.success,
      failed: sentCount.failed,
      queueMetrics: {
        totalPending: totalPendingCount || 0,
        remainingAfterBatch: remainingAfterBatch,
        hoursToProcessRemaining: hoursToProcessRemaining,
        batchSize: SMS_BATCH_SIZE,
        queueHealth: totalPendingCount ? (
          totalPendingCount > SMS_BATCH_SIZE * 6 ? 'critical' :
          totalPendingCount > SMS_BATCH_SIZE * 3 ? 'warning' : 'good'
        ) : 'good'
      },
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