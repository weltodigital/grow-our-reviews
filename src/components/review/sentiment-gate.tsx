'use client'

import { useState } from 'react'
import { StarRating } from './star-rating'
import { FeedbackForm } from './feedback-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface SentimentGateProps {
  token: string
  businessName: string
  customerName: string
  googleReviewUrl: string
}

export function SentimentGate({
  token,
  businessName,
  customerName,
  googleReviewUrl
}: SentimentGateProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleRatingSelect = async (rating: number) => {
    setSelectedRating(rating)

    if (rating >= 4) {
      // High rating - redirect to Google Reviews
      setIsRedirecting(true)

      // Show brief thank you message before redirect
      setTimeout(() => {
        window.location.href = googleReviewUrl
      }, 1500)
    }
    // Low rating (1-3) - show feedback form (handled by component state)
  }

  if (isRedirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mb-4">
              <div className="flex justify-center mb-4">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-600 border-t-transparent"></div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Thank you!
              </h2>
              <p className="text-gray-600">
                Redirecting you to leave a review for {businessName}...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (selectedRating !== null && selectedRating <= 3) {
    return (
      <FeedbackForm
        token={token}
        businessName={businessName}
        customerName={customerName}
        rating={selectedRating}
      />
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center pb-6">
          <div className="mb-4">
            <div className="text-2xl font-bold text-blue-600 mb-2">
              {businessName}
            </div>
            <div className="h-1 w-16 bg-blue-600 mx-auto rounded"></div>
          </div>
          <CardTitle className="text-xl text-gray-900">
            Hi {customerName}!
          </CardTitle>
          <p className="text-gray-600 mt-2">
            How was your experience with {businessName}?
          </p>
        </CardHeader>

        <CardContent className="text-center pb-8">
          <StarRating
            onRatingSelect={handleRatingSelect}
            selectedRating={selectedRating}
          />

          <p className="text-sm text-gray-500 mt-6">
            Tap a star to rate your experience
          </p>
        </CardContent>
      </Card>
    </div>
  )
}