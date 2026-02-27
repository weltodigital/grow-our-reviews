'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RequestsTable } from '@/components/dashboard/requests-table'
import { RequestFilters } from '@/components/dashboard/request-filters'
import { ArrowLeft, Search, Plus, Download } from 'lucide-react'
import Link from 'next/link'

export interface ReviewRequest {
  id: string
  customer_name: string
  customer_phone: string
  status: 'scheduled' | 'sent' | 'clicked' | 'reviewed' | 'feedback_given' | 'failed'
  scheduled_for: string
  sent_at: string | null
  clicked_at: string | null
  nudge_sent: boolean
  nudge_sent_at: string | null
  token: string
  created_at: string
}

export default function RequestsPage() {
  const [requests, setRequests] = useState<ReviewRequest[]>([])
  const [filteredRequests, setFilteredRequests] = useState<ReviewRequest[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState('')

  const requestsPerPage = 20

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        setIsLoading(true)
        setError('')

        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: requestsPerPage.toString(),
        })

        if (statusFilter && statusFilter !== 'all') {
          params.append('status', statusFilter)
        }

        if (searchTerm.trim()) {
          params.append('search', searchTerm.trim())
        }

        const response = await fetch(`/api/requests?${params}`)
        if (!response.ok) throw new Error('Failed to fetch requests')

        const data = await response.json()
        setRequests(data.requests || [])
        setFilteredRequests(data.requests || [])
      } catch (err: any) {
        setError(err.message || 'Failed to load requests')
      } finally {
        setIsLoading(false)
      }
    }

    fetchRequests()
  }, [currentPage, statusFilter, searchTerm])

  // Filter and search logic
  useEffect(() => {
    let filtered = requests

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(request => request.status === statusFilter)
    }

    // Apply search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase().trim()
      filtered = filtered.filter(request =>
        request.customer_name.toLowerCase().includes(search) ||
        request.customer_phone.includes(search)
      )
    }

    setFilteredRequests(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [requests, statusFilter, searchTerm])

  // Pagination
  const totalPages = Math.ceil(filteredRequests.length / requestsPerPage)
  const startIndex = (currentPage - 1) * requestsPerPage
  const paginatedRequests = filteredRequests.slice(startIndex, startIndex + requestsPerPage)

  const handleExport = () => {
    const { exportToCSV, formatRequestsForExport } = require('@/lib/export')
    const dataToExport = formatRequestsForExport(filteredRequests)
    exportToCSV(dataToExport, 'review-requests')
  }

  const statusCounts = {
    all: requests.length,
    scheduled: requests.filter(r => r.status === 'scheduled').length,
    sent: requests.filter(r => r.status === 'sent').length,
    clicked: requests.filter(r => r.status === 'clicked').length,
    reviewed: requests.filter(r => r.status === 'reviewed').length,
    feedback_given: requests.filter(r => r.status === 'feedback_given').length,
    failed: requests.filter(r => r.status === 'failed').length,
  }

  if (isLoading) {
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
            <Button onClick={() => window.location.reload()}>
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
          <Button asChild>
            <Link href="/dashboard/send">
              <Plus className="h-4 w-4 mr-2" />
              New Request
            </Link>
          </Button>
        </div>
      </div>

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
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
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
            Showing {paginatedRequests.length} of {filteredRequests.length} requests
          </div>
        </CardContent>
      </Card>

      {/* Requests Table or Empty State */}
      {filteredRequests.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Search className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {statusFilter === 'all' && !searchTerm
                ? 'No review requests yet'
                : 'No matching requests found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {statusFilter === 'all' && !searchTerm
                ? 'Start sending review requests to see them appear here.'
                : 'Try adjusting your filters or search terms.'}
            </p>
            {statusFilter === 'all' && !searchTerm && (
              <Button asChild>
                <Link href="/dashboard/send">
                  <Plus className="h-4 w-4 mr-2" />
                  Send First Request
                </Link>
              </Button>
            )}
            {(statusFilter !== 'all' || searchTerm) && (
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all')
                  setSearchTerm('')
                }}
              >
                Clear Filters
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <RequestsTable
          requests={paginatedRequests}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  )
}