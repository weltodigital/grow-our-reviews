import Link from 'next/link'
import { Star, Quote, ArrowRight } from 'lucide-react'

export function TestimonialSection() {
  return (
    <section className="section" style={{ backgroundColor: 'var(--accent-light)' }}>
      <div className="container mx-auto px-4">
        <div className="section-header">
          <h2>Real results from real businesses</h2>
          <p className="page-subtitle mx-auto">
            Here&apos;s what happened when an established business finally started
            asking their customers for reviews.
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl p-8 shadow-sm">
            <div className="flex items-center mb-4">
              <Quote className="h-8 w-8 mr-3" style={{ color: 'var(--accent)' }} />
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                ))}
              </div>
            </div>

            <blockquote className="text-lg text-gray-700 mb-6 italic leading-relaxed">
              &quot;We had 23 Google reviews after decades in business. Since using
              Grow Our Reviews we&apos;ve climbed to 55, and every new one has been
              5 stars. The bulk upload made it effortless. I just uploaded our
              customer list and the reviews started coming in.&quot;
            </blockquote>

            <div className="border-t pt-4">
              <div className="font-semibold text-gray-900">Max</div>
              <div className="text-sm text-gray-600">Cannon Steels</div>
              <div className="text-sm text-gray-500">London</div>

              <div className="mt-4 flex flex-wrap gap-3">
                <div className="bg-green-50 rounded-lg px-4 py-2">
                  <div className="text-xs font-medium text-green-800">Reviews</div>
                  <div className="text-sm font-semibold text-green-700">
                    23 → 55
                  </div>
                </div>
                <div className="bg-green-50 rounded-lg px-4 py-2">
                  <div className="text-xs font-medium text-green-800">Google rating</div>
                  <div className="text-sm font-semibold text-green-700">4.7 → 4.9 ★</div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link
              href="/blog/cannon-steels-case-study"
              className="inline-flex items-center text-sm font-medium hover:underline"
              style={{ color: 'var(--accent-dark)' }}
            >
              Read the full Cannon Steels case study
              <ArrowRight className="ml-1 h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
