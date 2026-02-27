import { Button } from '@/components/ui/button'

interface RequestFiltersProps {
  statusFilter: string
  onStatusFilterChange: (status: string) => void
  statusCounts: {
    all: number
    scheduled: number
    sent: number
    clicked: number
    reviewed: number
    feedback_given: number
    failed: number
  }
}

export function RequestFilters({
  statusFilter,
  onStatusFilterChange,
  statusCounts
}: RequestFiltersProps) {
  const filters = [
    { key: 'all', label: 'All Requests', count: statusCounts.all, color: 'gray' },
    { key: 'scheduled', label: 'Scheduled', count: statusCounts.scheduled, color: 'blue' },
    { key: 'sent', label: 'Sent', count: statusCounts.sent, color: 'yellow' },
    { key: 'clicked', label: 'Clicked', count: statusCounts.clicked, color: 'orange' },
    { key: 'reviewed', label: 'Reviewed', count: statusCounts.reviewed, color: 'green' },
    { key: 'feedback_given', label: 'Feedback', count: statusCounts.feedback_given, color: 'purple' },
    { key: 'failed', label: 'Failed', count: statusCounts.failed, color: 'red' },
  ]

  const getButtonStyle = (filter: any, isActive: boolean) => {
    const baseStyle = 'flex items-center gap-2 transition-colors'

    if (isActive) {
      switch (filter.color) {
        case 'blue':
          return `${baseStyle} bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200`
        case 'yellow':
          return `${baseStyle} bg-yellow-100 text-yellow-700 border-yellow-200 hover:bg-yellow-200`
        case 'orange':
          return `${baseStyle} bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200`
        case 'green':
          return `${baseStyle} bg-green-100 text-green-700 border-green-200 hover:bg-green-200`
        case 'purple':
          return `${baseStyle} bg-purple-100 text-purple-700 border-purple-200 hover:bg-purple-200`
        case 'red':
          return `${baseStyle} bg-red-100 text-red-700 border-red-200 hover:bg-red-200`
        default:
          return `${baseStyle} bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200`
      }
    }

    return `${baseStyle} bg-white text-gray-600 border-gray-200 hover:bg-gray-50`
  }

  return (
    <div className="flex flex-wrap gap-2">
      {filters.map((filter) => {
        const isActive = statusFilter === filter.key
        return (
          <Button
            key={filter.key}
            variant="outline"
            size="sm"
            onClick={() => onStatusFilterChange(filter.key)}
            className={getButtonStyle(filter, isActive)}
          >
            <span>{filter.label}</span>
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
  )
}