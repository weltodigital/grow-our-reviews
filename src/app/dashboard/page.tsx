import { requireUserWithProfile, createServerSupabase } from '@/lib/auth'
import { StatsOverview } from '@/components/dashboard/stats-overview'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Clock, CheckCircle, XCircle } from 'lucide-react'

async function getDashboardStats(userId: string) {
  try {
    const supabase = await createServerSupabase()

    // Get current month bounds
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Get user profile for request limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('monthly_request_limit')
      .eq('id', userId)
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
        .eq('user_id', userId)
        .gte('sent_at', startOfMonth.toISOString())
        .lte('sent_at', endOfMonth.toISOString())
        .not('sent_at', 'is', null),

      // Clicks this month
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('clicked_at', startOfMonth.toISOString())
        .lte('clicked_at', endOfMonth.toISOString())
        .not('clicked_at', 'is', null),

      // Reviews this month
      supabase
        .from('review_requests')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .eq('status', 'reviewed')
        .gte('sent_at', startOfMonth.toISOString())
        .lte('sent_at', endOfMonth.toISOString()),

      // Feedback this month
      supabase
        .from('feedback')
        .select('id', { count: 'exact' })
        .eq('user_id', userId)
        .gte('created_at', startOfMonth.toISOString())
        .lte('created_at', endOfMonth.toISOString()),

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

    const requestsSent = requestsThisMonth.count || 0
    const clicks = clicksThisMonth.count || 0
    const reviews = reviewsThisMonth.count || 0
    const feedback = feedbackThisMonth.count || 0
    const monthlyLimit = profile?.monthly_request_limit || 50

    // Calculate click through rate
    const clickThroughRate = requestsSent > 0 ? (clicks / requestsSent) * 100 : 0

    return {
      requestsSentThisMonth: requestsSent,
      clicksThisMonth: clicks,
      reviewsThisMonth: reviews,
      feedbackThisMonth: feedback,
      clickThroughRate: Math.round(clickThroughRate * 10) / 10, // Round to 1 decimal
      requestsRemaining: Math.max(0, monthlyLimit - requestsSent),
      totalRequestsAllTime: totalRequestsAllTime.count || 0,
      totalReviewsAllTime: totalReviewsAllTime.count || 0
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
      requestsRemaining: 50,
      totalRequestsAllTime: 0,
      totalReviewsAllTime: 0,
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

    return recentRequests.map(request => ({
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

export default async function DashboardPage() {
  const { user, profile } = await requireUserWithProfile()
  const stats = await getDashboardStats(user.id)
  const recentActivity = await getRecentActivity(user.id)

  return (
    <div className="space-y-8">
      {/* Welcome section */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {profile.business_name}
          </h1>
          <p className="text-gray-600">
            Here's how your review requests are performing this month
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/send" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Send Review Request
          </Link>
        </Button>
      </div>

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
              <Button asChild>
                <Link href="/dashboard/send">Send your first request</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="hover:shadow-md transition-shadow cursor-pointer">
          <Link href="/dashboard/send">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-blue-50 p-3">
                  <Plus className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium text-gray-900">Send Request</div>
                  <div className="text-sm text-gray-500">Add a new customer</div>
                </div>
              </div>
            </CardContent>
          </Link>
        </Card>

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