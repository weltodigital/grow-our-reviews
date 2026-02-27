'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle, Star, Zap, ArrowRight } from 'lucide-react'
import { formatPrice } from '@/lib/pricing'

export function PricingPlans() {
  const [isLoading, setIsLoading] = useState<string | null>(null)

  const plans = [
    {
      id: 'starter',
      name: 'Starter',
      price: 49,
      requests: 20,
      description: 'Perfect for small trades getting started with review automation',
      popular: false,
      features: [
        'Up to 20 review requests per month',
        'SMS review requests with smart timing',
        'Sentiment gate (review filtering)',
        'Simple dashboard with analytics',
        'Email support',
        'Mobile-responsive design',
        'Export your data anytime'
      ]
    },
    {
      id: 'growth',
      name: 'Growth',
      price: 129,
      requests: 100,
      description: 'Best for established businesses ready to scale their reviews',
      popular: true,
      features: [
        'Up to 100 review requests per month',
        'Everything in Starter plan',
        'Automatic 48-hour nudge follow-ups',
        'Priority email support',
        'Advanced analytics and insights',
        'Custom SMS timing settings',
        'Private feedback management'
      ]
    }
  ]

  const handlePlanSelect = async (planId: string) => {
    setIsLoading(planId)

    try {
      const response = await fetch('/api/stripe/create-checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planKey: planId }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error: any) {
      console.error('Error:', error)
      alert(error.message || 'Something went wrong. Please try again.')
    } finally {
      setIsLoading(null)
    }
  }

  return (
    <section className="py-24 sm:py-32 bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-xl leading-8 text-gray-600 max-w-2xl mx-auto">
            Choose the plan that fits your business. Start with a 7-day free trial, no strings attached.
          </p>

          {/* Trial badge */}
          <div className="mt-8 inline-flex items-center gap-2 bg-green-100 text-green-700 px-6 py-3 rounded-full font-medium">
            <Zap className="h-5 w-5" />
            7-day free trial • Card required • Cancel anytime
          </div>
        </div>

        {/* Pricing cards */}
        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 max-w-5xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl p-8 shadow-lg ring-1 ${
                plan.popular
                  ? 'bg-white ring-blue-200 shadow-2xl scale-105'
                  : 'bg-white ring-gray-200'
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2">
                    <Star className="h-4 w-4 fill-white" />
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <p className="mt-2 text-gray-600">{plan.description}</p>

                <div className="mt-6">
                  <span className="text-5xl font-bold text-gray-900">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-xl text-gray-600">/month</span>
                </div>

                <div className="mt-2 text-sm text-gray-500">
                  {formatPrice(Math.round(plan.price / plan.requests * 100) / 100)} per request
                </div>

                <div className="mt-1 text-lg font-medium text-gray-900">
                  {plan.requests} requests/month
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  size="lg"
                  className={`w-full ${
                    plan.popular
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  onClick={() => handlePlanSelect(plan.id)}
                  disabled={isLoading !== null}
                >
                  {isLoading === plan.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2" />
                  ) : (
                    <ArrowRight className="h-5 w-5 mr-2" />
                  )}
                  Start 7-Day Free Trial
                </Button>

                <p className="mt-3 text-xs text-center text-gray-500">
                  Free for 7 days, then {formatPrice(plan.price)}/month. Cancel anytime.
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Money back guarantee */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl p-8 max-w-2xl mx-auto shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              30-Day Money-Back Guarantee
            </h3>
            <p className="text-gray-600">
              Not satisfied? Get a full refund within 30 days. No questions asked, no hoops to jump through.
            </p>
          </div>
        </div>

        {/* Alternative CTA */}
        <div className="mt-8 text-center">
          <p className="text-gray-600">
            Not ready to commit?{' '}
            <Link href="/" className="text-blue-600 hover:text-blue-700 font-medium">
              Learn more about how it works
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}