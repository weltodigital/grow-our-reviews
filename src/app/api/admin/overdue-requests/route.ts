import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { protectAdminEndpoint } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // SECURITY: Protect admin endpoint
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

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
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    // Find requests that are overdue (scheduled >2 hours ago but still "scheduled")
    const { data: overdueRequests, error: overdueError } = await (supabase as any)
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

    if (overdueError) {
      console.error('Error fetching overdue requests:', overdueError)
      return NextResponse.json({ error: 'Failed to fetch overdue requests' }, { status: 500 })
    }

    // Find first-time users with stuck requests (especially critical)
    const firstTimeUsersWithIssues = []

    if (overdueRequests?.length > 0) {
      // Check which overdue users have never had a successful send
      const userIds = [...new Set(overdueRequests.map((req: any) => req.user_id))]

      for (const userId of userIds) {
        const { data: successfulRequests } = await (supabase as any)
          .from('review_requests')
          .select('id')
          .eq('user_id', userId)
          .in('status', ['sent', 'clicked', 'reviewed', 'feedback_given'])
          .limit(1)

        // If no successful requests, this is a first-time user with issues
        if (!successfulRequests || successfulRequests.length === 0) {
          const userOverdueRequests = overdueRequests.filter((req: any) => req.user_id === userId)
          firstTimeUsersWithIssues.push({
            userId,
            userEmail: userOverdueRequests[0].profiles.email,
            businessName: userOverdueRequests[0].profiles.business_name,
            overdueCount: userOverdueRequests.length,
            oldestRequest: userOverdueRequests[0]
          })
        }
      }
    }

    // Calculate severity
    const criticalThreshold = 10  // >10 overdue requests = critical
    const warningThreshold = 3   // >3 overdue requests = warning

    let severity: 'healthy' | 'warning' | 'critical' = 'healthy'
    if (overdueRequests.length >= criticalThreshold) {
      severity = 'critical'
    } else if (overdueRequests.length >= warningThreshold) {
      severity = 'warning'
    }

    // Group overdue requests by age for better analysis
    const overdueAnalysis = {
      total: overdueRequests.length,
      byAge: {
        '2-6_hours': overdueRequests.filter((req: any) => {
          const scheduledTime = new Date(req.scheduled_for)
          const hoursOverdue = (now.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60)
          return hoursOverdue >= 2 && hoursOverdue < 6
        }).length,
        '6-24_hours': overdueRequests.filter((req: any) => {
          const scheduledTime = new Date(req.scheduled_for)
          const hoursOverdue = (now.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60)
          return hoursOverdue >= 6 && hoursOverdue < 24
        }).length,
        'over_24_hours': overdueRequests.filter((req: any) => {
          const scheduledTime = new Date(req.scheduled_for)
          const hoursOverdue = (now.getTime() - scheduledTime.getTime()) / (1000 * 60 * 60)
          return hoursOverdue >= 24
        }).length
      }
    }

    const response = {
      severity,
      overdueAnalysis,
      firstTimeUsersAffected: firstTimeUsersWithIssues.length,
      firstTimeUsersWithIssues: firstTimeUsersWithIssues.map(user => ({
        userId: user.userId,
        email: user.userEmail,
        businessName: user.businessName,
        overdueCount: user.overdueCount,
        oldestRequestAge: Math.round((now.getTime() - new Date(user.oldestRequest.scheduled_for).getTime()) / (1000 * 60 * 60))
      })),
      overdueRequests: overdueRequests.map((req: any) => ({
        id: req.id,
        userId: req.user_id,
        businessName: req.profiles.business_name,
        customerName: req.customers.name,
        customerPhone: req.customers.phone,
        scheduledFor: req.scheduled_for,
        createdAt: req.created_at,
        hoursOverdue: Math.round((now.getTime() - new Date(req.scheduled_for).getTime()) / (1000 * 60 * 60))
      })),
      recommendations: generateRecommendations(severity, overdueAnalysis, firstTimeUsersWithIssues.length)
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error in overdue requests check:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function generateRecommendations(
  severity: string,
  analysis: any,
  firstTimeUsersCount: number
): string[] {
  const recommendations = []

  if (severity === 'critical') {
    recommendations.push('URGENT: Check if SMS cron job is running')
    recommendations.push('URGENT: Verify Twilio credentials and connection')
    recommendations.push('URGENT: Check CRON_SECRET configuration')
  }

  if (analysis.byAge.over_24_hours > 0) {
    recommendations.push(`${analysis.byAge.over_24_hours} requests overdue >24h - investigate cron job health`)
  }

  if (firstTimeUsersCount > 0) {
    recommendations.push(`CRITICAL: ${firstTimeUsersCount} first-time users affected - high churn risk`)
    recommendations.push('Consider manual intervention or refund for affected first-time users')
  }

  if (analysis.total > 0) {
    recommendations.push('Check Vercel cron job logs for errors')
    recommendations.push('Verify timezone configuration in scheduled_for calculations')
    recommendations.push('Consider running manual SMS sending for stuck requests')
  }

  if (recommendations.length === 0) {
    recommendations.push('All requests processing normally ✅')
  }

  return recommendations
}

// POST endpoint for manual intervention
export async function POST(request: NextRequest) {
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

  try {
    const { action, requestIds } = await request.json()

    if (action === 'retry_overdue' && requestIds?.length > 0) {
      // Trigger immediate retry of overdue requests by updating status to 'queued'
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

      const { data, error } = await (supabase as any)
        .from('review_requests')
        .update({
          status: 'queued',
          queued_reason: 'manual_retry_overdue',
          queued_at: new Date().toISOString()
        })
        .in('id', requestIds)
        .eq('status', 'scheduled')

      if (error) {
        throw error
      }

      return NextResponse.json({
        success: true,
        message: `${requestIds.length} overdue requests queued for immediate retry`,
        updatedCount: data?.length || 0
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Error in manual intervention:', error)
    return NextResponse.json({ error: 'Failed to process manual intervention' }, { status: 500 })
  }
}