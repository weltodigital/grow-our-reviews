import { NextResponse } from 'next/server'
import { healthMetrics } from '@/lib/health-metrics'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

// Real-time health status endpoint for admin dashboard
export async function GET() {
  try {
    const today = new Date().toISOString().split('T')[0]
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    const now = new Date().toISOString()

    // Get SMS queue depth for real-time monitoring
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

    const [todayMetrics, yesterdayMetrics, weeklyTrend, queueDepth] = await Promise.all([
      healthMetrics.getDailyMetrics(today),
      healthMetrics.getDailyMetrics(yesterdayStr),
      healthMetrics.getWeeklyTrend(),
      // Check current SMS queue depth
      supabase
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .in('status', ['scheduled', 'queued'])
        .lte('scheduled_for', now)
    ])

    // SMS queue metrics for scalability monitoring
    const SMS_BATCH_SIZE = parseInt(process.env.SMS_BATCH_SIZE || '50')
    const currentQueueDepth = queueDepth.count || 0

    // Quick health status indicators
    const status = {
      sms: {
        today: todayMetrics.sms_sent,
        failed: todayMetrics.sms_failed,
        queueDepth: currentQueueDepth,
        queueHealth: currentQueueDepth > SMS_BATCH_SIZE * 6 ? 'critical' :
                     currentQueueDepth > SMS_BATCH_SIZE * 3 ? 'warning' : 'healthy',
        status: currentQueueDepth > SMS_BATCH_SIZE * 6 ? 'critical' :
                currentQueueDepth > SMS_BATCH_SIZE * 3 ? 'warning' :
                todayMetrics.sms_failed > todayMetrics.sms_sent * 0.1 ? 'warning' : 'healthy'
      },
      webhooks: {
        today: todayMetrics.webhooks_processed,
        failed: todayMetrics.webhooks_failed,
        status: todayMetrics.webhooks_failed > 0 ? 'warning' : 'healthy'
      },
      reconciliation: {
        lastRun: yesterdayMetrics.reconciliation_run > 0 ? yesterdayStr : 'missing',
        issues: yesterdayMetrics.reconciliation_issues,
        status: yesterdayMetrics.reconciliation_run === 0 ? 'critical' :
                yesterdayMetrics.reconciliation_issues > 0 ? 'warning' : 'healthy'
      },
      overall: 'healthy' // Will be updated based on individual services
    }

    // Determine overall status
    const services = [status.sms, status.webhooks, status.reconciliation]
    if (services.some(s => s.status === 'critical')) {
      status.overall = 'critical'
    } else if (services.some(s => s.status === 'warning')) {
      status.overall = 'warning'
    }

    return NextResponse.json({
      status,
      metrics: {
        today: todayMetrics,
        yesterday: yesterdayMetrics
      },
      trend: weeklyTrend.slice(-7) // Last 7 days
    })

  } catch (error: any) {
    console.error('Health status check failed:', error)
    return NextResponse.json(
      {
        status: { overall: 'critical' },
        error: 'Health check failed',
        details: error.message
      },
      { status: 500 }
    )
  }
}