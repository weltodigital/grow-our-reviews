import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // Get all recent review requests with nudge info
    const { data: requests, error } = await (supabase as any)
      .from('review_requests')
      .select(`
        id,
        token,
        status,
        nudge_sent,
        sent_at,
        created_at,
        profiles!inner(
          business_name,
          nudge_enabled,
          nudge_delay_hours
        ),
        customers!inner(name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      return NextResponse.json({
        error: 'Failed to fetch requests',
        details: error.message
      }, { status: 500 })
    }

    const now = new Date()
    const analysis = (requests || []).map((request: any) => {
      const sentAt = request.sent_at ? new Date(request.sent_at) : null
      const nudgeDelayMs = request.profiles.nudge_delay_hours * 60 * 60 * 1000
      const nudgeTime = sentAt ? new Date(sentAt.getTime() + nudgeDelayMs) : null
      const minutesUntilNudge = nudgeTime ? Math.round((nudgeTime.getTime() - now.getTime()) / (1000 * 60)) : null
      const isEligible = sentAt && nudgeTime && now >= nudgeTime && !request.nudge_sent && request.status === 'sent'

      return {
        id: request.id,
        customer: request.customers.name,
        status: request.status,
        nudge_sent: request.nudge_sent,
        sent_at: request.sent_at,
        nudge_enabled: request.profiles.nudge_enabled,
        nudge_delay_hours: request.profiles.nudge_delay_hours,
        nudge_due: nudgeTime?.toISOString(),
        minutes_until_nudge: minutesUntilNudge,
        eligible_for_nudge: isEligible,
        reasons: {
          status_sent: request.status === 'sent',
          nudge_not_sent_yet: !request.nudge_sent,
          nudge_enabled: request.profiles.nudge_enabled,
          has_sent_time: !!request.sent_at,
          time_elapsed: nudgeTime ? now >= nudgeTime : false
        }
      }
    })

    const eligibleCount = analysis.filter((req: any) => req.eligible_for_nudge).length
    const nudgeEnabledCount = analysis.filter((req: any) => req.nudge_enabled).length

    return NextResponse.json({
      message: 'Nudge system status',
      current_time: now.toISOString(),
      total_requests: analysis.length,
      nudge_enabled_requests: nudgeEnabledCount,
      eligible_for_nudge_now: eligibleCount,
      requests: analysis
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Status check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}