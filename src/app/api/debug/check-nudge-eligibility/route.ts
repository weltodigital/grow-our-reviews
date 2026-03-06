import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = await createServerSupabase()

    // Check all review requests and their nudge eligibility
    const { data: allRequests, error } = await (supabase as any)
      .from('review_requests')
      .select(`
        id,
        token,
        status,
        nudge_sent,
        sent_at,
        created_at,
        user_id,
        profiles!inner(
          business_name,
          nudge_enabled,
          nudge_delay_hours
        ),
        customers!inner(name, phone)
      `)
      .eq('profiles.nudge_enabled', true)
      .limit(20)

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch requests',
        details: error.message
      }, { status: 500 })
    }

    const now = new Date()
    const analysis = (allRequests || []).map((request: any) => {
      const sentAt = request.sent_at ? new Date(request.sent_at) : null
      const nudgeDelayMs = request.profiles.nudge_delay_hours * 60 * 60 * 1000
      const nudgeTime = sentAt ? new Date(sentAt.getTime() + nudgeDelayMs) : null
      const isEligible = sentAt && nudgeTime && now >= nudgeTime && !request.nudge_sent && request.status === 'sent'

      return {
        id: request.id,
        token: request.token,
        status: request.status,
        nudge_sent: request.nudge_sent,
        sent_at: request.sent_at,
        customer: request.customers.name,
        nudge_delay_hours: request.profiles.nudge_delay_hours,
        nudge_time: nudgeTime?.toISOString(),
        time_until_nudge: nudgeTime ? Math.round((nudgeTime.getTime() - now.getTime()) / (1000 * 60)) : null,
        eligible_for_nudge: isEligible,
        reasons: {
          has_sent_status: request.status === 'sent',
          nudge_not_sent: !request.nudge_sent,
          has_sent_at: !!request.sent_at,
          time_elapsed: nudgeTime ? now >= nudgeTime : false
        }
      }
    })

    const eligibleCount = analysis.filter((req: any) => req.eligible_for_nudge).length

    return NextResponse.json({
      message: 'Nudge eligibility analysis',
      current_time: now.toISOString(),
      total_requests: analysis.length,
      eligible_for_nudge: eligibleCount,
      requests: analysis
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}