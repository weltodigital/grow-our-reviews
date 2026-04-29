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
import { getNextBillingDate } from '@/lib/billing-cycle'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface BillingDashboardProps {
  user: User
  profile: Database['public']['Tables']['profiles']['Row']
  billingStats: {
    requestsSentThisMonth: number
    daysUntilReset?: number
    billingCycleDate?: number
  }
}

// Helper function to get ordinal suffix (1st, 2nd, 3rd, etc.)
function getOrdinalSuffix(day: number): string {
  if (day >= 11 && day <= 13) {
    return 'th'
  }
  switch (day % 10) {
    case 1: return 'st'
    case 2: return 'nd'
    case 3: return 'rd'
    default: return 'th'
  }
}

export function BillingDashboard({ user, profile, billingStats }: BillingDashboardProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const currentPlan = getPlanByLimit(profile.monthly_request_limit)
  const planConfig = PRICING_PLANS[currentPlan]

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-700">Active</Badge>
      case 'trialing':
        return <Badge className="border" style={{ backgroundColor: 'var(--accent-light)', color: 'var(--accent-dark)', borderColor: 'var(--accent)' }}>Free Trial</Badge>
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

  const handleUpgrade = async () => {
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch('/api/stripe/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targetPlan: 'growth'
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start upgrade process')
      }

      const data = await response.json()

      if (data.redirect) {
        // Direct subscription update succeeded
        window.location.href = data.redirect
      } else if (data.url) {
        // Checkout session created
        window.location.href = data.url
      }

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isTrialing = profile.subscription_status === 'trialing'

  // Fix trial end date calculation
  // If user has Stripe subscription, use trial_ends_at from Stripe
  // If user is on default trial (no Stripe), calculate from created_at + 14 days
  let trialEndsAt: Date | null = null
  const trialStartsAt = profile.created_at ? new Date(profile.created_at) : null

  if (profile.trial_ends_at) {
    trialEndsAt = new Date(profile.trial_ends_at)
  } else if (trialStartsAt) {
    // Fallback: calculate trial end as created_at + 14 days if no trial_ends_at
    trialEndsAt = new Date(trialStartsAt.getTime() + (14 * 24 * 60 * 60 * 1000))
  }

  // Calculate trial progress based on actual dates
  const now = new Date()

  // Handle timezone properly - ensure we're comparing dates at midnight local time
  const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const trialEndMidnight = trialEndsAt
    ? new Date(trialEndsAt.getFullYear(), trialEndsAt.getMonth(), trialEndsAt.getDate())
    : null

  const trialDaysRemaining = trialEndMidnight
    ? Math.max(0, Math.ceil((trialEndMidnight.getTime() - todayMidnight.getTime()) / (1000 * 60 * 60 * 24)))
    : 0

  // Debug logging for trial dates
  console.log('Billing Dashboard Debug:', {
    trial_ends_at_raw: profile.trial_ends_at,
    has_stripe_subscription: !!profile.stripe_subscription_id,
    trialEndsAt_original: trialEndsAt?.toISOString(),
    trialEndMidnight: trialEndMidnight?.toISOString(),
    todayMidnight: todayMidnight.toISOString(),
    now: now.toISOString(),
    trialDaysRemaining,
    timeDifference_ms: trialEndMidnight ? trialEndMidnight.getTime() - todayMidnight.getTime() : 0,
    subscription_status: profile.subscription_status
  })

  // Calculate total trial length and days used
  const totalTrialDays = (trialStartsAt && trialEndsAt)
    ? Math.ceil((trialEndsAt.getTime() - trialStartsAt.getTime()) / (1000 * 60 * 60 * 24))
    : 14
  const trialDaysUsed = Math.max(0, totalTrialDays - trialDaysRemaining)

  const trialHasEnded = trialEndsAt && trialEndsAt < now

  // Calculate usage this month using real data
  const usage = {
    requestsSent: billingStats.requestsSentThisMonth,
    requestsRemaining: profile.monthly_request_limit - billingStats.requestsSentThisMonth,
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
        <Card className={`border-2 ${trialHasEnded ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className={`rounded-full p-2 ${trialHasEnded ? 'bg-red-100' : 'bg-green-100'}`}>
                {trialHasEnded ? (
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                ) : (
                  <Zap className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold ${trialHasEnded ? 'text-red-900' : 'text-green-900'}`}>
                  {trialHasEnded ? 'Free Trial Ended' : 'Free Trial Active'}
                </h3>
                <div className="space-y-2">
                  <p className={`text-sm ${trialHasEnded ? 'text-red-700' : 'text-green-700'}`}>
                    {trialHasEnded ? (
                      <>Your free trial ended on {trialEndsAt?.toLocaleDateString('en-GB')}. Billing has now started automatically.</>
                    ) : (
                      <>
                        {trialDaysRemaining > 0
                          ? `${trialDaysRemaining} day${trialDaysRemaining !== 1 ? 's' : ''} remaining in your free trial.`
                          : 'Your trial ends today.'
                        } {trialEndsAt && `Trial ends ${trialEndsAt.toLocaleDateString('en-GB')}.`}
                      </>
                    )}
                  </p>

                  {/* Trial Progress Bar */}
                  {!trialHasEnded && trialEndsAt && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-green-600">
                        <span>Trial progress</span>
                        <span>{trialDaysUsed} of {totalTrialDays} days used</span>
                      </div>
                      <div className="w-full bg-green-200 rounded-full h-2">
                        <div
                          className="bg-green-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${Math.min(100, (trialDaysUsed / totalTrialDays) * 100)}%`
                          }}
                        />
                      </div>
                      <div className="text-xs text-green-600">
                        {trialDaysRemaining} day{trialDaysRemaining !== 1 ? 's' : ''} remaining
                      </div>
                    </div>
                  )}
                </div>
                {!trialHasEnded && trialDaysRemaining <= 3 && (
                  <p className="text-green-800 text-sm mt-2 font-medium">
                    Your subscription will automatically start when your trial ends. You can cancel anytime through your billing portal.
                  </p>
                )}
                {trialHasEnded && (
                  <p className="text-green-800 text-sm mt-2 font-medium">
                    Your subscription is now active. Use the "Manage Billing" button below to modify your plan or payment method.
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cancelled Subscription Banner */}
      {profile.subscription_status === 'active' && (profile as any).cancelled_at_period_end && (profile as any).current_period_end && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full p-2 bg-orange-100">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-orange-900">
                  Subscription Cancelled
                </h3>
                <div className="space-y-2">
                  <p className="text-sm text-orange-700">
                    Your subscription has been cancelled, but you have full access until the end of your current billing period on{' '}
                    <strong>{new Date((profile as any).current_period_end).toLocaleDateString('en-GB')}</strong>.
                  </p>
                  <p className="text-sm text-orange-700">
                    You can continue sending review requests and accessing all features until then. Your data will remain safe.
                  </p>
                </div>
                <div className="flex gap-3 mt-3">
                  <Button
                    onClick={handleManageSubscription}
                    disabled={isLoading}
                    size="sm"
                    className="bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    {isLoading ? (
                      <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent mr-2" />
                    ) : (
                      <ExternalLink className="h-3 w-3 mr-2" />
                    )}
                    Reactivate Subscription
                  </Button>
                </div>
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
                {formatPrice(planConfig.price)}/month • Up to {profile.monthly_request_limit} message credits
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
              <span>Message credits used this period</span>
              <span>{usage.requestsSent} of {profile.monthly_request_limit}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-green-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${Math.min(100, (usage.requestsSent / profile.monthly_request_limit) * 100)}%`
                }}
              />
            </div>
            <div className="text-xs text-gray-500 space-y-1">
              <div>{usage.requestsRemaining} message credits remaining</div>
              {billingStats.daysUntilReset && (
                <div>Credits reset in {billingStats.daysUntilReset} day{billingStats.daysUntilReset !== 1 ? 's' : ''}</div>
              )}
            </div>
          </div>

          {/* Credit Reset Information - More Prominent */}
          {profile.billing_cycle_date && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Credit Reset Schedule</span>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <div><strong>Next reset:</strong> {getNextBillingDate(profile.billing_cycle_date).toLocaleDateString('en-GB')}</div>
                <div><strong>Reset day:</strong> {profile.billing_cycle_date}{getOrdinalSuffix(profile.billing_cycle_date)} of each month</div>
                {billingStats.daysUntilReset && (
                  <div><strong>Days remaining:</strong> {billingStats.daysUntilReset} day{billingStats.daysUntilReset !== 1 ? 's' : ''}</div>
                )}
              </div>
            </div>
          )}

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
                {profile.stripe_customer_id ? (
                  <>
                    <p className="font-medium">Customer ID</p>
                    <p className="text-sm text-gray-600 font-mono">
                      {profile.stripe_customer_id.substring(0, 20)}...
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium">Billing Management</p>
                    <p className="text-sm text-gray-600">
                      Manage your subscription and payment methods
                    </p>
                  </>
                )}
              </div>
              <Button
                onClick={handleManageSubscription}
                disabled={isLoading}
                className="flex items-center gap-2 !text-black"
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
              <p>• Cancel your subscription</p>
              <p className="pt-2">
                To downgrade your plan, please email{' '}
                <a href="mailto:hello@growourreviews.com" className="underline" style={{ color: 'var(--accent-dark)' }}>
                  hello@growourreviews.com
                </a>{' '}
                and we&apos;ll switch you over.
              </p>
            </div>
          </CardContent>
        </Card>

      {/* Upgrade Options */}
      {currentPlan === 'starter' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">Need More Message Credits?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 mb-2">
                  Upgrade to Growth plan for {PRICING_PLANS.growth.monthlyRequestLimit} monthly message credits
                </p>
                <p className="text-sm text-green-700">
                  Just {formatPrice(getCostPerRequest('growth'))} per credit vs {formatPrice(getCostPerRequest('starter'))} on Starter
                </p>
              </div>
              <Button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700 text-white !text-black"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                ) : null}
                Upgrade Now
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Growth Plan - Need More Credits */}
      {currentPlan === 'growth' && (
        <Card className="border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-900">Need More Than {PRICING_PLANS.growth.monthlyRequestLimit} Message Credits?</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-800 mb-2">
                  Looking for a custom plan with higher limits? We can help create a solution that fits your business needs.
                </p>
                <p className="text-sm text-green-700">
                  Contact our team to discuss custom pricing and limits for high-volume businesses.
                </p>
              </div>
              <Button
                asChild
                className="!text-black"
              >
                <a href="mailto:support@growourreviews.com?subject=Custom Plan Request&body=Hi, I'm currently on the Growth plan and would like to discuss increasing my monthly message credit limit. Please get in touch to discuss custom options.">
                  Contact Support
                </a>
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
                className="text-green-600 hover:text-green-700"
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