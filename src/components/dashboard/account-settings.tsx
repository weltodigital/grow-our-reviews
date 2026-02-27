'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, CreditCard, AlertTriangle, Save } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { updateAccountInfo } from './settings-actions'
import { getPlanByLimit, PRICING_PLANS, formatPrice } from '@/lib/pricing'
import Link from 'next/link'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface AccountSettingsProps {
  user: SupabaseUser
  profile: Database['public']['Tables']['profiles']['Row']
  onSettingsChange: () => void
  onSettingsSaved: () => void
}

export function AccountSettings({
  user,
  profile,
  onSettingsChange,
  onSettingsSaved
}: AccountSettingsProps) {
  const [email, setEmail] = useState(user.email || '')
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const currentPlan = getPlanByLimit(profile.monthly_request_limit)
  const planConfig = PRICING_PLANS[currentPlan]

  const hasChanges = email !== (user.email || '')

  const handleEmailChange = (value: string) => {
    setEmail(value)
    if (!hasChanges) {
      onSettingsChange()
    }
    setError('')
    setSuccess('')
  }

  const handleEmailUpdate = async () => {
    if (!email.trim()) {
      setError('Email address is required')
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address')
      return
    }

    setIsUpdatingEmail(true)
    setError('')

    try {
      const result = await updateAccountInfo({ email: email.trim() })

      if (result.error) {
        setError(result.error)
      } else {
        setSuccess('Email update initiated! Please check your new email for a confirmation link.')
        onSettingsSaved()
        setTimeout(() => setSuccess(''), 5000)
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const getSubscriptionStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>
      case 'trialing':
        return <Badge className="bg-blue-100 text-blue-700">Free Trial</Badge>
      case 'past_due':
        return <Badge className="bg-red-100 text-red-700">Past Due</Badge>
      case 'cancelled':
        return <Badge className="bg-gray-100 text-gray-700">Cancelled</Badge>
      default:
        return <Badge className="bg-gray-100 text-gray-700">{status}</Badge>
    }
  }

  const isTrialing = profile.subscription_status === 'trialing'
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const trialDaysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-blue-600" />
          Account Settings
        </CardTitle>
        <CardDescription>
          Manage your account information and subscription
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Email Settings */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="email">Email Address</Label>
            <div className="mt-2 flex gap-3">
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                placeholder="your@email.com"
                className="flex-1"
              />
              {hasChanges && (
                <Button
                  onClick={handleEmailUpdate}
                  disabled={isUpdatingEmail}
                  size="sm"
                >
                  {isUpdatingEmail ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-1" />
                      Update
                    </>
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Used for login and important account notifications
            </p>
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
        </div>

        {/* Subscription Information */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Subscription Details
          </h4>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">{planConfig.name} Plan</div>
                <div className="text-sm text-gray-600">
                  {formatPrice(planConfig.price)}/month • {profile.monthly_request_limit} requests
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getSubscriptionStatusBadge(profile.subscription_status)}
              </div>
            </div>

            {isTrialing && trialEndsAt && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
                  <AlertTriangle className="h-4 w-4" />
                  Trial Period
                </div>
                <p className="text-blue-700 text-sm mt-1">
                  {trialDaysRemaining > 0
                    ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining`
                    : 'Trial has ended'
                  } • Ends {trialEndsAt.toLocaleDateString('en-GB')}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link href="/dashboard/billing">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Manage Billing
                </Link>
              </Button>
              {currentPlan === 'starter' && (
                <Button asChild>
                  <Link href="/pricing">
                    Upgrade Plan
                  </Link>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Account Information */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-4">Account Information</h4>
          <div className="grid gap-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">User ID:</span>
              <span className="font-mono text-xs">{user.id.substring(0, 16)}...</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Account Created:</span>
              <span>{new Date(profile.created_at).toLocaleDateString('en-GB')}</span>
            </div>
            {profile.stripe_customer_id && (
              <div className="flex justify-between">
                <span className="text-gray-600">Customer ID:</span>
                <span className="font-mono text-xs">{profile.stripe_customer_id.substring(0, 16)}...</span>
              </div>
            )}
          </div>
        </div>

        {/* Support */}
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-900 mb-2">Need Help?</h4>
          <p className="text-sm text-gray-600 mb-3">
            Have questions about your account or need technical support?
          </p>
          <Button variant="outline" size="sm" asChild>
            <a href="mailto:support@growourreviews.com">
              <Mail className="h-4 w-4 mr-2" />
              Contact Support
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}