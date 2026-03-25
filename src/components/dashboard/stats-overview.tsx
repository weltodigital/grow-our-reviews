import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, MousePointer, Star, MessageSquare } from 'lucide-react'
import { getNextBillingDate } from '@/lib/billing-cycle'
import Link from 'next/link'

interface StatsOverviewProps {
  stats: {
    requestsSentThisMonth: number
    clicksThisMonth: number
    reviewsThisMonth: number
    feedbackThisMonth: number
    clickThroughRate: number
    requestsRemaining: number
    totalRequestsAllTime: number
    totalReviewsAllTime: number
    daysUntilReset?: number
    billingCycleDate?: number
  }
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      title: 'Requests Sent',
      value: stats.requestsSentThisMonth,
      subtitle: 'This period',
      icon: Send,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Clicks',
      value: stats.clicksThisMonth,
      subtitle: `${stats.clickThroughRate.toFixed(1)}% click rate`,
      icon: MousePointer,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Reviews',
      value: stats.reviewsThisMonth,
      subtitle: 'Public reviews',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'Private Feedback',
      value: stats.feedbackThisMonth,
      subtitle: 'Internal only',
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main stats grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`rounded-lg p-2 ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900">
                {stat.value.toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Requests remaining card */}
      <Card className={`bg-gradient-to-r border-2 ${
        stats.requestsRemaining <= 10
          ? 'from-red-50 to-orange-50 border-red-200'
          : stats.requestsRemaining <= 25
          ? 'from-yellow-50 to-orange-50 border-yellow-200'
          : 'from-blue-50 to-indigo-50 border-blue-200'
      }`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">
                Requests Remaining This Period
              </div>
              <div className={`text-3xl font-bold ${
                stats.requestsRemaining <= 10
                  ? 'text-red-600'
                  : stats.requestsRemaining <= 25
                  ? 'text-yellow-600'
                  : 'text-blue-600'
              }`}>
                {stats.requestsRemaining.toLocaleString()}
              </div>

              {/* Enhanced reset date information - more prominent when credits are low */}
              <div className={`mt-2 ${
                stats.requestsRemaining <= 10
                  ? 'text-red-700 font-semibold'
                  : stats.requestsRemaining <= 25
                  ? 'text-yellow-700 font-medium'
                  : 'text-gray-500'
              }`}>
                {stats.billingCycleDate ? (
                  <div className="space-y-1">
                    <div className="text-sm">
                      <span className="font-medium">Credits reset:</span>{' '}
                      {getNextBillingDate(stats.billingCycleDate).toLocaleDateString('en-GB')}
                    </div>
                    {stats.daysUntilReset && (
                      <div className="text-xs">
                        {stats.daysUntilReset} day{stats.daysUntilReset !== 1 ? 's' : ''} remaining
                        {stats.requestsRemaining <= 10 && stats.daysUntilReset > 5 && (
                          <span className="ml-2 text-red-600">⚠️ Consider upgrading</span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm">
                    <span className="font-medium">Credits reset:</span> 1st of each month
                  </div>
                )}
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Need more requests?
              </div>
              <Link
                href="/dashboard/billing"
                className={`text-sm font-medium hover:underline ${
                  stats.requestsRemaining <= 10
                    ? 'text-red-600 hover:text-red-700'
                    : stats.requestsRemaining <= 25
                    ? 'text-yellow-600 hover:text-yellow-700'
                    : 'text-blue-600 hover:text-blue-700'
                }`}
              >
                Upgrade plan →
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}