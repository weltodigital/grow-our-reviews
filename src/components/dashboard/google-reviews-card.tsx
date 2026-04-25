'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Star, ExternalLink, AlertCircle } from 'lucide-react'

interface GoogleReview {
  reviewId: string
  rating: number
  text: string
  relativePublishTimeDescription: string
  publishTime: string
  author: {
    displayName: string
    photoUri?: string
    uri?: string
  }
}

interface ReviewsResponse {
  status: 'ok' | 'no_url' | 'no_place_id'
  message?: string
  placeId?: string
  totalReviewCount?: number | null
  averageRating?: number | null
  reviews?: GoogleReview[]
  lastFetchedAt?: string
  lastError?: string | null
}

function StarRating({ rating, size = 16 }: { rating: number; size?: number }) {
  const rounded = Math.round(rating)
  return (
    <div className="flex items-center gap-0.5" aria-label={`${rating} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          size={size}
          className={n <= rounded ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}
        />
      ))}
    </div>
  )
}

export function GoogleReviewsCard() {
  const [data, setData] = useState<ReviewsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch('/api/google-reviews')
        if (!res.ok) throw new Error(`Request failed: ${res.status}`)
        const json = (await res.json()) as ReviewsResponse
        if (!cancelled) setData(json)
      } catch (err) {
        if (!cancelled) setFetchError(err instanceof Error ? err.message : 'Failed to load reviews')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Google Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-7 w-56 bg-gray-200 rounded animate-pulse"></div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 bg-gray-100 rounded animate-pulse"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (fetchError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Google Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />
            <span>Could not load Google reviews: {fetchError}</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!data || data.status === 'no_url') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Google Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-gray-600 mb-3">
            Connect your Google Business profile to see your reviews here.
          </p>
          <Link
            href="/dashboard/settings"
            className="inline-flex items-center gap-1 text-sm font-medium text-green-700 hover:text-green-800"
          >
            Add your Google review URL
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </CardContent>
      </Card>
    )
  }

  if (data.status === 'no_place_id') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Recent Google Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 text-sm text-gray-600">
            <AlertCircle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
            <span>
              We couldn&apos;t recognise your Google review URL format.{' '}
              <Link href="/dashboard/settings" className="text-green-700 hover:text-green-800 underline">
                Reconnect it
              </Link>{' '}
              by searching for your business.
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  const { totalReviewCount, averageRating, reviews = [], lastError } = data

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Your Recent Google Reviews</CardTitle>
          <div className="mt-2 flex items-center gap-3">
            {averageRating != null && (
              <div className="flex items-center gap-2">
                <span className="text-2xl font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
                <StarRating rating={averageRating} size={18} />
              </div>
            )}
            {totalReviewCount != null && (
              <span className="text-sm text-gray-600">
                {totalReviewCount.toLocaleString()} {totalReviewCount === 1 ? 'review' : 'reviews'}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {lastError && (
          <div className="mb-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">
            <AlertCircle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
            <span>Showing cached reviews — couldn&apos;t refresh from Google. {lastError}</span>
          </div>
        )}

        {reviews.length === 0 ? (
          <p className="text-sm text-gray-600">No reviews yet. They&apos;ll appear here once customers leave one on Google.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.slice(0, 5).map((review) => (
              <div
                key={review.reviewId}
                className="border border-gray-200 rounded-md p-3 text-sm flex flex-col gap-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    {review.author.photoUri ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={review.author.photoUri}
                        alt=""
                        className="h-6 w-6 rounded-full"
                      />
                    ) : (
                      <div className="h-6 w-6 rounded-full bg-gray-200 flex items-center justify-center text-[10px] font-medium text-gray-600">
                        {review.author.displayName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="font-medium text-gray-900 truncate">{review.author.displayName}</span>
                  </div>
                  <StarRating rating={review.rating} size={14} />
                </div>
                {review.text && (
                  <p className="text-gray-700 line-clamp-4 whitespace-pre-line">{review.text}</p>
                )}
                <span className="text-xs text-gray-500 mt-auto">
                  {review.relativePublishTimeDescription}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
