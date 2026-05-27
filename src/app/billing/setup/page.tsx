'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, CreditCard, Shield, Clock, XCircle } from 'lucide-react'
import { PLAN_DISPLAY_ORDER, PRICING_PLANS, type PlanKey } from '@/lib/pricing'
import { createClient } from '@/lib/supabase'

export default function BillingSetupPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PlanKey>('growth')
  const [userProfile, setUserProfile] = useState<any>(null)
  const [dataStats, setDataStats] = useState<{ customerCount: number; requestCount: number } | null>(
    null,
  )
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const checkAuth = async () => {
      if (!supabase) return

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_status, stripe_customer_id, business_name, created_at, cancellation_reason')
        .eq('id', session.user.id)
        .single()

      if (profile) {
        setUserProfile(profile)

        if (
          ((profile as any).subscription_status === 'active' ||
            (profile as any).subscription_status === 'trialing') &&
          (profile as any).stripe_customer_id
        ) {
          router.push('/dashboard')
          return
        }

        if ((profile as any).subscription_status === 'cancelled') {
          try {
            const [customersResult, requestsResult] = await Promise.all([
              supabase.from('customers').select('id', { count: 'exact' }).eq('user_id', session.user.id),
              supabase
                .from('review_requests')
                .select('id', { count: 'exact' })
                .eq('user_id', session.user.id),
            ])

            setDataStats({
              customerCount: customersResult.count || 0,
              requestCount: requestsResult.count || 0,
            })
          } catch (error) {
            console.error('Error fetching data stats:', error)
          }
        }
      }
    }

    checkAuth()
  }, [router, supabase])

  const handleStartTrial = async (plan: PlanKey) => {
    setIsLoading(true)
    setError('')

    try {
      if (!supabase) {
        throw new Error('Service temporarily unavailable')
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        router.push('/login')
        return
      }

      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planKey: plan,
          successUrl: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/billing/setup`,
          trialDays: userProfile?.subscription_status === 'cancelled' ? 0 : 14,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const isCancelled = userProfile?.subscription_status === 'cancelled'
  const isPaymentFailed = isCancelled && (userProfile as any).cancellation_reason === 'payment_failed'
  const selectedPlanName = PRICING_PLANS[selectedPlan].name

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          {isCancelled ? (
            <>
              {isPaymentFailed ? (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Payment Issue - Let&apos;s Fix This 🔧
                  </h1>
                  <p className="text-gray-600 mb-4">
                    Your payment method was declined, but your data is completely safe. Update your
                    payment method or choose a new plan to restore access.
                  </p>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
                    <div className="flex items-center justify-center gap-2 text-red-700 font-medium mb-2">
                      <XCircle className="h-5 w-5" />
                      Subscription Suspended Due to Payment Failure
                    </div>
                    <div className="text-sm text-red-600 text-center">
                      <p>Your payment was declined multiple times. This commonly happens due to:</p>
                      <div className="grid md:grid-cols-2 gap-2 mt-2">
                        <div>• Expired or cancelled card</div>
                        <div>• Insufficient funds</div>
                        <div>• Bank blocking the transaction</div>
                        <div>• Updated card details</div>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Welcome back, {userProfile.business_name}! 👋
                  </h1>
                  <p className="text-gray-600 mb-4">
                    Your data is safe and ready to go. Reactivate your subscription to continue where
                    you left off.
                  </p>
                </>
              )}

              {dataStats && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                  <div className="flex items-center justify-center gap-2 text-green-700 font-medium mb-2">
                    <CheckCircle className="h-5 w-5" />
                    Your Data is Preserved
                  </div>
                  <div className="grid md:grid-cols-2 gap-4 text-sm text-green-600">
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold text-lg">{dataStats.customerCount}</span>
                      <span>customers saved</span>
                    </div>
                    <div className="flex items-center justify-center gap-2">
                      <span className="font-semibold text-lg">{dataStats.requestCount}</span>
                      <span>review requests &amp; responses</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Complete Your Setup</h1>
              <p className="text-gray-600 mb-4">
                Choose your plan to start your 14-day free trial
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-8">
                <div className="flex items-center justify-center gap-2 text-blue-700 font-medium mb-2">
                  <Shield className="h-5 w-5" />
                  14-Day Free Trial on the plan you choose
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
            </>
          )}
        </div>

        {/* Plan Selection */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {PLAN_DISPLAY_ORDER.map((key) => {
            const plan = PRICING_PLANS[key]
            const isSelected = selectedPlan === key
            const costPerCredit = (plan.price / plan.monthlyRequestLimit).toFixed(2)
            const description =
              key === 'lite'
                ? 'For low-volume businesses'
                : key === 'starter'
                  ? 'For growing local businesses'
                  : key === 'growth'
                    ? 'Most popular for busy businesses'
                    : 'For agencies and multi-site operators'
            return (
              <Card
                key={key}
                className={`relative cursor-pointer transition-all ${
                  isSelected ? 'ring-2 border-2' : 'hover:border-gray-300'
                }`}
                style={isSelected ? { borderColor: 'var(--accent)' } : {}}
                onClick={() => setSelectedPlan(key)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">{plan.name}</CardTitle>
                      <CardDescription>{description}</CardDescription>
                    </div>
                    {plan.popular && <Badge variant="secondary">Most Popular</Badge>}
                  </div>
                  <div className="mt-4">
                    <span className="text-3xl font-bold">£{plan.price}</span>
                    <span className="text-gray-500">/month</span>
                    <p className="text-xs text-gray-500 mt-1">£{costPerCredit} per credit</p>
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )
          })}
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
                {isCancelled ? 'Reactivating...' : 'Setting up your trial...'}
              </>
            ) : isCancelled ? (
              isPaymentFailed ? (
                `Fix Payment & Restore ${selectedPlanName}`
              ) : (
                `Reactivate ${selectedPlanName} Plan`
              )
            ) : (
              `Start ${selectedPlanName} Trial`
            )}
          </Button>

          {isCancelled ? (
            isPaymentFailed ? (
              <p className="text-sm text-gray-500 mt-4">
                This will update your payment method and restore your subscription immediately.
                <br />
                Your access will return instantly once payment succeeds.
              </p>
            ) : (
              <p className="text-sm text-gray-500 mt-4">
                Your subscription will reactivate immediately and billing will begin.
                <br />
                All your data and settings will be restored instantly.
              </p>
            )
          ) : (
            <p className="text-sm text-gray-500 mt-4">
              Your 14-day free trial starts now. You&apos;ll only be charged after the trial ends.
              <br />
              Cancel anytime through your billing dashboard.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
