'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, ExternalLink, Save, HelpCircle, X } from 'lucide-react'
import { updateBusinessInfo } from './settings-actions'
import BusinessSearch from '@/components/BusinessSearch'
import type { Database } from '@/types/database'

interface Business {
  placeId: string
  name: string
  address: string
  rating?: number
  userRatingsTotal?: number
  types: string[]
  reviewUrl: string
}

interface BusinessInfoSettingsProps {
  profile: Database['public']['Tables']['profiles']['Row']
  onSettingsChange: () => void
  onSettingsSaved: () => void
}

export function BusinessInfoSettings({
  profile,
  onSettingsChange,
  onSettingsSaved
}: BusinessInfoSettingsProps) {
  const router = useRouter()
  const [businessName, setBusinessName] = useState(profile.business_name || '')
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [phone, setPhone] = useState(profile.phone || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showManualUrlInput, setShowManualUrlInput] = useState(false)
  const [manualGoogleUrl, setManualGoogleUrl] = useState(profile.google_review_url || '')

  // Auto-focus the manual URL input when it opens
  const manualUrlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (showManualUrlInput && manualUrlInputRef.current) {
      // Small delay to ensure the input is rendered
      setTimeout(() => {
        manualUrlInputRef.current?.focus()
      }, 100)
    }
  }, [showManualUrlInput])

  // Check if there's an existing google review URL to determine initial state
  const currentGoogleUrl = profile.google_review_url
  const newGoogleUrl = selectedBusiness?.reviewUrl || (showManualUrlInput ? manualGoogleUrl : null)

  const hasChanges =
    businessName !== (profile.business_name || '') ||
    newGoogleUrl !== currentGoogleUrl ||
    phone !== (profile.phone || '')

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'businessName':
        setBusinessName(value)
        break
      case 'phone':
        setPhone(value)
        break
    }

    if (!hasChanges) {
      onSettingsChange()
    }

    setError('')
    setSuccess('')
  }

  const handleBusinessSelect = (business: Business | null) => {
    setSelectedBusiness(business)
    // Clear manual URL input when business is selected
    setShowManualUrlInput(false)
    setManualGoogleUrl('')
    if (!hasChanges) {
      onSettingsChange()
    }
    setError('')
    setSuccess('')
  }

  const handleBusinessNameChange = (name: string) => {
    setBusinessName(name)
    if (!hasChanges) {
      onSettingsChange()
    }
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (!businessName.trim()) {
      setError('Business name is required')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const result = await updateBusinessInfo({
        businessName: businessName.trim(),
        googleReviewUrl: newGoogleUrl,
        phone: phone.trim() || null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Business information updated successfully!')
        onSettingsSaved()
        // Refresh the router to update the layout with new business name
        router.refresh()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Format as UK number if it starts with 07 or 447
    if (digits.startsWith('07') && digits.length <= 11) {
      return digits.replace(/(\d{2})(\d{4})(\d{6})/, '$1$2 $3')
    } else if (digits.startsWith('447') && digits.length <= 13) {
      return '+' + digits.replace(/(\d{3})(\d{4})(\d{6})/, '$1 $2 $3')
    }

    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    handleInputChange('phone', formatted)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5 text-green-600" />
          Business Information
        </CardTitle>
        <CardDescription>
          This information appears in your SMS messages and review requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-6">
          {/* Business Search */}
          <BusinessSearch
            value={businessName}
            onBusinessSelect={handleBusinessSelect}
            onBusinessNameChange={handleBusinessNameChange}
            placeholder="Search for your business to update Google Reviews URL..."
            label="Business Information"
            helperText="Search for your business to automatically configure Google Reviews. You can edit the business name that appears in SMS messages."
            required
            showTestLink={true}
            currentGoogleUrl={currentGoogleUrl}
            onManualEntry={() => {
              setShowManualUrlInput(true)
              setManualGoogleUrl('')
            }}
          />

          {/* Current Google Review URL Status */}
          {currentGoogleUrl && !selectedBusiness && !showManualUrlInput && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-blue-800">
                    <strong>Current Google Reviews URL:</strong> Configured ✓
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Search for your business above to update it automatically, or edit the URL manually below.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowManualUrlInput(true)
                    setManualGoogleUrl(currentGoogleUrl || '')
                  }}
                  className="ml-3 text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  Edit Manually
                </Button>
              </div>
            </div>
          )}

          {!currentGoogleUrl && !selectedBusiness && !showManualUrlInput && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-sm text-amber-800">
                    <strong>Google Reviews URL not configured</strong>
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Search for your business above to automatically set up Google Reviews, or add it manually below.
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowManualUrlInput(true)}
                  className="ml-3 text-amber-600 border-amber-300 hover:bg-amber-50"
                >
                  Add Manually
                </Button>
              </div>
            </div>
          )}

          {/* Manual Google URL Input */}
          {showManualUrlInput && !selectedBusiness && (
            <div className="space-y-4">
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  {currentGoogleUrl ? 'Edit Google Reviews URL' : 'Manual Google Reviews URL'}
                </p>
                <p className="text-xs text-blue-600 mb-4">
                  {currentGoogleUrl
                    ? 'Update your Google Reviews URL for businesses not found in search, or if your business details have changed.'
                    : 'Perfect for Service Area Businesses (SAB), tradesmen, and businesses not found in the search above.'
                  }
                </p>

                {/* Detailed Instructions */}
                <div className="bg-white border border-blue-200 rounded-lg p-3 mb-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-3">How to get your Google Reviews URL:</h4>

                  <div className="space-y-4">
                    {/* Method 1: Google Business Profile Manager */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
                        <h5 className="text-sm font-medium text-blue-900">Best Method: Google Business Profile Manager</h5>
                      </div>
                      <div className="ml-7 space-y-1">
                        <p className="text-xs text-blue-700">• Log in to <strong>business.google.com</strong></p>
                        <p className="text-xs text-blue-700">• Select your business</p>
                        <p className="text-xs text-blue-700">• Click <strong>"Ask for reviews"</strong> or <strong>"Get more reviews"</strong></p>
                        <p className="text-xs text-blue-700">• Copy the review link</p>
                        <p className="text-xs text-green-700 font-medium">✓ Example: https://g.page/r/[your-place-id]/review</p>
                      </div>
                    </div>

                    {/* Method 2: Google Search */}
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="flex-shrink-0 w-5 h-5 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
                        <h5 className="text-sm font-medium text-blue-900">Alternative: Google Search</h5>
                      </div>
                      <div className="ml-7 space-y-1">
                        <p className="text-xs text-blue-700">• Search Google for: <strong>"[Your Business Name] reviews"</strong></p>
                        <p className="text-xs text-blue-700">• Click on your business listing</p>
                        <p className="text-xs text-blue-700">• Click on the <strong>"Reviews"</strong> tab</p>
                        <p className="text-xs text-blue-700">• Copy the URL from the address bar</p>
                        <p className="text-xs text-blue-700 italic">Example: google.com/search?q=[YourBusiness]+reviews</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                    <strong>💡 Tip:</strong> Method 1 gives you a shorter, cleaner URL that's easier to manage and looks more professional in SMS messages.
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <Label htmlFor="manual-google-url" className="text-xs font-medium text-blue-800">
                      Google Reviews URL
                    </Label>
                    <Input
                      ref={manualUrlInputRef}
                      id="manual-google-url"
                      type="url"
                      value={manualGoogleUrl}
                      onChange={(e) => {
                        setManualGoogleUrl(e.target.value)
                        if (!hasChanges) {
                          onSettingsChange()
                        }
                        setError('')
                        setSuccess('')
                      }}
                      placeholder="https://g.page/r/[your-place-id]/review or https://www.google.com/search?q=..."
                      className="text-sm"
                    />
                    <p className="text-xs text-blue-600 mt-1">
                      Paste either type of URL from the instructions above
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {manualGoogleUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(manualGoogleUrl, '_blank')}
                        className="text-blue-600 border-blue-300 hover:bg-blue-50"
                      >
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Test URL
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setShowManualUrlInput(false)
                        // Reset to original URL if editing, or clear if adding new
                        setManualGoogleUrl(currentGoogleUrl || '')
                      }}
                      className="text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Phone Number */}
          <div className="space-y-2">
            <Label htmlFor="phone">Your Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              value={phone}
              onChange={handlePhoneChange}
              placeholder="07700 123456 (optional)"
            />
            <p className="text-xs text-gray-500">
              Optional contact number for your business
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        {hasChanges && (
          <div className="pt-4 border-t">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="w-full sm:w-auto !text-black"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Business Info
                </>
              )}
            </Button>
          </div>
        )}

      </CardContent>
    </Card>
  )
}