'use client'

import Link from 'next/link'
import { CheckCircle } from 'lucide-react'
import { formatPrice } from '@/lib/pricing'
import { getAppUrl } from '@/lib/utils'

export function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: 49,
      requests: 150,
      features: [
        'Up to 150 message credits per month',
        'SMS review requests',
        'Automatic follow-up nudges (enable/disable)',
        'Sentiment gate (review filtering)',
        'Simple dashboard',
        'Email support'
      ],
      recommended: false
    },
    {
      name: 'Growth',
      price: 79,
      requests: 300,
      features: [
        'Up to 300 message credits per month',
        'Everything in Starter',
        'Priority support'
      ],
      recommended: true
    }
  ]

  return (
    <section id="pricing" className="section" style={{ backgroundColor: 'var(--bg-secondary)' }}>
      <div className="container mx-auto px-4">
        <div className="section-header">
          <h2>Simple, transparent pricing</h2>
          <p className="page-subtitle mx-auto">
            Start with a 14-day free trial. Credit card required, cancel anytime.
          </p>
        </div>

        <div className="mt-16 grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-12 max-w-4xl mx-auto">
          {plans.map((plan, index) => (
            <div
              key={index}
              className={`relative rounded-2xl p-8 shadow-sm ring-1 ${
                plan.recommended
                  ? 'shadow-lg'
                  : 'bg-white ring-gray-200'
              }`}
              style={plan.recommended ? {
                backgroundColor: 'var(--accent-light)',
                borderColor: 'var(--accent)'
              } : {}}
            >
              {plan.recommended && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="px-4 py-1 rounded-full text-sm font-medium" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
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
                <div className="mt-2 text-center">
                  <p className="text-sm text-gray-600">
                    {plan.requests} message credits per month
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatPrice(plan.price / plan.requests)} per credit
                  </p>
                </div>
              </div>

              <ul className="mt-8 space-y-4">
                {plan.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-start">
                    <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent)' }} />
                    <span className="ml-3 text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>

              <div className="mt-8">
                <a
                  href={getAppUrl('/signup')}
                  className="inline-flex items-center justify-center w-full px-6 py-3 text-base font-semibold rounded-lg transition-colors"
                  style={plan.recommended ? {
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                    border: 'none'
                  } : {
                    backgroundColor: 'var(--text-primary)',
                    color: 'var(--bg-primary)',
                    border: 'none'
                  }}
                  onMouseOver={(e) => {
                    if (plan.recommended) {
                      e.currentTarget.style.backgroundColor = 'var(--accent-hover)'
                    } else {
                      e.currentTarget.style.backgroundColor = 'var(--text-secondary)'
                    }
                  }}
                  onMouseOut={(e) => {
                    if (plan.recommended) {
                      e.currentTarget.style.backgroundColor = 'var(--accent)'
                    } else {
                      e.currentTarget.style.backgroundColor = 'var(--text-primary)'
                    }
                  }}
                >
                  Start 14-Day Free Trial
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Message credits explanation */}
        <div className="mt-12 text-center">
          <div className="rounded-lg p-6 max-w-2xl mx-auto" style={{ backgroundColor: 'var(--accent-light)' }}>
            <h4 className="font-semibold mb-2" style={{ color: 'var(--accent-dark)' }}>
              What are message credits?
            </h4>
            <div className="text-sm space-y-1" style={{ color: 'var(--accent-dark)' }}>
              <p>• <strong>Each SMS message = 1 credit</strong> (initial request + optional nudge)</p>
              <p>• If you send a nudge reminder, that's an additional credit</p>
              <p>• Maximum 2 credits per customer (initial + nudge)</p>
            </div>
          </div>
        </div>

        {/* Trial details */}
        <div className="mt-8 text-center">
          <div className="bg-gray-50 rounded-lg p-6 max-w-2xl mx-auto">
            <h4 className="font-semibold text-gray-900 mb-2">
              14-Day Free Trial Includes:
            </h4>
            <div className="text-sm text-gray-600 space-y-1">
              <p>✓ Full access to all features for 14 days</p>
              <p>✓ No setup fees or hidden costs</p>
              <p>✓ Cancel anytime with one click</p>
            </div>
            <p className="text-xs text-gray-500 mt-3">
              Credit card required. You'll only be charged after your 14-day trial ends.
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