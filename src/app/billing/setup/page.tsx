'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, CreditCard, Shield, Clock } from 'lucide-react'
import { PRICING_PLANS } from '@/lib/pricing'
import { createClient } from '@/lib/supabase'

export default function BillingSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<'starter' | 'growth'>('starter')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      if (!supabase) return

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Check if user already has a subscription
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, stripe_customer_id')
        .eq('id', session.user.id)
        .single()

      // Only redirect if they have BOTH a subscription status AND a stripe customer ID
      // This prevents redirecting users who have default 'trialing' status but no actual billing setup
      if (profile && ((profile as any).subscription_status === 'active' || (profile as any).subscription_status === 'trialing') && (profile as any).stripe_customer_id) {
        router.push('/onboarding')
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleStartTrial = async (plan: 'starter' | 'growth') => {
    setIsLoading(true)
    setError('')

    try {
      if (!supabase) {
        throw new Error('Service temporarily unavailable')
      }

      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      // Get the price ID for the selected plan
      const planConfig = PRICING_PLANS[plan]

      // Create Stripe checkout session
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          priceId: plan === 'starter' ? process.env.NEXT_PUBLIC_STRIPE_STARTER_PRICE_ID : process.env.NEXT_PUBLIC_STRIPE_GROWTH_PRICE_ID,
          successUrl: `${window.location.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/billing/setup`,
          trialDays: 14,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = url

    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const planFeatures = {
    starter: [
      'Up to 150 message credits per month',
      'SMS review requests',
      'Automatic follow-up nudges (enable/disable)',
      'Sentiment-based routing',
      'Analytics dashboard',
      'Email support',
    ],
    growth: [
      'Up to 300 message credits per month',
      'Everything in Starter',
      'Priority support',
    ],
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Complete Your Setup
          </h1>
          <p className="text-gray-600 mb-4">
            Choose your plan to start your 14-day free trial
          </p>

          {/* Trial Benefits */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
            <div className="flex items-center justify-center gap-2 text-blue-700 font-medium mb-2">
              <Shield className="h-5 w-5" />
              14-Day Free Trial
            </div>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-blue-600">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Full access for 14 days</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span>No charges during trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>

        {/* Plan Selection */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {/* Starter Plan */}
          <Card
            className={`relative cursor-pointer transition-all ${
              selectedPlan === 'starter'
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'hover:border-gray-300'
            }`}
            onClick={() => setSelectedPlan('starter')}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Starter</CardTitle>
                  <CardDescription>Perfect for small businesses</CardDescription>
                </div>
                <Badge variant="secondary">Most Popular</Badge>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">£{PRICING_PLANS.starter.price}</span>
                <span className="text-gray-500">/month</span>
                <p className="text-xs text-gray-500 mt-1">
                  £{(PRICING_PLANS.starter.price / PRICING_PLANS.starter.monthlyRequestLimit).toFixed(2)} per credit
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {planFeatures.starter.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Growth Plan */}
          <Card
            className={`relative cursor-pointer transition-all ${
              selectedPlan === 'growth'
                ? 'ring-2 ring-blue-500 border-blue-500'
                : 'hover:border-gray-300'
            }`}
            onClick={() => setSelectedPlan('growth')}
          >
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-xl">Growth</CardTitle>
                  <CardDescription>For growing businesses</CardDescription>
                </div>
                <Badge className="bg-purple-100 text-purple-700">Best Value</Badge>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold">£{PRICING_PLANS.growth.price}</span>
                <span className="text-gray-500">/month</span>
                <p className="text-xs text-gray-500 mt-1">
                  £{(PRICING_PLANS.growth.price / PRICING_PLANS.growth.monthlyRequestLimit).toFixed(2)} per credit
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {planFeatures.growth.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-red-700 text-sm">{error}</div>
          </div>
        )}

        {/* Start Trial Button */}
        <div className="text-center">
          <Button
            onClick={() => handleStartTrial(selectedPlan)}
            disabled={isLoading}
            size="lg"
            className="px-8 py-3 text-lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                Setting up your trial...
              </>
            ) : (
              `Start ${selectedPlan === 'starter' ? 'Starter' : 'Growth'} Trial`
            )}
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            Your 14-day free trial starts now. You'll only be charged after the trial ends.
            <br />
            Cancel anytime through your billing dashboard.
          </p>
        </div>
      </div>
    </div>
  )
}