'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronDown, ChevronUp } from 'lucide-react'
import GoogleReviewGuide from '@/components/GoogleReviewGuide'
import { completeOnboarding } from './actions'

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState('')
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showGuide, setShowGuide] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await completeOnboarding({
        businessName: businessName.trim(),
        googleReviewUrl: googleReviewUrl.trim() || null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSkip = async () => {
    setIsLoading(true)
    setError('')

    try {
      const result = await completeOnboarding({
        businessName: businessName.trim(),
        googleReviewUrl: null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/dashboard')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome to Grow Our Reviews</h1>
          <p className="mt-2 text-sm text-gray-600">
            Let's get your business set up so you can start collecting reviews
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Business Information</CardTitle>
            <CardDescription>
              We need a few details to personalize your review requests
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="e.g. Smith Plumbing Services"
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will appear in your SMS messages to customers
                </p>
              </div>

              <div>
                <Label htmlFor="googleReviewUrl">Google Reviews URL</Label>
                <Input
                  id="googleReviewUrl"
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Where customers will be sent to leave a review. You can add this later if you don't have it ready.
                </p>

                {/* Collapsible Guide */}
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setShowGuide(!showGuide)}
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    {showGuide ? (
                      <>
                        <ChevronUp className="h-4 w-4" />
                        Hide guide
                      </>
                    ) : (
                      <>
                        <ChevronDown className="h-4 w-4" />
                        How do I find this?
                      </>
                    )}
                  </button>

                  {showGuide && (
                    <div className="mt-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                      <GoogleReviewGuide showTitle={false} className="text-sm" />
                    </div>
                  )}
                </div>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading || !businessName.trim()}
                >
                  {isLoading ? 'Setting up...' : 'Complete Setup'}
                </Button>

                {!googleReviewUrl.trim() && businessName.trim() && (
                  <div className="text-center">
                    <button
                      type="button"
                      onClick={handleSkip}
                      disabled={isLoading}
                      className="text-sm text-blue-600 hover:text-blue-500 underline"
                    >
                      Skip for now - I'll add this later
                    </button>
                    <p className="text-xs text-gray-500 mt-1">
                      No problem — you can add this anytime from Settings. You'll need it before you can send your first review request.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Having trouble finding your Google Reviews URL?{' '}
            <a
              href="mailto:support@growourreviews.com"
              className="text-blue-600 hover:text-blue-500"
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}