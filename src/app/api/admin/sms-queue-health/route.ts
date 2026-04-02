import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    // Use service role key for admin access
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

    const now = new Date().toISOString()
    const SMS_BATCH_SIZE = parseInt(process.env.SMS_BATCH_SIZE || '50')

    // Get current queue metrics
    const [
      pendingCount,
      queuedCount,
      scheduledCount,
      recentlyFailedCount
    ] = await Promise.all([
      // Total pending messages (ready to send)
      supabase
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .in('status', ['scheduled', 'queued'])
        .lte('scheduled_for', now),

      // Queued messages (rate limited)
      supabase
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'queued'),

      // Future scheduled messages
      supabase
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'scheduled')
        .gt('scheduled_for', now),

      // Recently failed messages (last 24 hours)
      supabase
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'failed')
        .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
    ])

    const totalPending = pendingCount.count || 0
    const totalQueued = queuedCount.count || 0
    const totalScheduled = scheduledCount.count || 0
    const totalRecentlyFailed = recentlyFailedCount.count || 0

    // Calculate capacity metrics
    const batchesPerHour = 12 // Every 5 minutes
    const hourlyCapacity = SMS_BATCH_SIZE * batchesPerHour
    const dailyCapacity = hourlyCapacity * 24

    // Calculate processing times
    const hoursToProcessPending = totalPending > 0 ? Math.ceil(totalPending / hourlyCapacity) : 0
    const hoursUntilOverload = Math.floor((SMS_BATCH_SIZE * 3 - totalPending) / hourlyCapacity)

    // Determine queue health
    let queueHealth: 'good' | 'warning' | 'critical' = 'good'
    let healthMessage = 'Queue processing normally'

    if (totalPending > SMS_BATCH_SIZE * 6) {
      queueHealth = 'critical'
      healthMessage = `Critical: ${totalPending} messages pending, >6x batch size. Immediate action required!`
    } else if (totalPending > SMS_BATCH_SIZE * 3) {
      queueHealth = 'warning'
      healthMessage = `Warning: ${totalPending} messages pending, >3x batch size. Monitor closely.`
    } else if (totalPending > SMS_BATCH_SIZE) {
      healthMessage = `${totalPending} messages pending, processing normally but above batch size`
    }

    // Get breakdown by status for last 24 hours
    const { data: recentActivity } = await (supabase as any)
      .from('review_requests')
      .select('status, count(*)')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .not('status', 'in', ['clicked', 'reviewed', 'feedback_given'])

    // Calculate failure rate
    const totalProcessed = totalPending + totalRecentlyFailed
    const failureRate = totalProcessed > 0 ? (totalRecentlyFailed / totalProcessed * 100) : 0

    return NextResponse.json({
      timestamp: now,
      queueHealth,
      healthMessage,

      // Current queue state
      queue: {
        pending: totalPending,           // Ready to send now
        queued: totalQueued,             // Rate limited, waiting
        scheduled: totalScheduled,       // Future scheduled
        recentlyFailed: totalRecentlyFailed
      },

      // Capacity and performance metrics
      capacity: {
        batchSize: SMS_BATCH_SIZE,
        batchesPerHour: batchesPerHour,
        hourlyCapacity: hourlyCapacity,
        dailyCapacity: dailyCapacity,
        utilizationPercent: totalPending > 0 ? Math.round((totalPending / hourlyCapacity) * 100) : 0
      },

      // Timing projections
      processing: {
        hoursToProcessPending: hoursToProcessPending,
        hoursUntilOverload: hoursUntilOverload > 0 ? hoursUntilOverload : 0,
        estimatedCompletionTime: totalPending > 0
          ? new Date(Date.now() + hoursToProcessPending * 60 * 60 * 1000).toISOString()
          : null
      },

      // Health indicators
      health: {
        failureRate: Math.round(failureRate * 10) / 10, // Round to 1 decimal
        queueBackup: totalPending > SMS_BATCH_SIZE * 3,
        criticalBackup: totalPending > SMS_BATCH_SIZE * 6,

        // Recommendations
        recommendations: totalPending > SMS_BATCH_SIZE * 3 ? [
          totalPending > SMS_BATCH_SIZE * 6
            ? 'URGENT: Increase SMS_BATCH_SIZE environment variable'
            : 'Consider increasing SMS_BATCH_SIZE environment variable',
          'Monitor queue depth regularly',
          hoursToProcessPending > 2 ? 'Consider more frequent cron schedule' : null
        ].filter(Boolean) : []
      }
    })

  } catch (error) {
    console.error('Error fetching SMS queue health:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}