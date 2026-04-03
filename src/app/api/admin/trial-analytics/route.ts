import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { protectAdminEndpoint } from '@/lib/admin-auth'

interface TrialAnalytics {
  overview: {
    totalTrials: number
    activeTrials: number
    endingToday: number
    endingThisWeek: number
    conversionRate: number
    averageUsage: number
  }
  endingSoon: Array<{
    userId: string
    email: string
    daysRemaining: number
    requestsSent: number
    lastActivity: string | null
    paymentMethodStatus: 'valid' | 'expired' | 'unknown'
  }>
  recentConversions: Array<{
    userId: string
    email: string
    convertedAt: string
    plan: string
    trialUsage: number
  }>
  failedConversions: Array<{
    userId: string
    email: string
    failedAt: string
    reason: string
    trialUsage: number
  }>
}

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
    const today = now.toISOString().split('T')[0]
    const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    // Get all trials and conversions
    const [trialsData, requestsData, paymentsData] = await Promise.all([
      // Active and recent trials
      supabase
        .from('profiles')
        .select('id, email, subscription_status, trial_ends_at, created_at, monthly_request_limit, stripe_customer_id')
        .in('subscription_status', ['trialing', 'active', 'past_due', 'cancelled'])
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Usage data for trial users
      supabase
        .from('review_requests')
        .select('user_id, created_at, status')
        .gte('created_at', thirtyDaysAgo.toISOString()),

      // Failed payments (proxy for failed conversions)
      supabase
        .from('webhook_events')
        .select('payload, processed_at')
        .eq('event_type', 'invoice.payment_failed')
        .gte('processed_at', thirtyDaysAgo.toISOString())
    ])

    if (trialsData.error) throw trialsData.error
    if (requestsData.error) throw requestsData.error

    const profiles = trialsData.data || []
    const requests = requestsData.data || []
    const failedPayments = paymentsData.data || []

    // Calculate trial analytics
    const analytics = await calculateTrialAnalytics(profiles, requests, failedPayments)

    return NextResponse.json(analytics)

  } catch (error: any) {
    console.error('Trial analytics failed:', error)
    return NextResponse.json(
      { error: 'Failed to fetch trial analytics', details: error.message },
      { status: 500 }
    )
  }
}

async function calculateTrialAnalytics(
  profiles: any[],
  requests: any[],
  failedPayments: any[]
): Promise<TrialAnalytics> {
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const oneWeekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  // Group requests by user
  const userRequests = requests.reduce((acc, req) => {
    if (!acc[req.user_id]) acc[req.user_id] = []
    acc[req.user_id].push(req)
    return acc
  }, {})

  // Separate active trials and conversions
  const activeTrials = profiles.filter(p => p.subscription_status === 'trialing')
  const convertedUsers = profiles.filter(p => ['active', 'past_due'].includes(p.subscription_status))
  const totalTrials = profiles.length

  // Calculate conversion rate (last 30 days)
  const conversionRate = totalTrials > 0 ? (convertedUsers.length / totalTrials) * 100 : 0

  // Find trials ending soon
  const endingSoon = activeTrials
    .map(profile => {
      const trialEnd = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
      if (!trialEnd) return null

      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const userReqs = userRequests[profile.id] || []
      const lastActivity = userReqs.length > 0
        ? Math.max(...userReqs.map((r: any) => new Date(r.created_at).getTime()))
        : null

      return {
        userId: profile.id,
        email: profile.email,
        daysRemaining,
        requestsSent: userReqs.length,
        lastActivity: lastActivity ? new Date(lastActivity).toISOString() : null,
        paymentMethodStatus: (profile.stripe_customer_id ? 'unknown' : 'unknown') as 'valid' | 'expired' | 'unknown'
      }
    })
    .filter(trial => trial && trial.daysRemaining >= 0 && trial.daysRemaining <= 7)
    .sort((a, b) => (a as any).daysRemaining - (b as any).daysRemaining)

  // Recent conversions (last 7 days)
  const recentConversions = convertedUsers
    .filter(p => {
      const created = new Date(p.created_at)
      return now.getTime() - created.getTime() <= 7 * 24 * 60 * 60 * 1000
    })
    .map(profile => {
      const userReqs = userRequests[profile.id] || []
      return {
        userId: profile.id,
        email: profile.email,
        convertedAt: profile.created_at,
        plan: profile.monthly_request_limit === 150 ? 'Starter' : 'Growth',
        trialUsage: userReqs.length
      }
    })

  // Failed conversions from payment failures
  const failedConversions = failedPayments
    .map(payment => {
      const payload = payment.payload
      const customerId = payload?.data?.object?.customer
      // TODO: Map customer ID to user profile
      return {
        userId: 'unknown',
        email: 'unknown',
        failedAt: payment.processed_at,
        reason: 'Payment failed',
        trialUsage: 0
      }
    })

  // Calculate average usage
  const totalUsage = (Object.values(userRequests) as any[]).reduce((sum: number, reqs: any[]) => sum + reqs.length, 0)
  const averageUsage = activeTrials.length > 0 ? totalUsage / activeTrials.length : 0

  const endingToday = endingSoon.filter(t => t && t.daysRemaining === 0).length
  const endingThisWeek = endingSoon.length

  return {
    overview: {
      totalTrials,
      activeTrials: activeTrials.length,
      endingToday,
      endingThisWeek,
      conversionRate: Math.round(conversionRate * 100) / 100,
      averageUsage: Math.round(averageUsage * 100) / 100
    },
    endingSoon: endingSoon.filter(t => t !== null),
    recentConversions,
    failedConversions
  }
}