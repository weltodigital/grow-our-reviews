'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { completeOnboarding } from './actions'

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState('')
  const [googleReviewUrl, setGoogleReviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await completeOnboarding({
        businessName: businessName.trim(),
        googleReviewUrl: googleReviewUrl.trim(),
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
                <Label htmlFor="googleReviewUrl">Google Reviews URL *</Label>
                <Input
                  id="googleReviewUrl"
                  type="url"
                  value={googleReviewUrl}
                  onChange={(e) => setGoogleReviewUrl(e.target.value)}
                  placeholder="https://search.google.com/local/writereview?placeid=..."
                  required
                  className="mt-1"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Where customers will be sent to leave a review. Find this by searching for your business on Google, clicking "Write a review", and copying the URL.
                </p>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading || !businessName.trim() || !googleReviewUrl.trim()}
              >
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
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