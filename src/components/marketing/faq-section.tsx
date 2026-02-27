'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      question: 'How does it work?',
      answer: 'After you complete a job, you enter your customer\'s name and phone number into our simple dashboard. We automatically send them a friendly SMS with a link to rate their experience. If they give 4-5 stars, they go to Google Reviews. If they give 1-3 stars, they see a private feedback form instead.'
    },
    {
      question: 'Will customers find it annoying?',
      answer: 'Not at all. We send one request and one optional gentle nudge 48 hours later. That\'s it. No spam, no pushy messages. The SMS is polite and takes customers less than 30 seconds to complete. Most customers actually appreciate the chance to help a local business.'
    },
    {
      question: 'What if a customer is unhappy?',
      answer: 'This is where our system really shines. Unhappy customers (1-3 star ratings) get a private feedback form instead of being sent to Google. You see the feedback in your dashboard, can address their concerns directly, and it never goes public. This protects your online reputation while helping you improve.'
    },
    {
      question: 'Do I need any technical knowledge?',
      answer: 'None whatsoever. If you can send a text message, you can use Grow Our Reviews. Setup takes 2 minutes - just enter your business name and Google Reviews URL. Everything else is automated.'
    },
    {
      question: 'Can I cancel anytime?',
      answer: 'Yes, absolutely. No contracts, no cancellation fees. You can cancel anytime from your dashboard with one click. If you cancel within your first 30 days, you\'ll get a full refund.'
    },
    {
      question: 'How long until I see results?',
      answer: 'Most businesses see their first new Google review within 24-48 hours of sending their first request. However, we recommend sending requests consistently for 2-3 weeks to see the full impact on your online presence.'
    },
    {
      question: 'What if someone gives me a bad review anyway?',
      answer: 'While our system catches most unhappy customers before they reach Google, some may still leave negative reviews through other channels. However, by increasing your volume of genuine 5-star reviews, any occasional negative review will have much less impact on your overall rating.'
    },
    {
      question: 'Is this allowed by Google?',
      answer: 'Yes, completely. Google allows businesses to ask customers for reviews as long as you don\'t offer incentives or try to manipulate the process. Our system simply makes it easier for happy customers to find your review page - which is exactly what Google wants.'
    }
  ]

  return (
    <section id="faq" className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Frequently asked questions
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Everything you need to know about Grow Our Reviews
          </p>
        </div>

        <div className="mt-16 max-w-3xl mx-auto">
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="bg-white border border-gray-200 rounded-lg shadow-sm"
              >
                <button
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                  onClick={() => setOpenIndex(openIndex === index ? null : index)}
                >
                  <span className="font-medium text-gray-900">{faq.question}</span>
                  {openIndex === index ? (
                    <ChevronUp className="h-5 w-5 text-gray-500" />
                  ) : (
                    <ChevronDown className="h-5 w-5 text-gray-500" />
                  )}
                </button>

                {openIndex === index && (
                  <div className="px-6 pb-4">
                    <p className="text-gray-600 leading-relaxed">{faq.answer}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Still have questions? */}
        <div className="mt-16 text-center">
          <div className="bg-gray-50 rounded-xl p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Our team is here to help. Get in touch and we'll answer any questions you have.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href="mailto:hello@growourreviews.com"
                className="inline-flex items-center justify-center px-6 py-3 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Email us
              </a>
              <a
                href="tel:+447700123456"
                className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Call us
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}