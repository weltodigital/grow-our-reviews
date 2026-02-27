import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Star, Shield, Zap, CheckCircle } from 'lucide-react'

export function PricingCta() {
  return (
    <section className="py-24 bg-gradient-to-r from-blue-600 to-indigo-700">
      <div className="container mx-auto px-4">
        <div className="text-center text-white">
          <h2 className="text-3xl font-bold sm:text-4xl mb-6">
            Ready to get more 5-star reviews?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of tradespeople who are already growing their business with automated review requests.
          </p>

          {/* Trust indicators */}
          <div className="flex flex-wrap justify-center gap-6 mb-8 text-blue-100">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              <span>7-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              <span>30-day money-back guarantee</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              <span>Cancel anytime</span>
            </div>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button size="lg" asChild className="bg-white text-blue-600 hover:bg-gray-100">
              <Link href="/signup">
                <Star className="h-5 w-5 mr-2 fill-current" />
                Start Your Free Trial
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-blue-300 text-white hover:bg-blue-700">
              <Link href="/">
                Learn More
              </Link>
            </Button>
          </div>

          <p className="text-sm text-blue-200">
            No setup fees • SMS costs included • GDPR compliant
          </p>
        </div>
      </div>
    </section>
  )
}