'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowDown, Star, MessageSquare, Shield } from 'lucide-react'

export function HeroSection() {
  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 sm:py-32">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
            Turn Happy Customers Into{' '}
            <span className="text-blue-600">5-Star Reviews</span> — Automatically
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
            Grow Our Reviews sends your customers a quick review request after every job.
            More Google reviews, better rankings, more work. Set it up in 2 minutes.
          </p>

          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" asChild>
              <Link href="/signup">Start Your Free Trial</Link>
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={scrollToHowItWorks}
              className="gap-2"
            >
              See How It Works <ArrowDown className="h-4 w-4" />
            </Button>
          </div>

          {/* Trust indicators */}
          <div className="mt-12 flex items-center justify-center space-x-8 text-sm text-gray-500">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-500" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5 text-blue-500" />
              <span>No spam, one gentle request</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
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
                      <div className="text-xs text-gray-500 mb-1">SMS from +447700123456</div>
                      <div className="bg-blue-500 text-white text-sm p-3 rounded-2xl rounded-bl-md max-w-[85%] md:max-w-[80%]">
                        Hi Sarah, thanks for choosing Smith Plumbing! If you were happy with our work, we&apos;d really appreciate a quick review — it only takes 30 seconds 👇<br />
                        <br />
                        <span className="text-blue-200 underline">https://review.example.com/abc123</span>
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