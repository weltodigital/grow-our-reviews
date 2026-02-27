import { Star, Quote } from 'lucide-react'

export function SocialProofSection() {
  const testimonials = [
    {
      name: 'Mike Thompson',
      business: 'Thompson Plumbing',
      location: 'Manchester',
      rating: 5,
      text: 'Since using Grow Our Reviews, we&apos;ve gone from 12 Google reviews to 67 in three months. The sentiment gate is brilliant — no more angry customers leaving 1-star reviews when they&apos;re just having a bad day.',
      beforeReviews: 12,
      afterReviews: 67,
      timeframe: '3 months'
    },
    {
      name: 'Sarah Williams',
      business: 'Elite Electrical',
      location: 'Birmingham',
      rating: 5,
      text: 'Game changer for our business. The private feedback feature helped us improve our service, and now we&apos;re getting more 5-star reviews than ever. Setup took literally 2 minutes.',
      beforeReviews: 8,
      afterReviews: 45,
      timeframe: '4 months'
    },
    {
      name: 'Dave Roberts',
      business: 'Roberts Roofing',
      location: 'Leeds',
      rating: 5,
      text: 'I was skeptical at first, but this actually works. Customers don&apos;t find it annoying at all — it&apos;s just one polite text. We&apos;re booked solid now thanks to our improved online reputation.',
      beforeReviews: 5,
      afterReviews: 38,
      timeframe: '5 months'
    }
  ]

  const stats = [
    { label: 'Tradespeople trust us', value: '500+', description: 'across the UK' },
    { label: 'Reviews generated', value: '15,000+', description: 'and counting' },
    { label: 'Average rating increase', value: '4.2 → 4.8', description: 'stars' },
    { label: 'Customer satisfaction', value: '98%', description: 'would recommend' }
  ]

  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="container mx-auto px-4">
        {/* Stats */}
        <div className="text-center mb-20">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl mb-12">
            Trusted by tradespeople across the UK
          </h2>

          <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stat.value}</div>
                <div className="text-gray-900 font-medium mt-1">{stat.label}</div>
                <div className="text-sm text-gray-500">{stat.description}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="bg-white rounded-xl p-6 shadow-sm">
              <div className="flex items-center mb-4">
                <Quote className="h-8 w-8 text-blue-600 mr-3" />
                <div className="flex">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  ))}
                </div>
              </div>

              <blockquote className="text-gray-600 mb-4 italic">
                "{testimonial.text}"
              </blockquote>

              <div className="border-t pt-4">
                <div className="font-semibold text-gray-900">{testimonial.name}</div>
                <div className="text-sm text-gray-600">{testimonial.business}</div>
                <div className="text-sm text-gray-500">{testimonial.location}</div>

                <div className="mt-3 bg-green-50 rounded-lg p-3">
                  <div className="text-xs font-medium text-green-800 mb-1">Results:</div>
                  <div className="text-sm text-green-700">
                    {testimonial.beforeReviews} → {testimonial.afterReviews} reviews
                    <span className="text-green-600"> in {testimonial.timeframe}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="mt-16 text-center">
          <div className="inline-flex items-center space-x-8 bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-green-500 rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-900">GDPR Compliant</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-blue-500 rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-900">UK Hosted</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 bg-purple-100 rounded-full flex items-center justify-center">
                <div className="h-4 w-4 bg-purple-500 rounded-full"></div>
              </div>
              <span className="text-sm font-medium text-gray-900">SSL Secured</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}