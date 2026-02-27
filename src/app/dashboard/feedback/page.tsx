'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { FeedbackList } from '@/components/dashboard/feedback-list'
import { FeedbackFilters } from '@/components/dashboard/feedback-filters'
import { FeedbackAnalytics } from '@/components/dashboard/feedback-analytics'
import { ArrowLeft, Search, Download, MessageSquare } from 'lucide-react'
import Link from 'next/link'

export interface FeedbackItem {
  id: string
  customer_name: string
  customer_phone: string
  rating: number
  comment: string | null
  created_at: string
  review_request_id: string
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [ratingFilter, setRatingFilter] = useState<number | 'all'>('all')
  const [dateFilter, setDateFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [error, setError] = useState('')
  const [total, setTotal] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [analytics, setAnalytics] = useState({
    totalFeedback: 0,
    averageRating: 0,
    ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  })

  const feedbackPerPage = 10

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setIsLoading(true)
        setError('')

        // Build query parameters
        const params = new URLSearchParams({
          page: currentPage.toString(),
          limit: feedbackPerPage.toString(),
          rating: ratingFilter.toString(),
          dateFilter: dateFilter,
          search: searchTerm.trim()
        })

        const response = await fetch(`/api/feedback?${params}`)
        if (!response.ok) {
          throw new Error('Failed to fetch feedback')
        }

        const data = await response.json()

        setFeedback(data.feedback)
        setTotal(data.total)
        setTotalPages(data.totalPages)
        setAnalytics(data.analytics)
        setIsLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to load feedback')
        setIsLoading(false)
      }
    }

    fetchFeedback()
  }, [currentPage, ratingFilter, dateFilter, searchTerm])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [ratingFilter, dateFilter, searchTerm])

  const handleExport = () => {
    const { exportFeedbackToCSV, formatFeedbackForExport } = require('@/lib/export-feedback')
    const dataToExport = formatFeedbackForExport(feedback)
    exportFeedbackToCSV(dataToExport, 'customer-feedback')
  }

  const ratingCounts = {
    all: analytics.totalFeedback,
    1: analytics.ratingDistribution[1],
    2: analytics.ratingDistribution[2],
    3: analytics.ratingDistribution[3],
    4: analytics.ratingDistribution[4],
    5: analytics.ratingDistribution[5],
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse"></div>
        </div>

        {/* Analytics skeleton */}
        <div className="grid gap-6 md:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-16 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feedback list skeleton */}
        <Card>
          <CardHeader>
            <div className="h-6 w-32 bg-gray-200 rounded animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border rounded">
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <div className="h-4 w-32 bg-gray-200 rounded animate-pulse"></div>
                      <div className="h-4 w-20 bg-gray-200 rounded animate-pulse"></div>
                    </div>
                    <div className="h-16 w-full bg-gray-200 rounded animate-pulse"></div>
                    <div className="h-3 w-24 bg-gray-200 rounded animate-pulse"></div>
                  </div>
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
          <h1 className="text-2xl font-bold">Customer Feedback</h1>
        </div>

        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-red-600 mb-4">
              <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Failed to load feedback
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
            <h1 className="text-2xl font-bold text-gray-900">Customer Feedback</h1>
            <p className="text-gray-600">
              Private feedback from customers who rated your service 1-3 stars
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Analytics Overview */}
      <FeedbackAnalytics feedback={feedback} />

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Rating and Date Filters */}
          <FeedbackFilters
            ratingFilter={ratingFilter}
            onRatingFilterChange={setRatingFilter}
            dateFilter={dateFilter}
            onDateFilterChange={setDateFilter}
            ratingCounts={ratingCounts}
          />

          {/* Search */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by customer name, phone, or comment..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Results summary */}
          <div className="text-sm text-gray-600">
            Showing {feedback.length} of {total} feedback items
          </div>
        </CardContent>
      </Card>

      {/* Feedback List or Empty State */}
      {feedback.length > 0 ? (
        <FeedbackList
          feedback={feedback}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {total === 0 ? 'No feedback received yet' : 'No matching feedback found'}
            </h3>
            <p className="text-gray-600 mb-6">
              {total === 0
                ? 'When customers rate your service 1-3 stars, their private feedback will appear here to help you improve.'
                : 'Try adjusting your search terms or filter criteria to find what you\'re looking for.'
              }
            </p>
            {total === 0 ? (
              <Button asChild>
                <Link href="/dashboard/send">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Send Review Request
                </Link>
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={() => {
                  setRatingFilter('all')
                  setDateFilter('all')
                  setSearchTerm('')
                }}
              >
                Clear All Filters
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}