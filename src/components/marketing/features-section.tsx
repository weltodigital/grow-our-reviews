import { Shield, RefreshCw, BarChart3, Users } from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: 'Sentiment Gate — Protect Your Star Rating',
      description: "Your Google rating directly affects your ranking. Our smart filter asks customers to rate their experience first. 4-5 stars? They go straight to Google. 1-3 stars? They see a private feedback form instead. Your public rating stays high, your ranking stays strong, and you still get useful feedback to improve.",
      benefits: ['Negative feedback stays private', 'Your Google rating is protected', 'Improve your service with honest feedback']
    },
    {
      icon: RefreshCw,
      title: 'Auto Reviews Coming In',
      description: "Google rewards businesses that get reviews consistently — not just in bursts. If a customer doesn't respond to the first request, we send one gentle nudge. That's it. No spam, no hassle. Just a steady drip of fresh reviews that tells Google your business is active and trusted.",
      benefits: ['One polite reminder, nothing more', 'Customisable timing', 'Keeps your review flow consistent']
    },
    {
      icon: BarChart3,
      title: 'Simple Dashboard — Know What\'s Working',
      description: "See how many review requests you've sent, how many customers clicked, and how many left a review. Track your progress week by week and watch your Google presence grow.",
      benefits: ['Real-time tracking', 'Click and conversion rates', 'See all customer feedback in one place']
    },
    {
      icon: Users,
      title: 'Built for Tradespeople — Not Tech Companies',
      description: "No apps to install, no complicated setup, no jargon. If you can send a text message, you can use Grow Our Reviews. Enter a name and number after each job and we handle the rest. Works for plumbers, electricians, builders, roofers, landscapers, cleaners — any trade.",
      benefits: ['10-second setup per job', 'Works on your phone between jobs', 'No technical knowledge needed']
    }
  ]

  return (
    <section id="features" className="py-24 sm:py-32 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Everything you need to grow your reviews
          </h2>
          <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
            Powerful features designed specifically for tradespeople who want more Google reviews without the hassle.
          </p>
        </div>

        <div className="mt-20 grid grid-cols-1 gap-8 lg:grid-cols-2">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div key={index} className="bg-white rounded-xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {feature.title}
                    </h3>
                    <p className="mt-2 text-gray-600">
                      {feature.description}
                    </p>
                    <ul className="mt-4 space-y-2">
                      {feature.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center text-sm text-gray-500">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-600 mr-2"></div>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Additional benefits */}
        <div className="mt-16 bg-blue-600 rounded-2xl p-8 text-white">
          <div className="text-center">
            <h3 className="text-2xl font-bold">
              Why tradespeople choose Grow Our Reviews
            </h3>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold">Quick setup</div>
                <div className="text-blue-100">per job</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">Higher rankings</div>
                <div className="text-blue-100">on Google</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">No spam</div>
                <div className="text-blue-100">complaints</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}