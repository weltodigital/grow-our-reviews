'use client'

import { useState } from 'react'
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

  // Check if there's an existing google review URL to determine initial state
  const currentGoogleUrl = profile.google_review_url
  const newGoogleUrl = selectedBusiness?.reviewUrl || null

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
          />

          {/* Current Google Review URL Status */}
          {currentGoogleUrl && !selectedBusiness && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Current Google Reviews URL:</strong> Configured ✓
              </p>
              <p className="text-xs text-blue-600 mt-1">
                Search for your business above to update it, or keep the current URL.
              </p>
            </div>
          )}

          {!currentGoogleUrl && !selectedBusiness && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Google Reviews URL not configured</strong>
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Search for your business above to automatically set up Google Reviews, or you'll need to add this before sending review requests.
              </p>
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