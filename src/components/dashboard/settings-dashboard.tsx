'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save, Settings } from 'lucide-react'
import Link from 'next/link'
import { BusinessInfoSettings } from './business-info-settings'
import { SmsTimingSettings } from './sms-timing-settings'
import { NudgeSettings } from './nudge-settings'
import { AccountSettings } from './account-settings'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface SettingsDashboardProps {
  user: User
  profile: Database['public']['Tables']['profiles']['Row']
}

export function SettingsDashboard({ user, profile }: SettingsDashboardProps) {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const handleSettingsChange = () => {
    setHasUnsavedChanges(true)
  }

  const handleSettingsSaved = () => {
    setHasUnsavedChanges(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">
            Manage your business information and review request preferences
          </p>
        </div>
      </div>

      {/* Unsaved Changes Banner */}
      {hasUnsavedChanges && (
        <Card className="border-orange-200 bg-orange-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-orange-800">
                <Save className="h-4 w-4" />
                <span className="font-medium">You have unsaved changes</span>
              </div>
              <div className="text-sm text-orange-700">
                Make sure to save your changes before leaving this page
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {/* Business Information */}
        <BusinessInfoSettings
          profile={profile}
          onSettingsChange={handleSettingsChange}
          onSettingsSaved={handleSettingsSaved}
        />

        {/* SMS Timing Settings */}
        <SmsTimingSettings
          profile={profile}
          onSettingsChange={handleSettingsChange}
          onSettingsSaved={handleSettingsSaved}
        />

        {/* Nudge Settings */}
        <NudgeSettings
          initialSettings={{
            nudge_enabled: profile.nudge_enabled,
            nudge_delay_hours: profile.nudge_delay_hours,
          }}
          onSave={async (settings) => {
            // This will be handled by the NudgeSettings component
            return Promise.resolve()
          }}
        />

        {/* Account Settings */}
        <AccountSettings
          user={user}
          profile={profile}
          onSettingsChange={handleSettingsChange}
          onSettingsSaved={handleSettingsSaved}
        />

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-blue-600" />
              Need Help?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <strong>Finding your Google Reviews URL:</strong>
              <ol className="list-decimal list-inside mt-1 text-gray-600 space-y-1">
                <li>Search for your business on Google</li>
                <li>Click "Write a review" on your business listing</li>
                <li>Copy the URL from your browser's address bar</li>
                <li>Paste it in the "Google Review URL" field above</li>
              </ol>
            </div>
            <div>
              <strong>SMS Timing Tips:</strong>
              <ul className="list-disc list-inside mt-1 text-gray-600 space-y-1">
                <li>2-4 hours after job completion works well for most trades</li>
                <li>Consider your customers' schedules (avoid dinner time)</li>
                <li>SMS won't be sent between 9pm-8am regardless of settings</li>
              </ul>
            </div>
            <div>
              <strong>Questions?</strong> Contact us at{' '}
              <a
                href="mailto:support@growourreviews.com"
                className="text-blue-600 hover:text-blue-700"
              >
                support@growourreviews.com
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}