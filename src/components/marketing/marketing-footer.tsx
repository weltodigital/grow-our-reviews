'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Star, Mail } from 'lucide-react'
import { getAppUrl } from '@/lib/utils'
import { useConsent } from '@/components/consent/consent-context'

export function MarketingFooter() {
  const { resetConsent } = useConsent()

  return (
    <footer className="bg-gray-900 text-white">
      {/* CTA Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4 text-white !text-white">
              Your competitors are getting reviewed. Are you?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Every job you finish without sending a review request is a missed opportunity to climb Google's local rankings. Start your free trial today and turn your happy customers into the 5-star reviews your business deserves.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a
                href={getAppUrl('/signup')}
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-semibold rounded-full transition-colors"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text)',
                  border: 'none'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent-hover)'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--accent)'
                }}
              >
                Start Your Free Trial
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center justify-center px-8 py-4 text-lg font-medium rounded-full border transition-colors"
                style={{
                  backgroundColor: 'transparent',
                  color: '#d1d5db',
                  borderColor: '#4b5563'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#1f2937'
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                See Pricing
              </a>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              7-day free trial • No credit card required • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center mb-4">
              <Image
                src="/grow-our-reviews-white-logo.png"
                alt="Grow Our Reviews"
                width={720}
                height={144}
                className="h-18 w-auto"
              />
            </Link>
            <p className="text-gray-400 max-w-md leading-relaxed">
              Helping tradespeople get more Google reviews through smart automation.
              Turn happy customers into 5-star reviews while protecting your reputation from negative feedback.
            </p>

            <div className="mt-6 space-y-2">
              <div className="flex items-center space-x-3 text-gray-400">
                <Mail className="h-4 w-4" />
                <a href="mailto:hello@growourreviews.com" className="hover:text-white transition-colors">
                  hello@growourreviews.com
                </a>
              </div>
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="#how-it-works" className="hover:text-white transition-colors">How It Works</Link>
              </li>
              <li>
                <Link href="#features" className="hover:text-white transition-colors">Features</Link>
              </li>
              <li>
                <Link href="#pricing" className="hover:text-white transition-colors">Pricing</Link>
              </li>
              <li>
                <a href={getAppUrl('/signup')} className="hover:text-white transition-colors">Free Trial</a>
              </li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-3 text-gray-400">
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              </li>
              <li>
                <a href="mailto:hello@growourreviews.com" className="hover:text-white transition-colors">Contact</a>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2026 Grow Our Reviews. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <Link href="/privacy" className="text-gray-400 hover:text-white text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link href="/terms" className="text-gray-400 hover:text-white text-sm transition-colors">
                Terms of Service
              </Link>
              <Link href="/cookies" className="text-gray-400 hover:text-white text-sm transition-colors">
                Cookie Policy
              </Link>
              <button
                type="button"
                onClick={resetConsent}
                className="text-gray-400 hover:text-white text-sm transition-colors cursor-pointer"
              >
                Cookie Preferences
              </button>
              <Link href="/sitemap.xml" className="text-gray-400 hover:text-white text-sm transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}