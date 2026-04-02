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

    const now = new Date()
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Get rate limiting statistics
    const [
      totalSubmissions,
      blockedSubmissions,
      uniqueIPs,
      topIPs,
      suspiciousTokens
    ] = await Promise.all([
      // Total submissions in last 24h
      supabase
        .from('feedback_rate_limit_log')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', oneDayAgo.toISOString()),

      // Blocked submissions in last 24h
      supabase
        .from('feedback_rate_limit_log')
        .select('id', { count: 'exact', head: true })
        .eq('allowed', false)
        .gte('created_at', oneDayAgo.toISOString()),

      // Unique IPs in last 24h
      supabase
        .from('feedback_rate_limit_log')
        .select('ip')
        .gte('created_at', oneDayAgo.toISOString()),

      // Top IPs by submission count (last 24h)
      (supabase as any)
        .rpc('get_top_feedback_ips', { hours_ago: 24 }),

      // Tokens with multiple submissions
      (supabase as any)
        .rpc('get_tokens_with_multiple_feedback', { hours_ago: 24 })
    ])

    // Calculate unique IPs
    const uniqueIPCount = uniqueIPs.data
      ? new Set(uniqueIPs.data.map((row: any) => row.ip)).size
      : 0

    // Calculate block rate
    const totalCount = totalSubmissions.count || 0
    const blockedCount = blockedSubmissions.count || 0
    const blockRate = totalCount > 0 ? (blockedCount / totalCount) * 100 : 0

    // Determine health status
    let healthStatus: 'good' | 'warning' | 'critical' = 'good'
    const alerts: string[] = []

    if (blockRate > 50) {
      healthStatus = 'critical'
      alerts.push(`High block rate: ${blockRate.toFixed(1)}%`)
    } else if (blockRate > 20) {
      healthStatus = 'warning'
      alerts.push(`Elevated block rate: ${blockRate.toFixed(1)}%`)
    }

    // Check for high volume IPs
    if (topIPs.data) {
      const highVolumeIPs = (topIPs.data as any[]).filter((ip: any) => ip.submission_count > 20)
      if (highVolumeIPs.length > 0) {
        healthStatus = 'warning'
        alerts.push(`${highVolumeIPs.length} IP(s) with >20 submissions`)
      }
    }

    // Check for tokens with suspicious activity
    if (suspiciousTokens.data && (suspiciousTokens.data as any[]).length > 5) {
      alerts.push(`${(suspiciousTokens.data as any[]).length} tokens with multiple submissions`)
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      healthStatus,
      alerts,

      // Summary statistics
      summary: {
        totalSubmissions: totalCount,
        allowedSubmissions: totalCount - blockedCount,
        blockedSubmissions: blockedCount,
        blockRate: Math.round(blockRate * 10) / 10,
        uniqueIPs: uniqueIPCount
      },

      // Top offending IPs
      topIPs: (topIPs.data as any[])?.slice(0, 10) || [],

      // Suspicious tokens (multiple submissions)
      suspiciousTokens: (suspiciousTokens.data as any[])?.slice(0, 10) || [],

      // Recent activity (last hour)
      recentActivity: {
        hourlySubmissions: await getHourlySubmissions(supabase, oneHourAgo),
        hourlyBlocked: await getHourlyBlocked(supabase, oneHourAgo)
      },

      // Rate limiting configuration
      limits: {
        maxSubmissionsPerToken: 5,
        maxSubmissionsPerIP: 50,
        timeWindow: '1 hour'
      },

      // Recommendations
      recommendations: totalCount > 100 ? [
        blockRate > 30 ? 'Consider implementing additional bot protection' : null,
        uniqueIPCount < totalCount / 10 ? 'Low IP diversity - possible bot activity' : null,
        'Monitor for patterns in blocked submissions'
      ].filter(Boolean) : ['Monitoring feedback submissions for abuse patterns']
    })

  } catch (error) {
    console.error('Error fetching feedback abuse monitor data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function getHourlySubmissions(supabase: any, oneHourAgo: Date) {
  const { count } = await supabase
    .from('feedback_rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', oneHourAgo.toISOString())

  return count || 0
}

async function getHourlyBlocked(supabase: any, oneHourAgo: Date) {
  const { count } = await supabase
    .from('feedback_rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .eq('allowed', false)
    .gte('created_at', oneHourAgo.toISOString())

  return count || 0
}