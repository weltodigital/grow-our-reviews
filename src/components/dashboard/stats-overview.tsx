import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Send, MousePointer, Star, MessageSquare } from 'lucide-react'

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
  }
}

export function StatsOverview({ stats }: StatsOverviewProps) {
  const statCards = [
    {
      title: 'Requests Sent',
      value: stats.requestsSentThisMonth,
      subtitle: 'This month',
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
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-600 mb-1">
                Requests Remaining This Month
              </div>
              <div className="text-3xl font-bold text-blue-600">
                {stats.requestsRemaining.toLocaleString()}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Reset on the 1st of each month
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">
                Need more requests?
              </div>
              <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Upgrade plan →
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}