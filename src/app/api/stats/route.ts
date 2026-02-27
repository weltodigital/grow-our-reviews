import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  let response: NextResponse

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get current month bounds
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Get user profile for request limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('monthly_request_limit')
      .eq('id', user.id)
      .single()

    // Parallel queries for stats
    const [
      requestsThisMonth,
      clicksThisMonth,
      reviewsThisMonth,
      feedbackThisMonth,
      totalRequestsAllTime,
      totalReviewsAllTime
    ] = await Promise.all([
      // Requests sent this month
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('sent_at', startOfMonth.toISOString())
        .lte('sent_at', endOfMonth.toISOString())
        .not('sent_at', 'is', null),

      // Clicks this month
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('clicked_at', startOfMonth.toISOString())
        .lte('clicked_at', endOfMonth.toISOString())
        .not('clicked_at', 'is', null),

      // Reviews this month
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'reviewed')
        .gte('sent_at', startOfMonth.toISOString())
        .lte('sent_at', endOfMonth.toISOString()),

      // Feedback this month
      supabase
        .from('feedback')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString()),

      // Total requests all time
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .not('sent_at', 'is', null),

      // Total reviews all time
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'reviewed')
    ])

    const requestsSent = requestsThisMonth.count || 0
    const clicks = clicksThisMonth.count || 0
    const reviews = reviewsThisMonth.count || 0
    const feedback = feedbackThisMonth.count || 0
    const monthlyLimit = (profile as any)?.monthly_request_limit || 50

    // Calculate click through rate
    const clickThroughRate = requestsSent > 0 ? (clicks / requestsSent) * 100 : 0

    const stats = {
      requestsSentThisMonth: requestsSent,
      clicksThisMonth: clicks,
      reviewsThisMonth: reviews,
      feedbackThisMonth: feedback,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10, // Round to 1 decimal
      requestsRemaining: Math.max(0, monthlyLimit - requestsSent),
      totalRequestsAllTime: totalRequestsAllTime.count || 0,
      totalReviewsAllTime: totalReviewsAllTime.count || 0
    }

    response = NextResponse.json(stats)
    return response

  } catch (error) {
    console.error('Error fetching stats:', error)
    response = NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    )
    return response
  }
}