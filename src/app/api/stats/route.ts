import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { getCurrentBillingPeriod, getDaysUntilReset } from '@/lib/billing-cycle'
import { DEFAULT_TRIAL_LIMIT } from '@/lib/pricing'

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
    // Get user profile for request limit and billing cycle date
    const { data: profile } = await supabase
      .from('profiles')
      .select('monthly_request_limit, billing_cycle_date')
      .eq('id', user.id)
      .single() as { data: { monthly_request_limit: number; billing_cycle_date: number } | null }

    if (!profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // Get billing period bounds based on user's billing cycle
    // If user doesn't have billing_cycle_date, fall back to calendar month
    let startOfPeriod: Date, endOfPeriod: Date, daysUntilReset: number, billingCycleDate: number | undefined

    if (profile.billing_cycle_date) {
      const billingPeriod = getCurrentBillingPeriod(profile.billing_cycle_date)
      startOfPeriod = billingPeriod.start
      endOfPeriod = billingPeriod.end
      daysUntilReset = getDaysUntilReset(profile.billing_cycle_date)
      billingCycleDate = profile.billing_cycle_date
    } else {
      // Fallback to calendar month for users without billing cycle date
      const now = new Date()
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
      endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      daysUntilReset = 0
      billingCycleDate = undefined
    }

    // Parallel queries for stats
    const [
      requestsThisPeriod,
      clicksThisPeriod,
      reviewsThisPeriod,
      feedbackThisPeriod,
      totalRequestsAllTime,
      totalReviewsAllTime
    ] = await Promise.all([
      // SMS credits used this billing period (initial messages + nudges, exclude failed deliveries)
      supabase
        .from('review_requests')
        .select('sent_at, nudge_sent_at')
        .eq('user_id', user.id)
        .not('status', 'eq', 'failed')
        .then(({ data, error }: { data: { sent_at: string | null; nudge_sent_at: string | null }[] | null; error: any }) => {
          if (error) throw error
          let count = 0

          data?.forEach(request => {
            // Count initial message if sent in this period
            if (request.sent_at) {
              const sentDate = new Date(request.sent_at)
              if (sentDate >= startOfPeriod && sentDate <= endOfPeriod) {
                count++
              }
            }

            // Count nudge message if sent in this period
            if (request.nudge_sent_at) {
              const nudgeDate = new Date(request.nudge_sent_at)
              if (nudgeDate >= startOfPeriod && nudgeDate <= endOfPeriod) {
                count++
              }
            }
          })

          return { count }
        }),

      // Clicks this billing period
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('clicked_at', startOfPeriod.toISOString())
        .lte('clicked_at', endOfPeriod.toISOString())
        .not('clicked_at', 'is', null),

      // Reviews this billing period
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'reviewed')
        .gte('sent_at', startOfPeriod.toISOString())
        .lte('sent_at', endOfPeriod.toISOString()),

      // Feedback this billing period
      supabase
        .from('feedback')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .gte('created_at', startOfPeriod.toISOString())
        .lte('created_at', endOfPeriod.toISOString()),

      // Total SMS credits used all time (initial messages + nudges, exclude failed deliveries)
      supabase
        .from('review_requests')
        .select('sent_at, nudge_sent_at')
        .eq('user_id', user.id)
        .not('status', 'eq', 'failed')
        .then(({ data, error }: { data: { sent_at: string | null; nudge_sent_at: string | null }[] | null; error: any }) => {
          if (error) throw error
          let count = 0

          data?.forEach(request => {
            // Count initial message if sent
            if (request.sent_at) {
              count++
            }

            // Count nudge message if sent
            if (request.nudge_sent_at) {
              count++
            }
          })

          return { count }
        }),

      // Total reviews all time
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', user.id)
        .eq('status', 'reviewed')
    ])

    const requestsSent = requestsThisPeriod.count || 0
    const clicks = clicksThisPeriod.count || 0
    const reviews = reviewsThisPeriod.count || 0
    const feedback = feedbackThisPeriod.count || 0
    const monthlyLimit = profile.monthly_request_limit || DEFAULT_TRIAL_LIMIT

    // Calculate click through rate
    const clickThroughRate = requestsSent > 0 ? (clicks / requestsSent) * 100 : 0

    const stats = {
      requestsSentThisMonth: requestsSent, // Keep same property name for backward compatibility
      clicksThisMonth: clicks,
      reviewsThisMonth: reviews,
      feedbackThisMonth: feedback,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10, // Round to 1 decimal
      requestsRemaining: Math.max(0, monthlyLimit - requestsSent),
      totalRequestsAllTime: totalRequestsAllTime.count || 0,
      totalReviewsAllTime: totalReviewsAllTime.count || 0,
      daysUntilReset: daysUntilReset,
      billingCycleDate: billingCycleDate
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