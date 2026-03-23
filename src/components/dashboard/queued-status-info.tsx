import { Info, Clock, Users, Zap } from 'lucide-react'

interface QueuedStatusInfoProps {
  queuedCount: number
  queuedReasons: string[]
}

export function QueuedStatusInfo({ queuedCount, queuedReasons }: QueuedStatusInfoProps) {
  if (queuedCount === 0) return null

  // Find the "worst case" reason (longest delay)
  const getWorstCaseReason = (reasons: string[]) => {
    const priorityOrder = ['platform_daily_limit', 'platform_hourly_limit', 'per_user_hourly_limit']

    for (const priority of priorityOrder) {
      if (reasons.includes(priority)) {
        return priority
      }
    }
    return reasons[0] || undefined
  }

  const worstReason = getWorstCaseReason(queuedReasons)

  const getQueuedReason = (reason?: string) => {
    switch (reason) {
      case 'platform_hourly_limit':
        return {
          title: 'Platform hourly limit reached',
          description: 'Sending paused due to high system volume (200 SMS/hour limit)',
          icon: Zap,
          estimatedTime: 'Will resume sending next hour'
        }
      case 'platform_daily_limit':
        return {
          title: 'Platform daily limit reached',
          description: 'Daily SMS quota exhausted (1000 SMS/day limit)',
          icon: Zap,
          estimatedTime: 'Will resume sending tomorrow'
        }
      case 'per_user_hourly_limit':
        return {
          title: 'Your hourly limit reached',
          description: 'You\'ve sent your maximum of 30 SMS this hour',
          icon: Users,
          estimatedTime: 'Will resume sending next hour'
        }
      default:
        return {
          title: 'Messages queued for sending',
          description: 'Temporarily delayed due to high system volume',
          icon: Clock,
          estimatedTime: 'Will be sent shortly'
        }
    }
  }

  const queuedInfo = getQueuedReason(worstReason)
  const Icon = queuedInfo.icon

  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
      <div className="flex items-start gap-3">
        <Icon className="h-5 w-5 text-amber-600 mt-0.5" />
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-medium text-amber-800">{queuedInfo.title}</h3>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
              {queuedCount} queued
            </span>
          </div>
          <p className="text-sm text-amber-700 mb-2">{queuedInfo.description}</p>
          <p className="text-xs text-amber-600 font-medium">{queuedInfo.estimatedTime}</p>
        </div>
        <button className="text-amber-600 hover:text-amber-700">
          <Info className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

interface QueuedMessageProps {
  queuedReason?: string
}

export function QueuedMessage({ queuedReason }: QueuedMessageProps) {
  const queuedInfo = getQueuedReason(queuedReason)

  return (
    <div className="text-xs text-amber-600 mt-1">
      {queuedInfo.estimatedTime}
    </div>
  )
}

function getQueuedReason(reason?: string) {
  switch (reason) {
    case 'platform_hourly_limit':
      return {
        estimatedTime: 'Resumes next hour'
      }
    case 'platform_daily_limit':
      return {
        estimatedTime: 'Resumes tomorrow'
      }
    case 'per_user_hourly_limit':
      return {
        estimatedTime: 'Resumes next hour'
      }
    default:
      return {
        estimatedTime: 'Will be sent shortly'
      }
  }
}