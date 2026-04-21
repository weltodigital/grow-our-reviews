import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
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

    // Get auth user from the request headers for debugging
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'No auth header' }, { status: 401 })
    }

    // For debugging, let's check a specific user's requests
    const { data: allRequests, error } = await supabase
      .from('review_requests')
      .select('id, sent_at, nudge_sent_at, nudge_sent, status, created_at')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count credits manually to verify
    let totalCredits = 0
    let thisMonthCredits = 0
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    const details = allRequests.map(req => {
      let credits = 0
      const isThisMonth = (date: string) => new Date(date) >= startOfMonth

      // Count initial message
      if (req.sent_at && req.status !== 'failed') {
        credits++
        totalCredits++
        if (isThisMonth(req.sent_at)) {
          thisMonthCredits++
        }
      }

      // Count nudge message
      if (req.nudge_sent_at) {
        credits++
        totalCredits++
        if (isThisMonth(req.nudge_sent_at)) {
          thisMonthCredits++
        }
      }

      return {
        id: req.id,
        sent_at: req.sent_at,
        nudge_sent_at: req.nudge_sent_at,
        nudge_sent: req.nudge_sent,
        status: req.status,
        credits_for_this_request: credits,
        created_at: req.created_at
      }
    })

    return NextResponse.json({
      totalCreditsAllTime: totalCredits,
      creditsThisMonth: thisMonthCredits,
      requestDetails: details,
      summary: {
        totalRequests: allRequests.length,
        requestsWithNudges: allRequests.filter(r => r.nudge_sent_at).length,
        requestsWithInitial: allRequests.filter(r => r.sent_at && r.status !== 'failed').length
      }
    })

  } catch (error) {
    console.error('Debug stats error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}