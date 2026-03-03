'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Building, ExternalLink, Save, HelpCircle, X } from 'lucide-react'
import { updateBusinessInfo } from './settings-actions'
import GoogleReviewGuide from '@/components/GoogleReviewGuide'
import type { Database } from '@/types/database'

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
  const [businessName, setBusinessName] = useState(profile.business_name || '')
  const [googleReviewUrl, setGoogleReviewUrl] = useState(profile.google_review_url || '')
  const [phone, setPhone] = useState(profile.phone || '')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showGuide, setShowGuide] = useState(false)

  const hasChanges =
    businessName !== (profile.business_name || '') ||
    googleReviewUrl !== (profile.google_review_url || '') ||
    phone !== (profile.phone || '')

  const handleInputChange = (field: string, value: string) => {
    switch (field) {
      case 'businessName':
        setBusinessName(value)
        break
      case 'googleReviewUrl':
        setGoogleReviewUrl(value)
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

  const handleSave = async () => {
    if (!businessName.trim()) {
      setError('Business name is required')
      return
    }

    // Basic URL validation (only if provided)
    if (googleReviewUrl.trim()) {
      try {
        new URL(googleReviewUrl)
        // Additional validation for Google URLs
        if (!googleReviewUrl.includes('google')) {
          setError('This doesn\'t look like a Google Review link. Check the guide below for help finding the right one.')
          return
        }
      } catch {
        setError('Please enter a valid Google Review URL')
        return
      }
    }

    setIsSaving(true)
    setError('')

    try {
      const result = await updateBusinessInfo({
        businessName: businessName.trim(),
        googleReviewUrl: googleReviewUrl.trim() || null,
        phone: phone.trim() || null,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Business information updated successfully!')
        onSettingsSaved()
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
          <Building className="h-5 w-5 text-blue-600" />
          Business Information
        </CardTitle>
        <CardDescription>
          This information appears in your SMS messages and review requests
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="businessName">Business Name *</Label>
            <Input
              id="businessName"
              type="text"
              value={businessName}
              onChange={(e) => handleInputChange('businessName', e.target.value)}
              placeholder="e.g. Smith Plumbing Services"
              required
            />
            <p className="text-xs text-gray-500">
              This appears in SMS messages to customers
            </p>
          </div>

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

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Label htmlFor="googleReviewUrl">Google Review URL</Label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowGuide(true)}
              className="text-blue-600 hover:text-blue-700 p-1"
            >
              <HelpCircle className="h-4 w-4" />
            </Button>
          </div>
          <Input
            id="googleReviewUrl"
            type="url"
            value={googleReviewUrl}
            onChange={(e) => handleInputChange('googleReviewUrl', e.target.value)}
            placeholder="https://search.google.com/local/writereview?placeid=..."
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500">
              Where customers go to leave public reviews. {!googleReviewUrl && <span className="text-orange-600">Required before sending review requests.</span>}
            </p>
            {googleReviewUrl && (
              <Button
                variant="outline"
                size="sm"
                asChild
                className="text-xs"
              >
                <a
                  href={googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  Test URL
                </a>
              </Button>
            )}
          </div>
          {!googleReviewUrl && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowGuide(true)}
              className="w-full sm:w-auto"
            >
              <HelpCircle className="h-4 w-4 mr-2" />
              How do I find this?
            </Button>
          )}
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
              className="w-full sm:w-auto"
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

        {/* Guide Modal */}
        {showGuide && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">How to Find Your Google Review Link</h2>
                <button
                  onClick={() => setShowGuide(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <div className="px-6 py-4">
                <GoogleReviewGuide showTitle={false} />
              </div>
              <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
                <Button onClick={() => setShowGuide(false)} className="w-full sm:w-auto">
                  Got it, thanks!
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}