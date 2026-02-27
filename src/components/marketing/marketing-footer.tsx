import Link from 'next/link'
import { Star, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getAppUrl } from '@/lib/utils'

export function MarketingFooter() {
  return (
    <footer className="bg-gray-900 text-white">
      {/* CTA Section */}
      <div className="border-b border-gray-800">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to grow your reviews?
            </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Join hundreds of tradespeople who are already getting more Google reviews and growing their business.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild className="bg-blue-600 hover:bg-blue-700">
                <a href={getAppUrl('/signup')}>Start Your Free Trial</a>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-gray-600 text-gray-300 hover:bg-gray-800">
                <a href={getAppUrl('/login')}>Sign In</a>
              </Button>
            </div>
            <p className="text-sm text-gray-400 mt-4">
              7-day free trial • No setup fees • Cancel anytime
            </p>
          </div>
        </div>
      </div>

      {/* Footer Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center space-x-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
                <Star className="h-5 w-5 text-white fill-white" />
              </div>
              <span className="text-xl font-bold">Grow Our Reviews</span>
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
              <div className="flex items-center space-x-3 text-gray-400">
                <Phone className="h-4 w-4" />
                <a href="tel:+447700123456" className="hover:text-white transition-colors">
                  +44 7700 123456
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
                <Link href="/about" className="hover:text-white transition-colors">About</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">Contact</Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-white transition-colors">Support</Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">Blog</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <p className="text-gray-400 text-sm">
              © 2024 Grow Our Reviews. All rights reserved.
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
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}