'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, Save, MessageSquare } from 'lucide-react'
import { updateSmsTimingSettings } from './settings-actions'
import type { Database } from '@/types/database'

interface SmsTimingSettingsProps {
  profile: Database['public']['Tables']['profiles']['Row']
  onSettingsChange: () => void
  onSettingsSaved: () => void
}

export function SmsTimingSettings({
  profile,
  onSettingsChange,
  onSettingsSaved
}: SmsTimingSettingsProps) {
  const [smsDelayHours, setSmsDelayHours] = useState(profile.sms_delay_hours)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const hasChanges = smsDelayHours !== profile.sms_delay_hours

  const handleDelayChange = (value: number) => {
    setSmsDelayHours(value)
    if (!hasChanges) {
      onSettingsChange()
    }
    setError('')
    setSuccess('')
  }

  const handleSave = async () => {
    if (smsDelayHours < 0 || smsDelayHours > 72) {
      setError('SMS delay must be between 0 and 72 hours')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      const result = await updateSmsTimingSettings({
        smsDelayHours,
      })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('SMS timing settings updated successfully!')
        onSettingsSaved()
        setTimeout(() => setSuccess(''), 3000)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const getDelayDescription = (hours: number) => {
    if (hours === 0) {
      return 'SMS sent immediately after creating request'
    } else if (hours === 1) {
      return 'SMS sent 1 hour after creating request'
    } else if (hours < 24) {
      return `SMS sent ${hours} hours after creating request`
    } else {
      const days = Math.floor(hours / 24)
      const remainingHours = hours % 24
      if (remainingHours === 0) {
        return `SMS sent ${days} day${days !== 1 ? 's' : ''} after creating request`
      } else {
        return `SMS sent ${days} day${days !== 1 ? 's' : ''} and ${remainingHours} hour${remainingHours !== 1 ? 's' : ''} after creating request`
      }
    }
  }

  const presetOptions = [
    { hours: 0, label: 'Immediately' },
    { hours: 1, label: '1 hour' },
    { hours: 2, label: '2 hours (Recommended)' },
    { hours: 4, label: '4 hours' },
    { hours: 24, label: '1 day' },
    { hours: 48, label: '2 days' },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          SMS Timing
        </CardTitle>
        <CardDescription>
          Control when review request SMS messages are sent to your customers
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="smsDelay">SMS Delay (Hours)</Label>
          <div className="mt-2 flex items-center gap-3">
            <Input
              id="smsDelay"
              type="number"
              min="0"
              max="72"
              value={smsDelayHours}
              onChange={(e) => handleDelayChange(parseInt(e.target.value) || 0)}
              className="w-24"
            />
            <span className="text-sm text-gray-600">
              hours after creating the request
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Range: 0-72 hours. SMS won't be sent between 9pm-8am regardless of delay.
          </p>
        </div>

        {/* Preset Options */}
        <div>
          <Label className="text-sm font-medium text-gray-700">Quick Presets</Label>
          <div className="mt-2 flex flex-wrap gap-2">
            {presetOptions.map((option) => (
              <Button
                key={option.hours}
                variant={smsDelayHours === option.hours ? "default" : "outline"}
                size="sm"
                onClick={() => handleDelayChange(option.hours)}
                className="text-xs"
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Current Setting Preview */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Current Setting
          </h4>
          <p className="text-sm text-blue-700">
            {getDelayDescription(smsDelayHours)}
          </p>
          {smsDelayHours > 0 && (
            <p className="text-xs text-blue-600 mt-1">
              Perfect for giving you time to complete the job and customers time to settle before requesting a review.
            </p>
          )}
        </div>

        {/* Important Notes */}
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Important Notes</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• SMS messages are never sent between 9pm and 8am</li>
            <li>• If scheduled during night hours, SMS will be delayed until 8am</li>
            <li>• Recommended: 2-4 hours gives customers time to appreciate your work</li>
            <li>• Immediate sending works well for quick services</li>
          </ul>
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
                  Save SMS Timing
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}