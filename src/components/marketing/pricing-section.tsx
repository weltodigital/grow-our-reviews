'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/pricing'
import { getAppUrl } from '@/lib/utils'

export function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: 49,
      requests: 50,
      features: [
        'Up to 50 review requests per month',
        'SMS review requests',
        'Sentiment gate (review filtering)',
        'Simple dashboard',
        'Email support'
      ],
      recommended: false
    },
    {
      name: 'Growth',
      price: 79,
      requests: 150,
      features: [
        'Up to 150 review requests per month',
        'Everything in Starter',
        'Automatic 48-hour nudge follow-ups',
        'Priority support',
        'Advanced analytics'
      ],
      recommended: true
    }
  ]

  return (
    <section id="pricing" className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Simple, transparent pricing
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Start with a 14-day free trial. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 shadow-sm ring-1 ${
                plan.recommended
                  ? 'bg-blue-50 ring-blue-200 shadow-lg'
                  : 'bg-white ring-gray-200'
              }`}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              <div className="text-center">
                <h3 className="text-2xl font-bold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-4xl font-bold text-gray-900">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-gray-600">/month</span>
                </div>
                <p className="mt-2 text-sm text-gray-600">
                  {plan.requests} requests per month
                </p>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <Button
                  className={`w-full ${
                    plan.recommended
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-gray-900 hover:bg-gray-800'
                  }`}
                  asChild
                >
                  <a href={getAppUrl('/signup')}>Start 14-Day Free Trial</a>
                </Button>
              </div>
            </div>
          ))}
        </div>

        {/* Trial details */}
        <div className="mt-12 text-center">
          <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="font-semibold text-gray-900 mb-2">
              14-Day Free Trial Includes:
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>✓ Full access to all features</p>
              <p>✓ Full access to all features for 14 days</p>
              <p>✓ No setup fees or hidden costs</p>
              <p>✓ Cancel anytime with one click</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              No credit card required to start your trial.
            </p>
          </div>
        </div>

        {/* Money back guarantee */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-500">
            30-day money-back guarantee • No contracts • Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}