import { requireUserWithProfile, createServerSupabase } from '@/lib/auth'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { SmsFailureAlert } from '@/components/dashboard/SmsFailureAlert'
import { GoogleReviewsCard } from '@/components/dashboard/google-reviews-card'
import { getCurrentBillingPeriod, getDaysUntilReset, getNextBillingDate } from '@/lib/billing-cycle'
import { countCreditsSentInPeriod } from '@/lib/credit-usage'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Clock, CheckCircle, XCircle, MessageSquare } from 'lucide-react'

async function getDashboardStats(userId: string) {
  try {
    const supabase = await createServerSupabase()

    // Get user profile for request limit and billing cycle date
    const { data: profile } = await supabase
      .from('profiles')
      .select('monthly_request_limit, billing_cycle_date')
      .eq('id', userId)
      .single() as { data: { monthly_request_limit: number; billing_cycle_date: number } | null }

    if (!profile) {
      throw new Error('Profile not found')
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
      creditsThisPeriod,
      clicksThisPeriod,
      reviewsThisPeriod,
      feedbackThisPeriod,
      totalRequestsAllTime,
      totalReviewsAllTime
    ] = await Promise.all([
      // Original requests sent this billing period — used for click-through rate
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('sent_at', startOfPeriod.toISOString())
        .lte('sent_at', endOfPeriod.toISOString())
        .not('sent_at', 'is', null),

      // Credits consumed this period = originals sent + nudges sent
      countCreditsSentInPeriod(supabase, userId, startOfPeriod, endOfPeriod),

      // Clicks this billing period
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('clicked_at', startOfPeriod.toISOString())
        .lte('clicked_at', endOfPeriod.toISOString())
        .not('clicked_at', 'is', null),

      // Reviews this billing period
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'reviewed')
        .gte('sent_at', startOfPeriod.toISOString())
        .lte('sent_at', endOfPeriod.toISOString()),

      // Feedback this billing period
      supabase
        .from('feedback')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', startOfPeriod.toISOString())
        .lte('created_at', endOfPeriod.toISOString()),

      // Total requests all time
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .not('sent_at', 'is', null),

      // Total reviews all time
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'reviewed')
    ])

    const requestsSent = requestsThisPeriod.count || 0
    const creditsUsed = creditsThisPeriod
    const clicks = clicksThisPeriod.count || 0
    const reviews = reviewsThisPeriod.count || 0
    const feedback = feedbackThisPeriod.count || 0
    const monthlyLimit = profile.monthly_request_limit || 150

    // CTR is clicks over originals, not over total SMS (nudges don't get their own click link).
    const clickThroughRate = requestsSent > 0 ? (clicks / requestsSent) * 100 : 0

    return {
      requestsSentThisMonth: creditsUsed, // credits = originals + nudges
      clicksThisMonth: clicks,
      reviewsThisMonth: reviews,
      feedbackThisMonth: feedback,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10, // Round to 1 decimal
      requestsRemaining: Math.max(0, monthlyLimit - creditsUsed),
      totalRequestsAllTime: totalRequestsAllTime.count || 0,
      totalReviewsAllTime: totalReviewsAllTime.count || 0,
      daysUntilReset: daysUntilReset,
      billingCycleDate: billingCycleDate
    }
  } catch (error) {
    console.error('Error fetching dashboard stats:', error)
    // Return default values on error
    return {
      requestsSentThisMonth: 0,
      clicksThisMonth: 0,
      reviewsThisMonth: 0,
      feedbackThisMonth: 0,
      clickThroughRate: 0,
      requestsRemaining: 150,
      totalRequestsAllTime: 0,
      totalReviewsAllTime: 0,
      daysUntilReset: 0,
      billingCycleDate: undefined,
    }
  }
}

async function getRecentActivity(userId: string) {
  try {
    const supabase = await createServerSupabase()

    const { data: recentRequests, error } = await supabase
      .from('review_requests')
      .select(`
        id,
        status,
        created_at,
        sent_at,
        clicked_at,
        customers(name, phone)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }

    return recentRequests.map((request: any) => ({
      id: request.id,
      customerName: request.customers?.name || 'Unknown Customer',
      status: request.status,
      createdAt: request.created_at,
      phone: request.customers?.phone || '',
    }))
  } catch (error) {
    console.error('Error fetching recent activity:', error)
    return []
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'clicked':
      return <Clock className="h-4 w-4 text-yellow-500" />
    case 'reviewed':
      return <CheckCircle className="h-4 w-4 text-green-500" />
    case 'feedback_given':
      return <XCircle className="h-4 w-4 text-red-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-500" />
  }
}

function getStatusText(status: string) {
  switch (status) {
    case 'scheduled':
      return 'Scheduled'
    case 'sent':
      return 'SMS Sent'
    case 'clicked':
      return 'Link Clicked'
    case 'reviewed':
      return 'Review Left'
    case 'feedback_given':
      return 'Feedback Given'
    case 'failed':
      return 'Failed'
    default:
      return status
  }
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

interface DashboardPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function DashboardPage({ searchParams }: DashboardPageProps) {
  const params = await searchParams
  const sessionId = params.session_id

  // Pass session_id to auth function for webhook failure detection
  const { user, profile } = await requireUserWithProfile(sessionId)
  const stats = await getDashboardStats(user.id)
  const recentActivity = await getRecentActivity(user.id)

  return (
    <div className="space-y-8">
      {/* Payment Failed / Cancelled Subscription Banner */}
      {(profile as any).subscription_status === 'cancelled' && (
        <Card className={`border-2 ${(profile as any).cancellation_reason === 'payment_failed' ? 'border-red-200 bg-red-50' : 'border-orange-200 bg-orange-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`rounded-full p-2 ${(profile as any).cancellation_reason === 'payment_failed' ? 'bg-red-100' : 'bg-orange-100'}`}>
                <XCircle className={`h-5 w-5 ${(profile as any).cancellation_reason === 'payment_failed' ? 'text-red-600' : 'text-orange-600'}`} />
              </div>
              <div className="flex-1">
                {(profile as any).cancellation_reason === 'payment_failed' ? (
                  <>
                    <h3 className="font-semibold text-red-900 mb-2">
                      Payment Failed - Subscription Suspended
                    </h3>
                    <p className="text-sm text-red-700 mb-3">
                      Your payment method was declined after multiple retry attempts. Update your payment method to restore access immediately.
                      All your data remains safe and accessible.
                    </p>
                    <div className="flex gap-3">
                      <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 text-white">
                        <Link href="/dashboard/billing">
                          Update Payment Method
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/billing/setup">
                          Change Plan
                        </Link>
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <h3 className="font-semibold text-orange-900 mb-2">
                      Subscription Cancelled - Read-Only Mode
                    </h3>
                    <p className="text-sm text-orange-700 mb-3">
                      Your account data is preserved and accessible, but you can't send new review requests.
                      Reactivate your subscription to continue growing your online reputation.
                    </p>
                    <div className="flex gap-3">
                      <Button asChild size="sm" className="bg-orange-600 hover:bg-orange-700 text-white">
                        <Link href="/billing/setup">
                          Reactivate Subscription
                        </Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href="/dashboard/billing">
                          View Billing
                        </Link>
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dashboard overview */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="space-y-1">
            <p className="text-gray-600">
              Here's how your review requests are performing this period
            </p>
            {/* Prominent credit reset information for user clarity */}
            {stats.billingCycleDate ? (
              <p className="text-sm text-gray-500">
                Credits reset on {getNextBillingDate(stats.billingCycleDate).toLocaleDateString('en-GB')}
                {stats.daysUntilReset && (
                  <span className="text-gray-700 font-medium">
                    {" "}({stats.daysUntilReset} day{stats.daysUntilReset !== 1 ? 's' : ''} remaining)
                  </span>
                )}
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Credits reset on the 1st of each month
              </p>
            )}
          </div>
        </div>
        {(profile as any).subscription_status === 'cancelled' ? (
          <Button disabled className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Send Review Request (Reactivate Required)
          </Button>
        ) : (
          <Button asChild className="!text-black">
            <Link href="/dashboard/send" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Send Review Request
            </Link>
          </Button>
        )}
      </div>

      {/* Google Reviews (refreshes every 2 days per user) */}
      <GoogleReviewsCard />

      {/* SMS Failure Alert */}
      <SmsFailureAlert />

      {/* Stats Overview */}
      <StatsOverview stats={stats} />

      {/* Recent Activity */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Activity</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard/requests">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {recentActivity.length > 0 ? (
            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(activity.status)}
                    <div>
                      <div className="font-medium text-gray-900">
                        {activity.customerName}
                      </div>
                      <div className="text-sm text-gray-500">
                        {activity.phone}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900">
                      {getStatusText(activity.status)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDateTime(activity.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">No activity yet</div>
              {(profile as any).subscription_status === 'cancelled' ? (
                <Button disabled>
                  Send your first request (Reactivate Required)
                </Button>
              ) : (
                <Button asChild className="!text-black">
                  <Link href="/dashboard/send">Send your first request</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Click-through Success Tip */}
      {(stats.clicksThisMonth > 0 && stats.feedbackThisMonth === 0) && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-green-100 p-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-green-900 mb-1">Good click-through rate!</h3>
                <p className="text-sm text-green-700 mb-2">
                  Great job! People are clicking your review links. Not everyone who clicks will leave a review, and that's completely normal.
                </p>
                <p className="text-xs text-green-600">
                  Some customers may not have a Google account, others might be interrupted. Keep sending requests - reviews will come!
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(profile as any).subscription_status === 'cancelled' ? (
          <Card className="opacity-50 cursor-not-allowed">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-3 bg-gray-200">
                  <Plus className="h-6 w-6 text-gray-400" />
                </div>
                <div>
                  <div className="font-medium text-gray-500">Send Request</div>
                  <div className="text-sm text-gray-400">Reactivate subscription</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link href="/dashboard/send">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="rounded-lg p-3" style={{ backgroundColor: 'var(--accent-light)' }}>
                    <Plus className="h-6 w-6" style={{ color: 'var(--accent)' }} />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900">Send Request</div>
                    <div className="text-sm text-gray-500">Add a new customer</div>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        )}

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/feedback">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-purple-50 p-3">
                  <MessageSquare className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">View Feedback</div>
                  <div className="text-sm text-gray-500">Private customer feedback</div>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/settings">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gray-50 p-3">
                  <Clock className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Settings</div>
                  <div className="text-sm text-gray-500">SMS timing & preferences</div>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  )
}