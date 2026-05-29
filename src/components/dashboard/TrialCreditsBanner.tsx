import { Sparkles } from 'lucide-react'

interface TrialCreditsBannerProps {
  profile: any
  creditsUsed: number
}

// Shown to no-card trial users who've burned through their trial credits.
// Separate from GoogleReviewUrlBanner because the urgency and tone are
// different — this is a "you've experienced the product, now subscribe"
// nudge, not a setup task.
export default function TrialCreditsBanner({ profile, creditsUsed }: TrialCreditsBannerProps) {
  const isTrialUser =
    profile?.subscription_status === 'trialing' && !profile?.stripe_customer_id

  if (!isTrialUser) {
    return null
  }

  const limit = profile.monthly_request_limit ?? 0
  if (creditsUsed < limit) {
    return null
  }

  return (
    <div className="bg-amber-50 border-b border-amber-200">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Sparkles className="h-6 w-6 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-amber-900">
              You've used all {limit} of your free trial credits
            </h3>
            <p className="mt-1 text-sm text-amber-800">
              Pick a plan to keep sending. You'll be charged today and your monthly cycle
              starts immediately — cancel anytime from the billing dashboard.
            </p>
            <div className="mt-3">
              <a
                href="/billing/setup"
                className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-md bg-amber-600 text-white hover:bg-amber-700 transition-colors"
              >
                Pick your plan →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
