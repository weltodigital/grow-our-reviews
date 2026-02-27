import { Shield, RefreshCw, BarChart3, Users } from 'lucide-react'

export function FeaturesSection() {
  const features = [
    {
      icon: Shield,
      title: 'Sentiment Gate',
      description: 'Only happy customers get sent to Google. If someone&apos;s unhappy, they tell you privately instead. Your public rating is protected.',
      benefits: ['Filter out negative reviews', 'Get private feedback instead', 'Maintain high Google rating']
    },
    {
      icon: RefreshCw,
      title: 'Automatic Follow-Up',
      description: 'If they don&apos;t respond, we send one gentle nudge 48 hours later. No spam, just a polite reminder.',
      benefits: ['One gentle reminder only', 'Customizable timing', 'No pushy messages']
    },
    {
      icon: BarChart3,
      title: 'Simple Dashboard',
      description: 'See every request, every click, every review. Know exactly what&apos;s working.',
      benefits: ['Track all activity', 'Monitor success rates', 'Export your data']
    },
    {
      icon: Users,
      title: 'Works for Any Trade',
      description: 'Plumbers, electricians, builders, roofers, landscapers, cleaners — if you do great work, this tool makes sure people say so.',
      benefits: ['Any trade or service', 'Customizable for your business', 'Industry-proven approach']
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
                <div className="text-3xl font-bold">2 minutes</div>
                <div className="text-blue-100">Setup time</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">3x more</div>
                <div className="text-blue-100">Google reviews</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">0 spam</div>
                <div className="text-blue-100">complaints</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}