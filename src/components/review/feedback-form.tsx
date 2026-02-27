'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Star, Send } from 'lucide-react'

interface FeedbackFormProps {
  token: string
  businessName: string
  customerName: string
  rating: number
}

export function FeedbackForm({
  token,
  businessName,
  customerName,
  rating
}: FeedbackFormProps) {
  const [comment, setComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          rating,
          comment: comment.trim(),
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to submit feedback')
      }

      setIsSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <Card className="w-full max-w-md mx-auto text-center">
          <CardContent className="pt-8 pb-8">
            <div className="mb-4">
              <div className="flex justify-center mb-4">
                <div className="rounded-full bg-green-100 p-3">
                  <Star className="h-8 w-8 text-green-600" />
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Thank You!
              </h2>
              <p className="text-gray-600">
                Your feedback has been sent to {businessName}. We appreciate you taking the time to help us improve.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
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

          <div className="flex justify-center mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 mx-1 ${
                  star <= rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300'
                }`}
              />
            ))}
          </div>

          <CardTitle className="text-lg text-gray-900 mb-2">
            We're sorry to hear that, {customerName}
          </CardTitle>
          <p className="text-gray-600 text-sm">
            Your feedback helps us improve our service. What could we have done better?
          </p>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Tell us what went wrong or how we could improve..."
              className="min-h-[120px] resize-none"
              maxLength={1000}
            />

            <div className="text-xs text-gray-500 text-right">
              {comment.length}/1000 characters
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Send Feedback
                  </>
                )}
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => setComment('')}
                disabled={isSubmitting}
              >
                Clear
              </Button>
            </div>
          </form>

          <p className="text-xs text-gray-500 mt-4 text-center">
            This feedback is private and will only be seen by {businessName}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}