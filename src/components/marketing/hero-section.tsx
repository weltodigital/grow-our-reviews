'use client'

import Link from 'next/link'
import { ArrowDown, Star, MessageSquare, Shield } from 'lucide-react'
import { getAppUrl } from '@/lib/utils'

export function HeroSection() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative bg-gradient-to-br from-green-50 to-lime-100 py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="hero-h1">
            Get Found on Google.{' '}
            <span style={{ color: 'var(--accent)' }}>Win More Local Work.</span>
          </h1>
          <p className="hero-subtitle mt-6 mx-auto">
            Google reviews are the #1 factor in local search rankings. When someone searches 'plumber near me', businesses with more recent 5-star reviews show up first. Grow Our Reviews automates the whole process — so your phone rings more.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <a
              href={getAppUrl('/signup')}
              className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full transition-colors"
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
            <button
              onClick={scrollToHowItWorks}
              className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full border-2 gap-2 transition-colors"
              style={{
                backgroundColor: 'transparent',
                color: 'var(--text-primary)',
                borderColor: 'var(--border-light)'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
                e.currentTarget.style.borderColor = 'var(--text-tertiary)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
                e.currentTarget.style.borderColor = 'var(--border-light)'
              }}
            >
              See How It Works <ArrowDown className="h-4 w-4" />
            </button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center justify-center space-x-8 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" style={{ color: 'var(--accent)' }} />
              <span>No spam, one polite request</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 fill-current" style={{ color: 'var(--accent)' }} />
              <span>Protects your public rating</span>
            </div>
          </div>

          {/* Mock phone preview */}
          <div className="mt-16">
            <div className="mx-auto max-w-sm">
              <div className="rounded-3xl bg-gray-900 p-2 shadow-2xl">
                <div className="rounded-2xl bg-white p-4">
                  <div className="space-y-4">
                    <div className="text-left">
                      <div className="text-xs" style={{ color: 'var(--text-tertiary)' }}>SMS from Grow Our Reviews</div>
                      <div className="text-sm p-3 rounded-2xl rounded-bl-md max-w-[90%] break-words" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
                        Hi Sarah, thanks for choosing Smith Plumbing!<br />
                        <br />
                        We'd love your feedback 👇<br />
                        <br />
                        <span className="underline break-all" style={{ color: 'var(--accent-dark)' }}>https://app.growourreviews.com/review/a1b2c3d4e5f</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}