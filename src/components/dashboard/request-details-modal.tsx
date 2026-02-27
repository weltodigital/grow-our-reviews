'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import {
  CalendarIcon,
  ClockIcon,
  PhoneIcon,
  UserIcon,
  ExternalLinkIcon,
  CopyIcon,
  MessageSquareIcon
} from 'lucide-react'
import type { ReviewRequest } from '@/app/dashboard/requests/page'

interface RequestDetailsModalProps {
  request: ReviewRequest | null
  isOpen: boolean
  onClose: () => void
}

export function RequestDetailsModal({
  request,
  isOpen,
  onClose
}: RequestDetailsModalProps) {
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000)
      return () => clearTimeout(timer)
    }
  }, [copied])

  if (!request) return null

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Not available'
    return new Date(dateStr).toLocaleString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPhone = (phone: string) => {
    if (phone.startsWith('+447')) {
      return phone.replace('+44', '0').replace(/(\d{5})(\d{6})/, '$1 $2')
    }
    return phone
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const sentimentGateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${request.token}`

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'scheduled':
        return 'SMS is scheduled to be sent automatically'
      case 'sent':
        return 'SMS has been sent to the customer'
      case 'clicked':
        return 'Customer clicked the review link'
      case 'reviewed':
        return 'Customer left a public review'
      case 'feedback_given':
        return 'Customer provided private feedback'
      case 'failed':
        return 'SMS sending failed - manual retry may be needed'
      default:
        return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <UserIcon className="h-5 w-5 text-blue-600" />
            Request Details
          </DialogTitle>
          <DialogDescription>
            Complete information for this review request
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <UserIcon className="h-4 w-4" />
                Customer Name
              </div>
              <div className="text-lg font-semibold">{request.customer_name}</div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
                <PhoneIcon className="h-4 w-4" />
                Phone Number
              </div>
              <div className="text-lg font-semibold">{formatPhone(request.customer_phone)}</div>
            </div>
          </div>

          {/* Status */}
          <div className="space-y-2">
            <div className="text-sm font-medium text-gray-700">Status</div>
            <div className="flex items-center gap-3">
              <StatusBadge status={request.status} />
              <span className="text-sm text-gray-600">
                {getStatusDescription(request.status)}
              </span>
            </div>
          </div>

          {/* Timeline */}
          <div className="space-y-4">
            <div className="text-sm font-medium text-gray-700">Timeline</div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <CalendarIcon className="h-4 w-4 text-gray-500 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">Request Created</div>
                  <div className="text-sm text-gray-600">
                    {formatDateTime(request.created_at)}
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                <ClockIcon className="h-4 w-4 text-blue-600 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-blue-900">SMS Scheduled For</div>
                  <div className="text-sm text-blue-700">
                    {formatDateTime(request.scheduled_for)}
                  </div>
                </div>
              </div>

              {request.sent_at && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                  <MessageSquareIcon className="h-4 w-4 text-yellow-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-yellow-900">SMS Sent</div>
                    <div className="text-sm text-yellow-700">
                      {formatDateTime(request.sent_at)}
                    </div>
                  </div>
                </div>
              )}

              {request.clicked_at && (
                <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                  <ExternalLinkIcon className="h-4 w-4 text-orange-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-orange-900">Link Clicked</div>
                    <div className="text-sm text-orange-700">
                      {formatDateTime(request.clicked_at)}
                    </div>
                  </div>
                </div>
              )}

              {request.nudge_sent && request.nudge_sent_at && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <MessageSquareIcon className="h-4 w-4 text-purple-600 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-purple-900">Nudge SMS Sent</div>
                    <div className="text-sm text-purple-700">
                      {formatDateTime(request.nudge_sent_at)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Review Link */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700">Review Link</div>
            <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
              <code className="flex-1 text-sm text-gray-600 break-all">
                {sentimentGateUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={() => copyToClipboard(sentimentGateUrl)}
              >
                <CopyIcon className="h-3 w-3 mr-1" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                asChild
              >
                <a
                  href={sentimentGateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLinkIcon className="h-3 w-3 mr-1" />
                  Test Link
                </a>
              </Button>
            </div>
          </div>

          {/* Technical Details */}
          <details className="space-y-2">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              Technical Details
            </summary>
            <div className="grid gap-3 text-sm p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">Request ID:</span> {request.id}
              </div>
              <div>
                <span className="font-medium">Token:</span> {request.token}
              </div>
              <div>
                <span className="font-medium">Nudge Sent:</span> {request.nudge_sent ? 'Yes' : 'No'}
              </div>
            </div>
          </details>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {request.status === 'failed' && (
            <Button>
              Retry SMS
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}