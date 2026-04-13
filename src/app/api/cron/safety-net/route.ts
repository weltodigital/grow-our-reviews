import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

// Safety net cron job to catch and fix requests stuck in "scheduled" status
// Runs every 30 minutes to prevent silent failures from killing user experience

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

  console.log('🚨 Safety net: Checking for overdue scheduled requests...')

  try {
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

    const now = new Date()
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000)

    // Find requests that are overdue (scheduled >2 hours ago but still "scheduled")
    const { data: overdueRequests, error: fetchError } = await (supabase as any)
      .from('review_requests')
      .select(`
        id,
        user_id,
        customer_id,
        status,
        scheduled_for,
        created_at,
        profiles!inner(email, business_name),
        customers!inner(name, phone)
      `)
      .eq('status', 'scheduled')
      .lt('scheduled_for', twoHoursAgo.toISOString())
      .order('scheduled_for', { ascending: true })

    if (fetchError) {
      console.error('Safety net: Error fetching overdue requests:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch overdue requests' }, { status: 500 })
    }

    if (!overdueRequests || overdueRequests.length === 0) {
      console.log('✅ Safety net: No overdue requests found')
      return NextResponse.json({
        message: 'No overdue requests found',
        overdueCount: 0
      })
    }

    console.warn(`🚨 Safety net: Found ${overdueRequests.length} overdue requests`)

    // Analyze first-time users affected (critical for churn prevention)
    const firstTimeUsersAffected = []
    const userIds = [...new Set(overdueRequests.map((req: any) => req.user_id))]

    for (const userId of userIds) {
      const { data: successfulRequests } = await (supabase as any)
        .from('review_requests')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['sent', 'clicked', 'reviewed', 'feedback_given'])
        .limit(1)

      // If no successful requests, this is a first-time user - CRITICAL
      if (!successfulRequests || successfulRequests.length === 0) {
        const userRequest = overdueRequests.find((req: any) => req.user_id === userId)
        if (userRequest) {
          firstTimeUsersAffected.push({
            userId: String(userId),
            email: String(userRequest.profiles.email),
            businessName: String(userRequest.profiles.business_name),
            requestId: String(userRequest.id),
            hoursOverdue: Math.round((now.getTime() - new Date(userRequest.scheduled_for).getTime()) / (1000 * 60 * 60))
          })
        }
      }
    }

    // IMMEDIATE ACTION: Queue overdue requests for immediate processing
    const requestIds = overdueRequests.map((req: any) => req.id)

    const { data: updatedRequests, error: updateError } = await (supabase as any)
      .from('review_requests')
      .update({
        status: 'queued',
        queued_reason: 'safety_net_recovery',
        queued_at: now.toISOString()
      })
      .in('id', requestIds)
      .eq('status', 'scheduled') // Safety check to prevent race conditions

    if (updateError) {
      console.error('Safety net: Error updating overdue requests:', updateError)

      // Send critical alert email for failed recovery
      await sendCriticalAlert({
        type: 'recovery_failed',
        overdueCount: overdueRequests.length,
        firstTimeUsersCount: firstTimeUsersAffected.length,
        error: updateError.message,
        affectedUsers: firstTimeUsersAffected
      })

      return NextResponse.json({ error: 'Failed to recover overdue requests' }, { status: 500 })
    }

    const recoveredCount = updatedRequests?.length || 0
    console.log(`✅ Safety net: Recovered ${recoveredCount} overdue requests`)

    // Send alert if first-time users are affected (high priority)
    if (firstTimeUsersAffected.length > 0) {
      await sendCriticalAlert({
        type: 'first_time_users_affected',
        overdueCount: overdueRequests.length,
        firstTimeUsersCount: firstTimeUsersAffected.length,
        recoveredCount,
        affectedUsers: firstTimeUsersAffected
      })
    }

    // Send warning alert for large numbers of overdue requests
    if (overdueRequests.length >= 10) {
      await sendCriticalAlert({
        type: 'high_volume_overdue',
        overdueCount: overdueRequests.length,
        firstTimeUsersCount: firstTimeUsersAffected.length,
        recoveredCount
      })
    }

    // Track metrics for monitoring
    try {
      const { healthMetrics } = await import('@/lib/health-metrics')
      await healthMetrics.increment('safety_net_recoveries', recoveredCount)
      if (firstTimeUsersAffected.length > 0) {
        await healthMetrics.increment('first_user_failures_caught', firstTimeUsersAffected.length)
      }
    } catch (metricsError) {
      console.error('Failed to track safety net metrics:', metricsError)
    }

    return NextResponse.json({
      message: 'Safety net recovery completed',
      overdueFound: overdueRequests.length,
      recovered: recoveredCount,
      firstTimeUsersAffected: firstTimeUsersAffected.length,
      criticalAlert: firstTimeUsersAffected.length > 0 || overdueRequests.length >= 10
    })

  } catch (error) {
    console.error('Safety net: Unexpected error:', error)

    // Send critical system alert
    await sendCriticalAlert({
      type: 'system_error',
      error: error instanceof Error ? error.message : 'Unknown error'
    })

    return NextResponse.json({ error: 'Safety net system error' }, { status: 500 })
  }
}

// Send critical alerts for safety net issues
async function sendCriticalAlert(alertData: {
  type: 'first_time_users_affected' | 'high_volume_overdue' | 'recovery_failed' | 'system_error'
  overdueCount?: number
  firstTimeUsersCount?: number
  recoveredCount?: number
  affectedUsers?: Array<{ userId: string; email: string; businessName: string; hoursOverdue: number }>
  error?: string
}) {
  try {
    console.log('🚨 Sending critical safety net alert:', alertData.type)

    // Import email function
    const { sendInternalAlert } = await import('@/lib/resend')

    let subject: string
    let message: string

    switch (alertData.type) {
      case 'first_time_users_affected':
        subject = `🚨 CRITICAL: ${alertData.firstTimeUsersCount} first-time users have stuck SMS requests`
        message = `
Safety net detected ${alertData.firstTimeUsersCount} first-time users with overdue SMS requests.
This is CRITICAL for user retention - their first experience is failing.

Total overdue requests: ${alertData.overdueCount}
Recovered: ${alertData.recoveredCount}

Affected first-time users:
${alertData.affectedUsers?.map(u =>
  `- ${u.businessName} (${u.email}) - ${u.hoursOverdue}h overdue`
).join('\n') || 'N/A'}

Action taken: Requests moved to queue for immediate processing.
Recommended: Check cron job health and consider user outreach.
`
        break

      case 'high_volume_overdue':
        subject = `⚠️ WARNING: ${alertData.overdueCount} SMS requests were stuck in scheduled status`
        message = `
Safety net recovered ${alertData.overdueCount} overdue SMS requests.
This indicates a potential system issue with the main SMS cron job.

First-time users affected: ${alertData.firstTimeUsersCount}
Recovered: ${alertData.recoveredCount}

Recommended actions:
1. Check SMS cron job logs
2. Verify Twilio credentials
3. Check CRON_SECRET configuration
4. Monitor for repeat issues
`
        break

      case 'recovery_failed':
        subject = `🔥 CRITICAL: Safety net recovery FAILED for ${alertData.overdueCount} requests`
        message = `
Safety net detected ${alertData.overdueCount} overdue requests but FAILED to recover them.
First-time users affected: ${alertData.firstTimeUsersCount}

Error: ${alertData.error}

IMMEDIATE ACTION REQUIRED:
1. Check database connectivity
2. Manual intervention needed for stuck requests
3. Consider user communication for affected accounts
`
        break

      case 'system_error':
        subject = `🔥 CRITICAL: Safety net system error`
        message = `
Safety net cron job encountered a system error and could not complete.

Error: ${alertData.error}

IMMEDIATE ACTION REQUIRED:
1. Check safety net cron job configuration
2. Verify database access
3. Manual check for overdue requests needed
`
        break
    }

    await sendInternalAlert('Safety Net Alert', subject, message)
    console.log('✅ Critical alert sent successfully')

  } catch (alertError) {
    console.error('Failed to send critical safety net alert:', alertError)
    // Don't throw - we don't want alert failures to break the safety net
  }
}