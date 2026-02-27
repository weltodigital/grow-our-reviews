'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Clock, MessageSquare, Save } from 'lucide-react'
import { updateNudgeSettings } from './settings-actions'

interface NudgeSettingsProps {
  initialSettings: {
    nudge_enabled: boolean
    nudge_delay_hours: number
  }
  onSave: (settings: { nudge_enabled: boolean; nudge_delay_hours: number }) => Promise<void>
}

export function NudgeSettings({ initialSettings, onSave }: NudgeSettingsProps) {
  const [nudgeEnabled, setNudgeEnabled] = useState(initialSettings.nudge_enabled)
  const [nudgeDelayHours, setNudgeDelayHours] = useState(initialSettings.nudge_delay_hours)
  const [isSaving, setIsSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)

  const handleNudgeEnabledChange = (enabled: boolean) => {
    setNudgeEnabled(enabled)
    setHasChanges(
      enabled !== initialSettings.nudge_enabled ||
      nudgeDelayHours !== initialSettings.nudge_delay_hours
    )
  }

  const handleDelayChange = (hours: number) => {
    setNudgeDelayHours(hours)
    setHasChanges(
      nudgeEnabled !== initialSettings.nudge_enabled ||
      hours !== initialSettings.nudge_delay_hours
    )
  }

  const handleSave = async () => {
    setIsSaving(true)
    setError('')
    setSuccess('')

    try {
      await onSave({
        nudge_enabled: nudgeEnabled,
        nudge_delay_hours: nudgeDelayHours,
      })
      setSuccess('Nudge settings updated successfully!')
      setHasChanges(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsSaving(false)
    }
  }

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-blue-600" />
          Follow-up Nudges
        </CardTitle>
        <CardDescription>
          Automatically send a gentle reminder if customers don't respond to your initial review request
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Send follow-up nudges</div>
            <div className="text-sm text-gray-500">
              Send a gentle reminder if no response after the delay period
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleNudgeEnabledChange(false)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                !nudgeEnabled
                  ? 'bg-red-100 text-red-700 border border-red-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Disabled
            </button>
            <button
              onClick={() => handleNudgeEnabledChange(true)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                nudgeEnabled
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Enabled
            </button>
          </div>
        </div>

        {/* Delay Settings */}
        {nudgeEnabled && (
          <div className="space-y-3">
            <div>
              <Label htmlFor="nudgeDelay" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Nudge Delay
              </Label>
              <div className="mt-2 flex items-center gap-3">
                <Input
                  id="nudgeDelay"
                  type="number"
                  min="1"
                  max="168"
                  value={nudgeDelayHours}
                  onChange={(e) => handleDelayChange(parseInt(e.target.value) || 48)}
                  className="w-20"
                />
                <span className="text-sm text-gray-600">hours after initial SMS</span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Recommended: 48 hours. Range: 1-168 hours (1 week max)
              </p>
            </div>

            {/* Preview */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Nudge Message Preview:</h4>
              <p className="text-sm text-blue-700 italic">
                "Hi [Customer], just a gentle reminder — if you have 30 seconds, [Your Business] would love a quick review: [link]. No pressure at all — thanks!"
              </p>
            </div>
          </div>
        )}

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

        {/* Save Button */}
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
                  Save Nudge Settings
                </>
              )}
            </Button>
          </div>
        )}

        {/* Information */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>• Nudges are only sent once per review request</p>
          <p>• No nudges sent if customer already clicked or responded</p>
          <p>• Nudges respect the same time restrictions (no SMS 9pm-8am)</p>
        </div>
      </CardContent>
    </Card>
  )
}