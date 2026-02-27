'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function PricingFaq() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'How does the 7-day free trial work?',
      answer: 'Start using all features immediately with full access to your chosen plan. Your card is required to start the trial but won\'t be charged for 7 days. You can cancel anytime during the trial period with no charges. If you continue past the trial, billing begins automatically.'
    },
    {
      question: 'What happens if I exceed my monthly request limit?',
      answer: 'You can still access your dashboard and view all historical data, but you won\'t be able to send new review requests until either: (1) your next monthly billing cycle starts, or (2) you upgrade to a higher plan. We\'ll notify you when you\'re approaching your limit.'
    },
    {
      question: 'Are SMS costs included in the price?',
      answer: 'Yes, all SMS costs are included in your monthly plan price. This covers both the initial review request and the optional follow-up nudge message. You don\'t need to worry about per-message charges or unexpected bills.'
    },
    {
      question: 'Can I change or cancel my plan anytime?',
      answer: 'Absolutely. You can upgrade, downgrade, or cancel your subscription anytime through your billing dashboard. Plan changes take effect at your next billing cycle. Cancellations are immediate and you won\'t be charged again.'
    },
    {
      question: 'Do you offer refunds?',
      answer: 'Yes, we offer a 30-day money-back guarantee. If you\'re not satisfied for any reason within your first 30 days, contact us and we\'ll provide a full refund. No questions asked, no hoops to jump through.'
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept all major credit and debit cards (Visa, Mastercard, American Express) through our secure Stripe payment system. We don\'t accept PayPal or bank transfers at this time.'
    },
    {
      question: 'Is there a setup fee or long-term contract?',
      answer: 'No setup fees, no contracts, no hidden costs. You pay monthly and can cancel anytime. The only cost is your monthly subscription fee, which includes everything: SMS messages, hosting, support, and all features.'
    },
    {
      question: 'What\'s the difference between Starter and Growth?',
      answer: 'The main differences are the request limit (20 vs 100 per month), automatic follow-up nudges (Growth only), advanced analytics (Growth only), and priority support (Growth only). Growth is best for established businesses sending more than 20 requests per month.'
    },
    {
      question: 'Can I get a discount for annual payment?',
      answer: 'Currently we only offer monthly billing, but we\'re considering annual discounts based on customer feedback. If you\'re interested in annual billing, please contact us and we\'ll let you know when it becomes available.'
    },
    {
      question: 'What if I need more than 100 requests per month?',
      answer: 'For businesses needing more than 100 requests monthly, please contact us to discuss enterprise pricing. We can create custom plans with higher limits and additional features tailored to your business needs.'
    }
  ]

  return (
    <section className="py-24 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Pricing Questions
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know about our pricing and billing
          </p>
        </div>

        <div className="max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden"
              >
                <button
                  className="w-full px-6 py-5 text-left flex items-center justify-between hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-medium text-gray-900 pr-4">{faq.question}</span>
                  <div className="flex-shrink-0">
                    {openIndex === index ? (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {openIndex === index && (
                  <div className="px-6 pb-5">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still have questions */}
        <div className="mt-16 text-center">
          <div className="bg-white rounded-xl p-8 max-w-md mx-auto shadow-sm">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our team is here to help with any pricing or billing questions.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="mailto:billing@growourreviews.com"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors text-sm font-medium"
              >
                Email us
              </a>
              <a
                href="/contact"
                className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                Contact support
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}