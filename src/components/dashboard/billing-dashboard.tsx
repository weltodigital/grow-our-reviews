'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowLeft,
  CreditCard,
  Calendar,
  AlertTriangle,
  CheckCircle,
  ExternalLink,
  Zap
} from 'lucide-react'
import Link from 'next/link'
import { PRICING_PLANS, formatPrice, getPlanByLimit } from '@/lib/pricing'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface BillingDashboardProps {
  user: User
  profile: Database['public']['Tables']['profiles']['Row']
}

export function BillingDashboard({ user, profile }: BillingDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const currentPlan = getPlanByLimit(profile.monthly_request_limit)
  const planConfig = PRICING_PLANS[currentPlan]

  const getStatusBadge = (status: string) => {
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

  const handleManageSubscription = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to open billing portal')
      }

      const { url } = await response.json()
      window.location.href = url

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isTrialing = profile.subscription_status === 'trialing'
  const trialEndsAt = profile.trial_ends_at ? new Date(profile.trial_ends_at) : null
  const trialDaysRemaining = trialEndsAt
    ? Math.max(0, Math.ceil((trialEndsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Calculate usage this month
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)
  // This would normally be fetched from the API
  const mockUsage = {
    requestsSent: 8,
    requestsRemaining: profile.monthly_request_limit - 8,
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
          <h1 className="text-2xl font-bold text-gray-900">Billing & Subscription</h1>
          <p className="text-gray-600">
            Manage your subscription and billing information
          </p>
        </div>
      </div>

      {/* Trial Banner */}
      {isTrialing && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-blue-100 p-2">
                <Zap className="h-5 w-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-blue-900">
                  Free Trial Active
                </h3>
                <p className="text-blue-700 text-sm mt-1">
                  {trialDaysRemaining > 0
                    ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining in your free trial.`
                    : 'Your trial has ended.'
                  } {trialEndsAt && `Trial ends ${trialEndsAt.toLocaleDateString('en-GB')}.`}
                </p>
                {trialDaysRemaining <= 3 && (
                  <p className="text-blue-800 text-sm mt-2 font-medium">
                    Your subscription will start automatically when the trial ends.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current Plan */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Current Plan</span>
            {getStatusBadge(profile.subscription_status)}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{planConfig.name}</h3>
              <p className="text-gray-600">
                {formatPrice(planConfig.price)}/month • Up to {profile.monthly_request_limit} requests
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">
                {formatPrice(planConfig.price)}
              </div>
              <div className="text-sm text-gray-500">per month</div>
            </div>
          </div>

          {/* Usage Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Requests this month</span>
              <span>{mockUsage.requestsSent} of {profile.monthly_request_limit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (mockUsage.requestsSent / profile.monthly_request_limit) * 100)}%`
                }}
              />
            </div>
            <div className="text-xs text-gray-500">
              {mockUsage.requestsRemaining} requests remaining
            </div>
          </div>

          {/* Plan Features */}
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Plan Features</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              {planConfig.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  {feature}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Billing Information */}
      {profile.stripe_customer_id && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Billing Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {profile.subscription_status === 'past_due' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-red-900">Payment Failed</h4>
                    <p className="text-red-700 text-sm mt-1">
                      Your last payment failed. Please update your payment method to continue using the service.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Customer ID</p>
                <p className="text-sm text-gray-600 font-mono">
                  {profile.stripe_customer_id.substring(0, 20)}...
                </p>
              </div>
              <Button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
                Manage Billing
              </Button>
            </div>

            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded p-2">
                {error}
              </div>
            )}

            <div className="text-xs text-gray-500 space-y-1">
              <p>• Update payment methods and billing address</p>
              <p>• Download invoices and billing history</p>
              <p>• Change or cancel your subscription</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Upgrade Options */}
      {currentPlan === 'starter' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">Need More Requests?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 mb-2">
                  Upgrade to Growth plan for {PRICING_PLANS.growth.monthlyRequestLimit} monthly requests
                </p>
                <p className="text-sm text-green-700">
                  Just {formatPrice(getCostPerRequest('growth'))} per request vs {formatPrice(getCostPerRequest('starter'))} on Starter
                </p>
              </div>
              <Button asChild className="bg-green-600 hover:bg-green-700">
                <Link href="/pricing">
                  Upgrade Now
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Support */}
      <Card>
        <CardHeader>
          <CardTitle>Need Help?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <p>
              <strong>Questions about your subscription?</strong> Use the "Manage Billing"
              button above to access your Stripe customer portal.
            </p>
            <p>
              <strong>Technical support:</strong> Contact us at{' '}
              <a
                href="mailto:support@growourreviews.com"
                className="text-blue-600 hover:text-blue-700"
              >
                support@growourreviews.com
              </a>
            </p>
            <p>
              <strong>Billing questions:</strong> All billing is handled securely by Stripe.
              You can manage everything through the customer portal.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )

  function getCostPerRequest(plan: 'starter' | 'growth'): number {
    return PRICING_PLANS[plan].price / PRICING_PLANS[plan].monthlyRequestLimit
  }
}