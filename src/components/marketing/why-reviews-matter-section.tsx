import { Star, TrendingUp, Clock } from 'lucide-react'

export function WhyReviewsMatterSection() {
  const factors = [
    {
      icon: Star,
      title: 'How many reviews you have',
      description: 'More reviews signal a trusted, established business. A competitor with 80 reviews will almost always outrank one with 8 — even if both do identical work.'
    },
    {
      icon: Clock,
      title: 'How recent your reviews are',
      description: 'Google favours businesses with a steady stream of fresh reviews. A burst of reviews from two years ago counts for far less than new ones coming in every week.'
    },
    {
      icon: TrendingUp,
      title: 'Your average star rating',
      description: 'Higher ratings mean Google is more likely to show you to new customers. Our sentiment gate protects your rating by routing unhappy customers to private feedback instead of Google.'
    }
  ]

  return (
    <section className="py-24 sm:py-32 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Why Google Reviews Are the Most Important Thing for Your Business Right Now
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div className="space-y-8">
            <div className="space-y-4">
              <p className="text-lg text-gray-600">
                When someone searches 'plumber near me', Google decides who shows up.
              </p>
              <p className="text-lg text-gray-600">
                The top 3 results in Google's local Map Pack get over 75% of all clicks. And the biggest factor Google uses to rank those results? Reviews.
              </p>
              <p className="text-lg text-gray-600 font-medium">
                Specifically, Google looks at three things:
              </p>
            </div>

            <div className="space-y-6">
              {factors.map((factor, index) => {
                const Icon = factor.icon
                return (
                  <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                          <Icon className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-2">
                          {factor.title}
                        </h3>
                        <p className="text-gray-600 text-sm leading-relaxed">
                          {factor.description}
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <p className="text-gray-700 leading-relaxed">
                This is why 'doing great work' isn't enough. You need your happy customers to actually say so — on Google, regularly. That's exactly what Grow Our Reviews automates for you.
              </p>
            </div>
          </div>

          {/* Visual */}
          <div className="lg:pl-8">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="text-sm text-gray-500 mb-4">Google Search Results</div>

              {/* Mock Google Map Pack */}
              <div className="space-y-3">
                <div className="border-l-4 border-green-500 pl-4 py-3 bg-green-50">
                  <div className="font-semibold text-gray-900">Elite Plumbing Services</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">87 reviews</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">0.3 miles • Open now</div>
                </div>

                <div className="border-l-4 border-gray-300 pl-4 py-3 bg-gray-50">
                  <div className="font-semibold text-gray-900">Quick Fix Plumbing</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ))}
                      <Star className="h-4 w-4 text-gray-300" />
                    </div>
                    <span className="text-sm text-gray-600">23 reviews</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">0.4 miles • Open now</div>
                </div>

                <div className="border-l-4 border-gray-300 pl-4 py-3 bg-gray-50">
                  <div className="font-semibold text-gray-900">Reliable Plumbers Ltd</div>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className="flex">
                      {[...Array(4)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                      ))}
                      <Star className="h-4 w-4 text-gray-300" />
                    </div>
                    <span className="text-sm text-gray-600">6 reviews</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">0.2 miles • Open now</div>
                </div>
              </div>

              <div className="mt-4 flex items-center">
                <div className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                  ← This is where you want to be
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}