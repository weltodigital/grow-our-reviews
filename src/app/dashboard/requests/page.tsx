'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RequestsTable } from '@/components/dashboard/requests-table'
import { RequestFilters } from '@/components/dashboard/request-filters'
import { SmsFailureAlert } from '@/components/dashboard/SmsFailureAlert'
import { QueuedStatusInfo } from '@/components/dashboard/queued-status-info'
import { ArrowLeft, Search, Plus, Download } from 'lucide-react'
import Link from 'next/link'

export interface ReviewRequest {
  id: string
  customer_name: string
  customer_phone: string
  status: 'scheduled' | 'queued' | 'sent' | 'clicked' | 'feedback_given' | 'failed' | 'suppressed'
  scheduled_for: string
  sent_at: string | null
  clicked_at: string | null
  nudge_sent: boolean
  nudge_sent_at: string | null
  token: string
  created_at: string
  sms_error_code?: string | null
  sms_error_message?: string | null
  sms_failed_at?: string | null
  retry_count?: number
  queued_reason?: string | null
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ReviewRequest[]>([])
  const [statusCounts, setStatusCounts] = useState({
    all: 0,
    scheduled: 0,
    queued: 0,
    sent: 0,
    clicked: 0,
    feedback_given: 0,
    failed: 0,
    suppressed: 0,
  })
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [isFilteringOrSearching, setIsFilteringOrSearching] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState('')

  const requestsPerPage = 20

  // Debounce search term to prevent API calls on every keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm)
    }, 500)

    return () => clearTimeout(timer)
  }, [searchTerm])

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        // Determine if this is initial load or filtering/searching
        const isInitialLoad = requests.length === 0 && !error

        if (isInitialLoad) {
          setIsLoading(true)
        } else {
          setIsFilteringOrSearching(true)
        }
        setError('')

        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: requestsPerPage.toString(),
        })

        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter)
        }

        if (debouncedSearchTerm.trim()) {
          params.append('search', debouncedSearchTerm.trim())
        }

        const response = await fetch(`/api/requests?${params}`)
        if (!response.ok) throw new Error('Failed to fetch requests')

        const data = await response.json()
        setRequests(data.requests || [])
        setTotalPages(data.totalPages || 1)
        setTotalCount(data.total || 0)
        setStatusCounts(data.statusCounts || {
          all: 0,
          scheduled: 0,
          queued: 0,
          sent: 0,
          clicked: 0,
          feedback_given: 0,
          failed: 0,
          suppressed: 0,
        })
      } catch (err: any) {
        setError(err.message || 'Failed to load requests')
      } finally {
        setIsLoading(false)
        setIsFilteringOrSearching(false)
      }
    }

    fetchRequests()
  }, [currentPage, statusFilter, debouncedSearchTerm])

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, debouncedSearchTerm])

  const handleExport = () => {
    const { exportToCSV, formatRequestsForExport } = require('@/lib/export')
    const dataToExport = formatRequestsForExport(requests)
    exportToCSV(dataToExport, 'review-requests')
  }


  // Initial loading (only show on first page load)
  const isInitialLoading = isLoading && requests.length === 0 && !error

  if (isInitialLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Skeleton for filters */}
        <div className="flex gap-4 mb-6">
          <div className="h-10 w-64 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Skeleton for table */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded">
                  <div className="space-y-2">
                    <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
                  <div className="h-6 w-20 bg-gray-200 rounded animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Review Requests</h1>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to load requests
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()} className="text-white">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Requests</h1>
            <p className="text-gray-600">
              Manage and track all your review requests
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button asChild className="!text-black">
            <Link href="/dashboard/send">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

      {/* SMS Failure Alert */}
      <SmsFailureAlert />

      {/* Queue Status Info */}
      <QueuedStatusInfo
        queuedCount={statusCounts.queued}
        queuedReasons={requests.filter(r => r.status === 'queued' && r.queued_reason).map(r => r.queued_reason!)}
      />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status Filter */}
          <RequestFilters
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            statusCounts={statusCounts}
          />

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              {isFilteringOrSearching && debouncedSearchTerm ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-green-600 border-t-transparent absolute left-3 top-1/2 transform -translate-y-1/2" />
              ) : (
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              )}
              <Input
                placeholder="Search by customer name or phone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Results summary */}
          <div className="text-sm text-gray-600">
            Showing {requests.length} of {totalCount} requests {totalPages > 1 && `(page ${currentPage} of ${totalPages})`}
          </div>
        </CardContent>
      </Card>

      {/* Requests Table, Loading State, or Empty State */}
      {isInitialLoading ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-green-600 border-t-transparent mx-auto mb-4"></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading requests...</h3>
            <p className="text-gray-600">Please wait while we fetch your review requests.</p>
          </CardContent>
        </Card>
      ) : isFilteringOrSearching ? (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-green-600 border-t-transparent"></div>
              <span className="text-gray-600">Updating results...</span>
            </div>
          </CardContent>
        </Card>
      ) : requests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' && !debouncedSearchTerm
                ? 'No review requests yet'
                : 'No matching requests found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all' && !debouncedSearchTerm
                ? 'Start sending review requests to see them appear here.'
                : 'Try adjusting your filters or search terms.'}
            </p>
            {statusFilter === 'all' && !debouncedSearchTerm && (
              <Button asChild className="!text-black">
                <Link href="/dashboard/send">
                  <Plus className="h-4 w-4 mr-2" />
                  Send First Request
                </Link>
              </Button>
            )}
            {(statusFilter !== 'all' || debouncedSearchTerm) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all')
                  setSearchTerm('')
                  setDebouncedSearchTerm('')
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <RequestsTable
          requests={requests}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onRequestsChange={() => {
            // Refresh the requests by re-fetching
            const fetchRequests = async () => {
              try {
                setIsFilteringOrSearching(true)
                setError('')

                const params = new URLSearchParams({
                  page: currentPage.toString(),
                  limit: requestsPerPage.toString(),
                })

                if (statusFilter && statusFilter !== 'all') {
                  params.append('status', statusFilter)
                }

                if (debouncedSearchTerm.trim()) {
                  params.append('search', debouncedSearchTerm.trim())
                }

                const response = await fetch(`/api/requests?${params}`)
                if (!response.ok) throw new Error('Failed to fetch requests')

                const data = await response.json()
                setRequests(data.requests || [])
                setTotalPages(data.totalPages || 1)
                setTotalCount(data.total || 0)
                setStatusCounts(data.statusCounts || {
                  all: 0,
                  scheduled: 0,
                  queued: 0,
                  sent: 0,
                  clicked: 0,
                  feedback_given: 0,
                  failed: 0,
                  suppressed: 0,
                })
              } catch (err: any) {
                setError(err.message || 'Failed to load requests')
              } finally {
                setIsFilteringOrSearching(false)
              }
            }
            fetchRequests()
          }}
        />
      )}
    </div>
  )
}