import { Button } from '@/components/ui/button'
import { Star } from 'lucide-react'

interface FeedbackFiltersProps {
  ratingFilter: number | 'all'
  onRatingFilterChange: (rating: number | 'all') => void
  dateFilter: string
  onDateFilterChange: (date: string) => void
  ratingCounts: {
    all: number
    1: number
    2: number
    3: number
    4: number
    5: number
  }
}

export function FeedbackFilters({
  ratingFilter,
  onRatingFilterChange,
  dateFilter,
  onDateFilterChange,
  ratingCounts
}: FeedbackFiltersProps) {
  const ratingFilters = [
    { key: 'all' as const, label: 'All Ratings', count: ratingCounts.all, color: 'gray' },
    { key: 1, label: '1 Star', count: ratingCounts[1], color: 'red' },
    { key: 2, label: '2 Stars', count: ratingCounts[2], color: 'orange' },
    { key: 3, label: '3 Stars', count: ratingCounts[3], color: 'yellow' },
    { key: 4, label: '4 Stars', count: ratingCounts[4], color: 'green' },
    { key: 5, label: '5 Stars', count: ratingCounts[5], color: 'green' },
  ]

  const dateFilters = [
    { key: 'all', label: 'All Time' },
    { key: 'today', label: 'Today' },
    { key: 'week', label: 'Past Week' },
    { key: 'month', label: 'Past Month' },
    { key: '3months', label: 'Past 3 Months' },
  ]

  const getRatingButtonStyle = (filter: any, isActive: boolean) => {
    const baseStyle = 'flex items-center gap-2 transition-colors'

    if (isActive) {
      switch (filter.color) {
        case 'red':
          return `${baseStyle} bg-red-100 text-red-700 border-red-200 hover:bg-red-200`
        case 'orange':
          return `${baseStyle} bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200`
        case 'yellow':
          return `${baseStyle} bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200`
        case 'green':
          return `${baseStyle} bg-green-100 text-green-700 border-green-200 hover:bg-green-200`
        default:
          return `${baseStyle} bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200`
      }
    }

    return `${baseStyle} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`
  }

  const getDateButtonStyle = (isActive: boolean) => {
    return isActive
      ? 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
      : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
  }

  return (
    <div className="space-y-4">
      {/* Rating Filters */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Filter by Rating</div>
        <div className="flex flex-wrap gap-2">
          {ratingFilters.map((filter) => {
            const isActive = ratingFilter === filter.key
            return (
              <Button
                key={filter.key}
                variant="outline"
                size="sm"
                onClick={() => onRatingFilterChange(filter.key)}
                className={getRatingButtonStyle(filter, isActive)}
              >
                <div className="flex items-center gap-1">
                  {typeof filter.key === 'number' && (
                    <Star className="h-3 w-3 text-yellow-400 fill-current" />
                  )}
                  <span>{filter.label}</span>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  isActive
                    ? 'bg-white/50'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {filter.count}
                </span>
              </Button>
            )
          })}
        </div>
      </div>

      {/* Date Filters */}
      <div>
        <div className="text-sm font-medium text-gray-700 mb-2">Filter by Date</div>
        <div className="flex flex-wrap gap-2">
          {dateFilters.map((filter) => {
            const isActive = dateFilter === filter.key
            return (
              <Button
                key={filter.key}
                variant="outline"
                size="sm"
                onClick={() => onDateFilterChange(filter.key)}
                className={getDateButtonStyle(isActive)}
              >
                {filter.label}
              </Button>
            )
          })}
        </div>
      </div>
    </div>
  )
}