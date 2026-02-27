import { CheckCircle, MessageSquare, Star } from 'lucide-react'

export function HowItWorksSection() {
  const steps = [
    {
      icon: CheckCircle,
      title: 'Finish a job, enter the details',
      description: "Takes 10 seconds. Just type your customer's name and phone number.",
      detail: ''
    },
    {
      icon: MessageSquare,
      title: 'We send a friendly review request',
      description: 'A polite SMS goes out automatically at the right time. No awkward asking, no forgetting.',
      detail: ''
    },
    {
      icon: Star,
      title: 'Your Google ranking climbs',
      description: 'Happy customers leave 5-star reviews on Google. Unhappy ones give you private feedback instead — so your public rating stays strong and your local search ranking improves.',
      detail: ''
    }
  ]

  return (
    <section id="how-it-works" className="py-24 sm:py-32 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            How It Works
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Simple, automated, and effective. No technical knowledge required.
          </p>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {steps.map((step, index) => {
              const Icon = step.icon
              return (
                <div key={index} className="relative">
                  {/* Connection line */}
                  {index < steps.length - 1 && (
                    <div className="hidden md:block absolute top-12 left-[calc(100%+1rem)] w-8 h-px bg-gradient-to-r from-blue-200 to-blue-300 z-0" />
                  )}

                  <div className="relative text-center">
                    <div className="flex justify-center">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 text-white">
                        <Icon className="h-8 w-8" />
                      </div>
                    </div>

                    <div className="mt-6">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {index + 1}. {step.title}
                      </h3>
                      <p className="mt-2 text-base text-gray-600">
                        {step.description}
                      </p>
                      {step.detail && (
                        <p className="mt-1 text-sm text-gray-500">
                          {step.detail}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Demo flow */}
        <div className="mt-20">
          <div className="bg-gray-50 rounded-2xl p-8">
            <h3 className="text-center text-xl font-semibold text-gray-900 mb-8">
              See it in action
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Customer journey */}
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border-l-4 border-green-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Happy customer (4-5 stars):</strong> Gets redirected to Google Reviews
                  </p>
                </div>

                <div className="bg-white rounded-lg p-4 border-l-4 border-orange-500">
                  <div className="flex items-center space-x-2 mb-2">
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                    <Star className="h-5 w-5 text-gray-300" />
                    <Star className="h-5 w-5 text-gray-300" />
                    <Star className="h-5 w-5 text-gray-300" />
                  </div>
                  <p className="text-sm text-gray-600">
                    <strong>Unhappy customer (1-3 stars):</strong> Private feedback form instead
                  </p>
                </div>
              </div>

              {/* Benefits */}
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    Only happy customers reach Google Reviews
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    Get private feedback to improve your service
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    Protect your online reputation automatically
                  </p>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-gray-600">
                    One gentle nudge if they don't respond (optional)
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}