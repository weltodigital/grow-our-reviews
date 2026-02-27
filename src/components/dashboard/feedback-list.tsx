'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { RatingDisplay } from './rating-display'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  PhoneIcon,
  ClockIcon,
  MessageSquareIcon
} from 'lucide-react'
import type { FeedbackItem } from '@/app/dashboard/feedback/page'

interface FeedbackListProps {
  feedback: FeedbackItem[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function FeedbackList({
  feedback,
  currentPage,
  totalPages,
  onPageChange
}: FeedbackListProps) {
  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatPhone = (phone: string) => {
    // Format UK numbers for display
    if (phone.startsWith('+447')) {
      return phone.replace('+44', '0').replace(/(\d{5})(\d{6})/, '$1 $2')
    }
    return phone
  }

  const getRatingColor = (rating: number) => {
    switch (rating) {
      case 1:
        return 'text-red-600 bg-red-50 border-red-200'
      case 2:
        return 'text-orange-600 bg-orange-50 border-orange-200'
      case 3:
        return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 4:
        return 'text-green-600 bg-green-50 border-green-200'
      case 5:
        return 'text-green-600 bg-green-50 border-green-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getSeverityInfo = (rating: number) => {
    switch (rating) {
      case 1:
        return { label: 'Critical Issue', color: 'red', priority: 'high' }
      case 2:
        return { label: 'Needs Attention', color: 'orange', priority: 'medium' }
      case 3:
        return { label: 'Room for Improvement', color: 'yellow', priority: 'low' }
      default:
        return { label: 'Good', color: 'green', priority: 'low' }
    }
  }

  if (feedback.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <MessageSquareIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <div className="text-gray-500 mb-2">No feedback found</div>
          <p className="text-sm text-gray-400">
            Try adjusting your filters to see more results
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Feedback Cards */}
      <div className="space-y-4">
        {feedback.map((item) => {
          const severityInfo = getSeverityInfo(item.rating)

          return (
            <Card key={item.id} className={`border-l-4 ${
              item.rating === 1
                ? 'border-l-red-500'
                : item.rating === 2
                ? 'border-l-orange-500'
                : 'border-l-yellow-500'
            }`}>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Header with customer info and rating */}
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="rounded-full bg-gray-100 p-2">
                        <UserIcon className="h-4 w-4 text-gray-600" />
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">
                          {item.customer_name}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <PhoneIcon className="h-3 w-3" />
                          {formatPhone(item.customer_phone)}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <ClockIcon className="h-3 w-3" />
                          {formatDateTime(item.created_at)}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <RatingDisplay rating={item.rating} />
                      <span className={`
                        inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border
                        ${severityInfo.color === 'red' ? 'bg-red-100 text-red-700 border-red-200' :
                          severityInfo.color === 'orange' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                          severityInfo.color === 'yellow' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                          'bg-green-100 text-green-700 border-green-200'}
                      `}>
                        {severityInfo.label}
                      </span>
                    </div>
                  </div>

                  {/* Feedback Content */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    {item.comment && item.comment.trim() ? (
                      <div>
                        <div className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                          <MessageSquareIcon className="h-4 w-4" />
                          Customer Comment
                        </div>
                        <p className="text-gray-800 leading-relaxed">
                          "{item.comment}"
                        </p>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <MessageSquareIcon className="h-6 w-6 text-gray-300 mx-auto mb-2" />
                        <div className="text-sm text-gray-500">
                          No comment provided
                        </div>
                        <div className="text-xs text-gray-400">
                          Customer rated {item.rating} star{item.rating !== 1 ? 's' : ''} but didn't leave a comment
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Items (for low ratings) */}
                  {item.rating <= 2 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <h4 className="font-medium text-blue-900 mb-2">
                        💡 Suggested Actions
                      </h4>
                      <ul className="text-sm text-blue-700 space-y-1">
                        {item.rating === 1 && (
                          <>
                            <li>• Contact customer directly to resolve issues</li>
                            <li>• Document problems to prevent future occurrences</li>
                            <li>• Consider offering compensation or rework</li>
                          </>
                        )}
                        {item.rating === 2 && (
                          <>
                            <li>• Follow up with customer to understand specific issues</li>
                            <li>• Review processes that may have caused problems</li>
                            <li>• Use insights to improve service delivery</li>
                          </>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="px-6 py-4 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}