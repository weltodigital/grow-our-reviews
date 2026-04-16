import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { protectAdminEndpoint } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // SECURITY: Protect admin endpoint
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

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
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

    // Get abuse monitoring statistics
    const [
      highRiskUploads,
      flaggedAccounts,
      activeRestrictions,
      recentUploadStats,
      topRiskUsers
    ] = await Promise.all([
      // High risk uploads in last 24h
      (supabase as any)
        .from('bulk_upload_log')
        .select('*')
        .gte('risk_score', 60)
        .gte('created_at', oneDayAgo.toISOString())
        .order('risk_score', { ascending: false }),

      // Flagged accounts (unresolved)
      (supabase as any)
        .from('account_flags')
        .select(`
          *,
          profiles!inner(business_name, email, created_at)
        `)
        .is('resolved_at', null)
        .order('created_at', { ascending: false }),

      // Active restrictions
      (supabase as any)
        .from('account_restrictions')
        .select(`
          *,
          profiles!inner(business_name, email)
        `)
        .eq('is_active', true)
        .order('created_at', { ascending: false }),

      // Recent upload statistics
      (supabase as any)
        .from('bulk_upload_log')
        .select('upload_size, risk_score, status, created_at')
        .gte('created_at', oneWeekAgo.toISOString()),

      // Top risk users
      (supabase as any)
        .rpc('get_top_risk_users', { days_ago: 7 })
    ])

    // Calculate summary statistics
    const uploadStats = recentUploadStats.data || []
    const totalUploads = uploadStats.length
    const blockedUploads = uploadStats.filter((u: any) => u.status === 'blocked').length
    const flaggedUploads = uploadStats.filter((u: any) => u.status === 'flagged').length
    const averageRiskScore = totalUploads > 0
      ? uploadStats.reduce((sum: number, u: any) => sum + (u.risk_score || 0), 0) / totalUploads
      : 0

    // Risk distribution
    const riskDistribution = {
      low: uploadStats.filter((u: any) => (u.risk_score || 0) < 40).length,
      medium: uploadStats.filter((u: any) => (u.risk_score || 0) >= 40 && (u.risk_score || 0) < 60).length,
      high: uploadStats.filter((u: any) => (u.risk_score || 0) >= 60 && (u.risk_score || 0) < 80).length,
      critical: uploadStats.filter((u: any) => (u.risk_score || 0) >= 80).length
    }

    // Determine system health
    const blockRate = totalUploads > 0 ? (blockedUploads / totalUploads) * 100 : 0
    const flagRate = totalUploads > 0 ? (flaggedUploads / totalUploads) * 100 : 0

    let healthStatus: 'good' | 'warning' | 'critical' = 'good'
    const alerts: string[] = []

    if (blockRate > 10) {
      healthStatus = 'critical'
      alerts.push(`High block rate: ${blockRate.toFixed(1)}% of uploads blocked`)
    } else if (blockRate > 5) {
      healthStatus = 'warning'
      alerts.push(`Elevated block rate: ${blockRate.toFixed(1)}% of uploads blocked`)
    }

    if (flaggedAccounts.data && flaggedAccounts.data.length > 10) {
      healthStatus = healthStatus === 'critical' ? 'critical' : 'warning'
      alerts.push(`${flaggedAccounts.data.length} accounts need review`)
    }

    if (averageRiskScore > 50) {
      healthStatus = 'warning'
      alerts.push(`High average risk score: ${averageRiskScore.toFixed(1)}`)
    }

    return NextResponse.json({
      timestamp: now.toISOString(),
      healthStatus,
      alerts,

      // Summary statistics
      summary: {
        totalUploads,
        blockedUploads,
        flaggedUploads,
        blockRate: Math.round(blockRate * 10) / 10,
        flagRate: Math.round(flagRate * 10) / 10,
        averageRiskScore: Math.round(averageRiskScore * 10) / 10,
        activeFlagsCount: flaggedAccounts.data?.length || 0,
        activeRestrictionsCount: activeRestrictions.data?.length || 0
      },

      // Risk distribution
      riskDistribution,

      // Recent high-risk uploads
      highRiskUploads: (highRiskUploads.data || []).slice(0, 10),

      // Flagged accounts needing review
      flaggedAccounts: (flaggedAccounts.data || []).slice(0, 20),

      // Active restrictions
      activeRestrictions: (activeRestrictions.data || []).slice(0, 10),

      // Top risk users
      topRiskUsers: (topRiskUsers.data || []).slice(0, 10),

      // System configuration
      thresholds: {
        riskScoreBlocking: 80,
        riskScoreFlagging: 60,
        maxUploadSizeWithoutReview: 500,
        maxWeeklyUploadsPerUser: 10
      },

      // Recommendations based on current state
      recommendations: generateRecommendations({
        totalUploads,
        blockedUploads,
        flaggedUploads,
        flaggedAccountsCount: flaggedAccounts.data?.length || 0,
        averageRiskScore,
        alerts
      })
    })

  } catch (error) {
    console.error('Error fetching abuse monitor data:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

function generateRecommendations(stats: {
  totalUploads: number
  blockedUploads: number
  flaggedUploads: number
  flaggedAccountsCount: number
  averageRiskScore: number
  alerts: string[]
}): string[] {
  const recommendations: string[] = []

  if (stats.flaggedAccountsCount > 5) {
    recommendations.push('Review flagged accounts and resolve flags to maintain system health')
  }

  if (stats.blockedUploads > stats.totalUploads * 0.1) {
    recommendations.push('High block rate detected - review blocking thresholds or investigate coordinated abuse')
  }

  if (stats.averageRiskScore > 40) {
    recommendations.push('Elevated risk scores - monitor for new abuse patterns and update detection algorithms')
  }

  if (stats.alerts.length === 0 && stats.totalUploads > 50) {
    recommendations.push('System operating normally - continue monitoring for emerging threats')
  }

  if (stats.totalUploads < 10) {
    recommendations.push('Low activity period - use this time for system maintenance and policy review')
  }

  return recommendations
}