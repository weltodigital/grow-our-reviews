'use client'

import { CheckCircle, X } from 'lucide-react'

export function PricingComparison() {
  const features = [
    {
      category: 'Core Features',
      items: [
        { feature: 'SMS review requests', starter: true, growth: true },
        { feature: 'Sentiment gate (review filtering)', starter: true, growth: true },
        { feature: 'Simple dashboard', starter: true, growth: true },
        { feature: 'Customer feedback forms', starter: true, growth: true },
        { feature: 'Mobile-responsive design', starter: true, growth: true }
      ]
    },
    {
      category: 'Automation',
      items: [
        { feature: 'Automatic SMS timing', starter: true, growth: true },
        { feature: 'Follow-up nudge messages', starter: false, growth: true },
        { feature: 'Custom SMS delay settings', starter: 'Basic', growth: 'Advanced' },
        { feature: 'Bulk request management', starter: false, growth: true }
      ]
    },
    {
      category: 'Analytics & Reporting',
      items: [
        { feature: 'Basic analytics (clicks, reviews)', starter: true, growth: true },
        { feature: 'Advanced insights & trends', starter: false, growth: true },
        { feature: 'Export data (CSV)', starter: true, growth: true },
        { feature: 'Monthly performance reports', starter: false, growth: true }
      ]
    },
    {
      category: 'Support & Limits',
      items: [
        { feature: 'Monthly request limit', starter: '20 requests', growth: '100 requests' },
        { feature: 'Email support', starter: 'Standard', growth: 'Priority' },
        { feature: 'Setup assistance', starter: 'Self-service', growth: 'Guided setup' },
        { feature: 'Phone support', starter: false, growth: 'Coming soon' }
      ]
    }
  ]

  const renderFeatureValue = (value: boolean | string) => {
    if (value === true) {
      return <CheckCircle className="h-5 w-5 text-green-500" />
    }
    if (value === false) {
      return <X className="h-5 w-5 text-gray-300" />
    }
    return <span className="text-sm text-gray-600">{value}</span>
  }

  return (
    <section className="py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Compare Plans
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            See exactly what&apos;s included in each plan
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="overflow-hidden bg-white shadow-sm ring-1 ring-gray-200 rounded-lg">
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4">
              <div className="grid grid-cols-3 gap-6">
                <div className="font-medium text-gray-900">Features</div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Starter</div>
                  <div className="text-sm text-gray-600">£49/month</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold text-gray-900">Growth</div>
                  <div className="text-sm text-gray-600">£129/month</div>
                  <div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 mt-1">
                    Popular
                  </div>
                </div>
              </div>
            </div>

            {/* Feature categories */}
            {features.map((category, categoryIndex) => (
              <div key={categoryIndex}>
                <div className="bg-gray-25 px-6 py-3 border-t border-gray-200">
                  <h3 className="font-medium text-gray-900">{category.category}</h3>
                </div>

                {category.items.map((item, itemIndex) => (
                  <div
                    key={itemIndex}
                    className="grid grid-cols-3 gap-6 px-6 py-4 border-t border-gray-100"
                  >
                    <div className="text-gray-700">{item.feature}</div>
                    <div className="text-center">
                      {renderFeatureValue(item.starter)}
                    </div>
                    <div className="text-center">
                      {renderFeatureValue(item.growth)}
                    </div>
                  </div>
                ))}
              </div>
            ))}

            {/* CTA row */}
            <div className="bg-gray-50 px-6 py-6 border-t border-gray-200">
              <div className="grid grid-cols-3 gap-6">
                <div></div>
                <div className="text-center">
                  <button
                    onClick={() => {
                      const checkoutUrl = '/api/stripe/create-checkout'
                      fetch(checkoutUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ planKey: 'starter' })
                      }).then(res => res.json()).then(data => {
                        if (data.url) window.location.href = data.url
                      })
                    }}
                    className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 transition-colors"
                  >
                    Start Trial
                  </button>
                </div>
                <div className="text-center">
                  <button
                    onClick={() => {
                      const checkoutUrl = '/api/stripe/create-checkout'
                      fetch(checkoutUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ planKey: 'growth' })
                      }).then(res => res.json()).then(data => {
                        if (data.url) window.location.href = data.url
                      })
                    }}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Start Trial
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Additional info */}
          <div className="mt-8 text-center">
            <div className="bg-blue-50 rounded-lg p-6">
              <h4 className="font-semibold text-blue-900 mb-2">
                All plans include:
              </h4>
              <div className="text-sm text-blue-700 grid grid-cols-1 md:grid-cols-2 gap-2">
                <div>✓ 7-day free trial</div>
                <div>✓ No setup fees</div>
                <div>✓ Cancel anytime</div>
                <div>✓ 30-day money-back guarantee</div>
                <div>✓ SMS costs included</div>
                <div>✓ GDPR compliant</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}