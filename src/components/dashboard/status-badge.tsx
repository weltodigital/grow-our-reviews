import {
  Clock,
  Send,
  MousePointer,
  Star,
  MessageSquare,
  XCircle,
  Calendar
} from 'lucide-react'

interface StatusBadgeProps {
  status: 'scheduled' | 'sent' | 'clicked' | 'reviewed' | 'feedback_given' | 'failed'
  showIcon?: boolean
}

export function StatusBadge({ status, showIcon = true }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'scheduled':
        return {
          label: 'Scheduled',
          icon: Calendar,
          className: 'bg-blue-100 text-blue-700 border-blue-200',
        }
      case 'sent':
        return {
          label: 'SMS Sent',
          icon: Send,
          className: 'bg-yellow-100 text-yellow-700 border-yellow-200',
        }
      case 'clicked':
        return {
          label: 'Link Clicked',
          icon: MousePointer,
          className: 'bg-orange-100 text-orange-700 border-orange-200',
        }
      case 'reviewed':
        return {
          label: 'Review Left',
          icon: Star,
          className: 'bg-green-100 text-green-700 border-green-200',
        }
      case 'feedback_given':
        return {
          label: 'Feedback Given',
          icon: MessageSquare,
          className: 'bg-purple-100 text-purple-700 border-purple-200',
        }
      case 'failed':
        return {
          label: 'Failed',
          icon: XCircle,
          className: 'bg-red-100 text-red-700 border-red-200',
        }
      default:
        return {
          label: status,
          icon: Clock,
          className: 'bg-gray-100 text-gray-700 border-gray-200',
        }
    }
  }

  const config = getStatusConfig(status)
  const Icon = config.icon

  return (
    <span className={`
      inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border
      ${config.className}
    `}>
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  )
}