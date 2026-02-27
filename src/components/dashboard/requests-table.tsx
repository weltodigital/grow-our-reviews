'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StatusBadge } from './status-badge'
import { RequestDetailsModal } from './request-details-modal'
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  RefreshCwIcon,
  ExternalLinkIcon
} from 'lucide-react'
import type { ReviewRequest } from '@/app/dashboard/requests/page'

interface RequestsTableProps {
  requests: ReviewRequest[]
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function RequestsTable({
  requests,
  currentPage,
  totalPages,
  onPageChange
}: RequestsTableProps) {
  const [selectedRequest, setSelectedRequest] = useState<ReviewRequest | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-'
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

  const handleViewDetails = (request: ReviewRequest) => {
    setSelectedRequest(request)
    setIsModalOpen(true)
  }

  const handleRetryFailed = async (request: ReviewRequest) => {
    // TODO: Implement retry logic
    console.log('Retry failed request:', request.id)
  }

  const getActionButton = (request: ReviewRequest) => {
    switch (request.status) {
      case 'failed':
        return (
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleRetryFailed(request)}
            className="text-red-600 hover:text-red-700"
          >
            <RefreshCwIcon className="h-3 w-3 mr-1" />
            Retry
          </Button>
        )
      case 'clicked':
      case 'reviewed':
      case 'feedback_given':
        return (
          <Button
            size="sm"
            variant="outline"
            asChild
            className="text-blue-600 hover:text-blue-700"
          >
            <a
              href={`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${request.token}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLinkIcon className="h-3 w-3 mr-1" />
              View
            </a>
          </Button>
        )
      default:
        return null
    }
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="text-gray-500 mb-2">No review requests found</div>
          <p className="text-sm text-gray-400">
            Try adjusting your filters or create a new review request
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <CardContent className="p-0">
          {/* Desktop Table */}
          <div className="hidden lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Scheduled
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sent
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nudge
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {requests.map((request) => (
                    <tr key={request.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">
                            {request.customer_name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatPhone(request.customer_phone)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={request.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(request.scheduled_for)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDateTime(request.sent_at)}
                      </td>
                      <td className="px-6 py-4">
                        {request.nudge_sent ? (
                          <span className="text-sm text-orange-600">
                            Sent {formatDateTime(request.nudge_sent_at)}
                          </span>
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(request)}
                          >
                            <EyeIcon className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                          {getActionButton(request)}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden divide-y divide-gray-200">
            {requests.map((request) => (
              <div key={request.id} className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-gray-900">
                      {request.customer_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatPhone(request.customer_phone)}
                    </div>
                  </div>
                  <StatusBadge status={request.status} />
                </div>

                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500">Scheduled:</span>
                    <div className="font-medium">
                      {formatDateTime(request.scheduled_for)}
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Sent:</span>
                    <div className="font-medium">
                      {formatDateTime(request.sent_at)}
                    </div>
                  </div>
                </div>

                {request.nudge_sent && (
                  <div className="text-sm">
                    <span className="text-gray-500">Nudge sent:</span>
                    <span className="font-medium text-orange-600 ml-1">
                      {formatDateTime(request.nudge_sent_at)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleViewDetails(request)}
                  >
                    <EyeIcon className="h-3 w-3 mr-1" />
                    Details
                  </Button>
                  {getActionButton(request)}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
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
            </div>
          )}
        </CardContent>
      </Card>

      {/* Request Details Modal */}
      <RequestDetailsModal
        request={selectedRequest}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  )
}