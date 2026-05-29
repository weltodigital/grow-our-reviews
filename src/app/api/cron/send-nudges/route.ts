import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendSMS, createNudgeMessage, createCustomNudgeMessage } from '@/lib/twilio'
import { getCurrentBillingPeriod } from '@/lib/billing-cycle'
import { countCreditsSentInPeriod } from '@/lib/credit-usage'
import { buildReviewUrl } from '@/lib/review-url'
import { DEFAULT_TRIAL_LIMIT } from '@/lib/pricing'
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
    message: 'Processing nudge messages'
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

  try {
    // Find review requests that need nudge SMS
    // Criteria: status = 'sent', nudge_sent = false, nudge_enabled = true,
    // clicked_at is null (customer hasn't clicked yet),
    // and sent_at is older than user's nudge_delay_hours
    const { data: nudgeRequests, error: fetchError } = await supabase
      .from('review_requests')
      .select(`
        *,
        profiles!inner(
          id,
          business_name,
          google_review_url,
          nudge_enabled,
          nudge_delay_hours,
          monthly_request_limit,
          billing_cycle_date
        ),
        customers!inner(name, phone),
        feedback(id)
      `)
      .eq('status', 'sent')
      .eq('nudge_sent', false)
      .eq('profiles.nudge_enabled', true)
      .in('profiles.subscription_status', ['active', 'trialing']) // Skip cancelled users; trial users without a Stripe customer are intentionally allowed (no-card trial flow)
      .is('clicked_at', null) // Only send nudges if customer hasn't clicked yet
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
    // But don't send nudges for very old requests (older than 7 days)
    const now = new Date()
    const maxNudgeAge = 7 * 24 * 60 * 60 * 1000 // 7 days in milliseconds

    const eligibleRequests = nudgeRequests.filter((request: any) => {
      const sentAt = new Date(request.sent_at!)
      const nudgeDelayMs = (request as any).profiles.nudge_delay_hours * 60 * 60 * 1000
      const nudgeTime = new Date(sentAt.getTime() + nudgeDelayMs)
      const requestAge = now.getTime() - sentAt.getTime()

      // Check if customer has already left feedback
      const hasFeedback = request.feedback && request.feedback.length > 0

      // Must be past nudge time AND within the max age limit AND no existing feedback
      return now >= nudgeTime && requestAge <= maxNudgeAge && !hasFeedback
    })

    if (eligibleRequests.length === 0) {
      return NextResponse.json({
        message: 'No nudge messages ready to send yet',
        processed: 0,
        checking: nudgeRequests.length
      })
    }

    // Get all unique user IDs to fetch their nudge SMS templates
    const userIds = [...new Set(eligibleRequests.map((req: any) => req.profiles.id))]

    // Fetch nudge SMS templates for all users
    const { data: smsTemplates } = await (supabase as any)
      .from('sms_templates')
      .select('*')
      .in('user_id', userIds)
      .eq('type', 'nudge')
      .eq('is_active', true)

    // Create a map of user ID to template for quick lookup
    const templateMap = new Map()
    if (smsTemplates) {
      smsTemplates.forEach((template: any) => {
        templateMap.set(template.user_id, template)
      })
    }

    // Build a per-user credit budget map. A nudge costs one credit, so we must
    // refuse to send if the user is already at their monthly limit — otherwise
    // nudges would ship for free past the plan cap.
    const budgetByUser = new Map<string, { remaining: number; limit: number }>()
    await Promise.all(
      userIds.map(async (uid: string) => {
        const sample = eligibleRequests.find((r: any) => r.profiles.id === uid) as any
        const limit = sample?.profiles?.monthly_request_limit ?? DEFAULT_TRIAL_LIMIT
        const cycleDate = sample?.profiles?.billing_cycle_date

        let periodStart: Date
        let periodEnd: Date
        if (cycleDate) {
          const period = getCurrentBillingPeriod(cycleDate)
          periodStart = period.start
          periodEnd = period.end
        } else {
          const now = new Date()
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
          periodEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
        }

        const used = await countCreditsSentInPeriod(supabase, uid, periodStart, periodEnd)
        budgetByUser.set(uid, { remaining: Math.max(0, limit - used), limit })
      })
    )

    const results = []
    const sentCount = { success: 0, failed: 0 }

    // Process each eligible request
    for (const request of eligibleRequests) {
      try {
        // SECURITY: Check if customer has opted out (STOP message protection)
        const { data: suppression } = await supabase
          .from('sms_suppressions')
          .select('id')
          .eq('phone_number', (request as any).customers.phone)
          .eq('user_id', (request as any).profiles.id)
          .limit(1)
          .single()

        if (suppression) {
          // Customer has opted out - skip nudge and mark nudge_sent=true so the
          // scheduler stops retrying. Leave nudge_sent_at null because no SMS
          // actually went out — nudge_sent_at drives credit accounting and we
          // shouldn't charge for a suppressed nudge.
          const { error: suppressError } = await (supabase as any)
            .from('review_requests')
            .update({
              nudge_sent: true,
            })
            .eq('id', (request as any).id)

          if (suppressError) {
            console.error(`Error marking nudge as skipped for suppressed request ${(request as any).id}:`, suppressError)
          } else {
            console.log(`Nudge skipped for request ${(request as any).id} - customer ${(request as any).customers.phone} has opted out`)
          }

          results.push({
            requestId: (request as any).id,
            status: 'suppressed',
            reason: 'Customer has opted out'
          })
          continue // Skip to next request
        }

        // Enforce per-user monthly credit limit. If the user has no remaining
        // credits, skip the nudge (same pattern as suppression: flip nudge_sent
        // to stop retries, leave nudge_sent_at null so we don't bill them).
        const userId = (request as any).profiles.id
        const budget = budgetByUser.get(userId)
        if (budget && budget.remaining <= 0) {
          const { error: limitError } = await (supabase as any)
            .from('review_requests')
            .update({ nudge_sent: true })
            .eq('id', (request as any).id)

          if (limitError) {
            console.error(`Error marking nudge as skipped for over-limit request ${(request as any).id}:`, limitError)
          } else {
            console.log(`Nudge skipped for request ${(request as any).id} - user ${userId} at monthly credit limit (${budget.limit})`)
          }

          results.push({
            requestId: (request as any).id,
            status: 'skipped_over_limit',
            reason: `User at monthly credit limit of ${budget.limit}`,
          })
          continue
        }

        // Create the sentiment gate URL with a slug for trust signal
        const sentimentGateUrl = buildReviewUrl(
          (request as any).token,
          (request as any).profiles.business_name
        )

        // Get the user's custom nudge template
        const userTemplate = templateMap.get((request as any).profiles.id)

        // Create the nudge SMS message using custom template if available
        const message = createCustomNudgeMessage({
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

        // Send nudge SMS (pass user_id for per-user rate limiting)
        const smsResult = await sendSMS((request as any).customers.phone, message, (request as any).profiles.id)

        // Update nudge_sent status regardless of SMS success/failure
        const { error: updateError } = await (supabase as any)
          .from('review_requests')
          .update({
            nudge_sent: true,
            nudge_sent_at: new Date().toISOString(),
          })
          .eq('id', (request as any).id)

        if (updateError) {
          console.error(`Error updating nudge status for request ${(request as any).id}:`, updateError)
        }

        if (smsResult.success) {
          sentCount.success++
          const budget = budgetByUser.get(userId)
          if (budget) budget.remaining = Math.max(0, budget.remaining - 1)
          results.push({
            id: (request as any).id,
            customer: (request as any).customers.name,
            status: 'success',
            messageSid: smsResult.messageSid,
          })
        } else {
          // Handle rate limited vs other failures differently
          if (smsResult.rateLimited) {
            // For nudges, we already marked nudge_sent as true, which is correct
            // We don't want to re-send nudges if they hit rate limits
            console.log(`Nudge SMS rate limited for request ${(request as any).id}`)

            sentCount.failed++
            results.push({
              id: (request as any).id,
              customer: (request as any).customers.name,
              status: 'nudge_rate_limited',
              queuedReason: smsResult.queuedReason,
              error: smsResult.error,
            })

            // For per-user limits, continue to other users' messages
            // For platform limits, stop processing entirely
            if (smsResult.queuedReason?.includes('platform_')) {
              console.log('Platform SMS rate limit reached - stopping nudge SMS sending for this batch')
              break
            }
          } else {
            sentCount.failed++
            results.push({
              id: (request as any).id,
              customer: (request as any).customers.name,
              status: 'failed',
              error: smsResult.error,
            })
          }
        }

        // Add a small delay between SMS sends to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Unexpected error processing nudge request ${(request as any).id}:`, error)
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