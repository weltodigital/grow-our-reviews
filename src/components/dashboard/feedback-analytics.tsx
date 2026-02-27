import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, MessageSquare, TrendingDown, AlertTriangle } from 'lucide-react'
import type { FeedbackItem } from '@/app/dashboard/feedback/page'

interface FeedbackAnalyticsProps {
  feedback: FeedbackItem[]
}

export function FeedbackAnalytics({ feedback }: FeedbackAnalyticsProps) {
  const totalFeedback = feedback.length
  const averageRating = totalFeedback > 0
    ? (feedback.reduce((sum, item) => sum + item.rating, 0) / totalFeedback)
    : 0

  const ratingDistribution = {
    1: feedback.filter(f => f.rating === 1).length,
    2: feedback.filter(f => f.rating === 2).length,
    3: feedback.filter(f => f.rating === 3).length,
  }

  const feedbackWithComments = feedback.filter(f => f.comment && f.comment.trim()).length
  const recentFeedback = feedback.filter(f => {
    const feedbackDate = new Date(f.created_at)
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    return feedbackDate >= weekAgo
  }).length

  const statCards = [
    {
      title: 'Total Feedback',
      value: totalFeedback,
      subtitle: 'Private feedback received',
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Average Rating',
      value: averageRating.toFixed(1),
      subtitle: 'From private feedback',
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'With Comments',
      value: feedbackWithComments,
      subtitle: `${totalFeedback > 0 ? Math.round((feedbackWithComments / totalFeedback) * 100) : 0}% provided details`,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'This Week',
      value: recentFeedback,
      subtitle: 'Recent feedback items',
      icon: TrendingDown,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Main Stats */}
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
                {stat.value}
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rating Distribution */}
      {totalFeedback > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              Rating Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((rating) => {
                const count = ratingDistribution[rating as keyof typeof ratingDistribution]
                const percentage = totalFeedback > 0 ? (count / totalFeedback) * 100 : 0

                return (
                  <div key={rating} className="flex items-center gap-4">
                    <div className="flex items-center gap-1 min-w-[60px]">
                      <span className="font-medium">{rating}</span>
                      <Star className="h-4 w-4 text-yellow-400 fill-current" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-sm text-gray-600">
                          {count} feedback{count !== 1 ? 's' : ''}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            rating === 1
                              ? 'bg-red-500'
                              : rating === 2
                              ? 'bg-orange-500'
                              : 'bg-yellow-500'
                          }`}
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">💡 Improvement Opportunities</h4>
              <div className="text-sm text-blue-700 space-y-1">
                {ratingDistribution[1] > 0 && (
                  <p>• {ratingDistribution[1]} customer{ratingDistribution[1] !== 1 ? 's' : ''} gave 1 star - these need immediate attention</p>
                )}
                {ratingDistribution[2] > 0 && (
                  <p>• {ratingDistribution[2]} customer{ratingDistribution[2] !== 1 ? 's' : ''} gave 2 stars - focus on these issues to prevent public complaints</p>
                )}
                {ratingDistribution[3] > 0 && (
                  <p>• {ratingDistribution[3]} customer{ratingDistribution[3] !== 1 ? 's' : ''} gave 3 stars - small improvements could turn these into 4-5 star experiences</p>
                )}
                <p>• Review detailed comments below to identify specific areas for improvement</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}