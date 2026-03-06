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
  const [debugInfo, setDebugInfo] = useState<string[]>([])

  const addDebug = (message: string) => {
    setDebugInfo(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setDebugInfo([])

    try {
      addDebug('🚀 Starting submission')

      // Add debugging info for mobile issues
      const userAgent = navigator.userAgent
      const isMobile = /Mobile|Android|iPhone|iPad/i.test(userAgent)
      addDebug(`📱 Mobile: ${isMobile}, User Agent: ${userAgent.substring(0, 50)}...`)

      const cleanComment = comment || ''
      addDebug(`📝 Comment length: ${cleanComment.length}`)

      // Try to create the request body step by step for debugging
      addDebug('📦 Creating request body...')
      const requestBody = {
        token: token,
        rating: rating,
        comment: cleanComment
      }
      addDebug(`✅ Request body created with token: ${token.substring(0, 8)}...`)

      addDebug('🔄 JSON stringifying...')
      const requestBodyString = JSON.stringify(requestBody)
      addDebug(`✅ JSON stringified, length: ${requestBodyString.length}`)

      addDebug('🌐 Making fetch request...')
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: requestBodyString,
      })

      addDebug(`📡 Response status: ${response.status} ${response.statusText}`)

      // Check what type of response we got
      const contentType = response.headers.get('content-type')
      addDebug(`📋 Content-Type: ${contentType}`)

      if (!response.ok) {
        addDebug('❌ Response not OK, attempting to get error data...')

        try {
          // Try to get response as text first to see what we actually received
          const responseText = await response.text()
          addDebug(`📄 Response text (first 200 chars): ${responseText.substring(0, 200)}`)

          // Try to parse as JSON if it looks like JSON
          if (contentType?.includes('application/json')) {
            try {
              const errorData = JSON.parse(responseText)
              addDebug(`💥 Parsed JSON Error: ${JSON.stringify(errorData)}`)
              throw new Error(errorData.error || 'Failed to submit feedback')
            } catch (parseError) {
              addDebug(`🚫 JSON parse failed: ${parseError}`)
              throw new Error(`Server returned non-JSON response: ${responseText.substring(0, 100)}`)
            }
          } else {
            addDebug('🚫 Response is not JSON, likely HTML error page')
            throw new Error(`Server error (${response.status}): ${responseText.substring(0, 100)}`)
          }
        } catch (readError) {
          addDebug(`💥 Failed to read response: ${readError}`)
          throw new Error(`Cannot read server response: ${readError}`)
        }
      }

      // For successful response, try to parse JSON safely
      try {
        const responseText = await response.text()
        addDebug(`✅ Success response: ${responseText.substring(0, 100)}`)

        if (contentType?.includes('application/json')) {
          const successData = JSON.parse(responseText)
          addDebug(`🎉 Parsed success data: ${JSON.stringify(successData)}`)
        } else {
          addDebug('⚠️ Success but no JSON content type')
        }
      } catch (successParseError) {
        addDebug(`⚠️ Success but failed to parse response: ${successParseError}`)
        // Don't throw error for success case, just log it
      }

      addDebug('🎉 Success! Setting submitted state...')
      setIsSubmitted(true)
    } catch (err) {
      addDebug(`💀 Caught error: ${err}`)
      addDebug(`🔍 Error type: ${typeof err}`)
      addDebug(`🏗️ Error constructor: ${err?.constructor?.name}`)

      let errorMessage = 'Something went wrong'

      if (err instanceof Error) {
        errorMessage = err.message
        addDebug(`📚 Error message: ${err.message}`)
        if (err.stack) {
          addDebug(`📋 Error stack: ${err.stack.substring(0, 200)}...`)
        }
      } else if (typeof err === 'string') {
        errorMessage = err
      } else {
        errorMessage = `Unknown error: ${JSON.stringify(err)}`
      }

      setError(`Mobile Error: ${errorMessage}`)
    } finally {
      setIsSubmitting(false)
      addDebug('🏁 Submission complete')
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
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                <p className="text-sm text-red-600 font-medium">{error}</p>
              </div>
            )}

            {debugInfo.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
                <p className="text-sm font-medium text-blue-800 mb-2">🔍 Debug Info:</p>
                <div className="text-xs text-blue-700 space-y-1 max-h-40 overflow-y-auto">
                  {debugInfo.map((info, index) => (
                    <div key={index} className="font-mono bg-white bg-opacity-50 p-1 rounded">
                      {info}
                    </div>
                  ))}
                </div>
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