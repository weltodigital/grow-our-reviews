import {
  Clock,
  Send,
  MousePointer,
  Star,
  MessageSquare,
  XCircle,
  Calendar,
  Timer,
  Shield
} from 'lucide-react'

interface StatusBadgeProps {
  status: 'scheduled' | 'queued' | 'sent' | 'clicked' | 'reviewed' | 'feedback_given' | 'failed' | 'suppressed'
  showIcon?: boolean
  scheduledFor?: string
  queuedReason?: string
}

export function StatusBadge({ status, showIcon = true, scheduledFor, queuedReason }: StatusBadgeProps) {

  const getDelayDuration = (scheduledTime: string) => {
    const now = new Date()
    const scheduled = new Date(scheduledTime)
    const diffMs = now.getTime() - scheduled.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    if (diffMs < 0) return null // Future scheduled time
    if (diffHours >= 24) return `${Math.floor(diffHours / 24)}d ago`
    if (diffHours >= 1) return `${diffHours}h ago`
    if (diffMinutes >= 1) return `${diffMinutes}m ago`
    return 'just now'
  }

  const getQueuedReasonText = (reason?: string) => {
    switch (reason) {
      case 'platform_hourly_limit': return 'platform limit'
      case 'platform_daily_limit': return 'daily limit'
      case 'per_user_hourly_limit': return 'user limit'
      case 'rate_limited': return 'rate limited'
      default: return 'queued'
    }
  }

  const getStatusConfig = (status: string) => {
    const delayDuration = scheduledFor ? getDelayDuration(scheduledFor) : null

    switch (status) {
      case 'scheduled':
        const scheduledLabel = delayDuration ? `Scheduled ${delayDuration}` : 'Scheduled'
        const isOverdue = scheduledFor && new Date() > new Date(scheduledFor)
        return {
          label: scheduledLabel,
          icon: Calendar,
          className: isOverdue ? 'bg-orange-100 text-orange-700 border-orange-200' : 'border',
          style: isOverdue ? {} : {
            backgroundColor: 'var(--accent-light)',
            color: 'var(--accent-dark)',
            borderColor: 'var(--accent)'
          },
        }
      case 'queued':
        const queuedLabel = queuedReason ? `Queued (${getQueuedReasonText(queuedReason)})` : 'Queued'
        return {
          label: queuedLabel,
          icon: Timer,
          className: 'bg-amber-100 text-amber-700 border-amber-200',
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
      case 'suppressed':
        return {
          label: 'Customer Unsubscribed',
          icon: Shield,
          className: 'bg-gray-100 text-gray-600 border-gray-300',
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
    <span
      className={`
        inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium border
        ${config.className}
      `}
      style={(config as any).style || {}}
    >
      {showIcon && <Icon className="h-3 w-3" />}
      {config.label}
    </span>
  )
}