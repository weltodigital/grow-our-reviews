'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import BusinessSearch from '@/components/BusinessSearch'
import { completeOnboarding } from './actions'

interface Business {
  placeId: string
  name: string
  address: string
  rating?: number
  userRatingsTotal?: number
  types: string[]
  reviewUrl: string
}

export default function OnboardingPage() {
  const [businessName, setBusinessName] = useState('')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
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
        googleReviewUrl: selectedBusiness?.reviewUrl || null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        router.push('/billing/setup')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBusinessSelect = (business: Business | null) => {
    setSelectedBusiness(business)
  }

  const handleBusinessNameChange = (name: string) => {
    setBusinessName(name)
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
            <form onSubmit={handleSubmit} className="space-y-6">
              <BusinessSearch
                value={businessName}
                onBusinessSelect={handleBusinessSelect}
                onBusinessNameChange={handleBusinessNameChange}
                placeholder="e.g. Smith Plumbing Services, Bristol"
                label="Find Your Business"
                helperText="Search for your business to automatically set up Google Reviews. You can edit how your business name appears in SMS messages."
                required
                disabled={isLoading}
                showTestLink={true}
              />

              {/* Show manual entry option if no business selected */}
              {!selectedBusiness && businessName.trim() && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Can't find your business?</strong> No problem! You can continue with "{businessName}" and add the Google Reviews URL later from your dashboard settings.
                  </p>
                </div>
              )}

              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <Button
                  type="submit"
                  className="w-full !text-black"
                  disabled={isLoading || !businessName.trim()}
                >
                  {isLoading ? 'Setting up...' : (selectedBusiness ? 'Complete Setup' : 'Continue Setup')}
                </Button>

                {!selectedBusiness && businessName.trim() && (
                  <p className="text-xs text-gray-500 text-center">
                    You can search for your business anytime from Settings to enable Google Reviews.
                  </p>
                )}

                {selectedBusiness && (
                  <div className="text-center">
                    <p className="text-xs text-green-600">
                      ✓ Google Reviews ready! Customers will be directed to leave reviews automatically.
                    </p>
                  </div>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            Can't find your business in the search?{' '}
            <a
              href="mailto:hello@growourreviews.com"
              className="hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              Contact support
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}