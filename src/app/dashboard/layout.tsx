import { createServerSupabase, requireUserWithProfile } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard/nav'
import { DashboardHeader } from '@/components/dashboard/header'
import { LogoutButton } from '@/components/dashboard/logout-button'
import GoogleReviewUrlBanner from '@/components/dashboard/GoogleReviewUrlBanner'
import TrialCreditsBanner from '@/components/dashboard/TrialCreditsBanner'
import TwoFactorBanner from '@/components/dashboard/TwoFactorBanner'
import { getCurrentBillingPeriod } from '@/lib/billing-cycle'
import { countNudgesSentInPeriod } from '@/lib/credit-usage'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await requireUserWithProfile()

  // For no-card trial users only, compute credits-used so the
  // TrialCreditsBanner knows when to render. Skip the DB work for paid users.
  let trialCreditsUsed = 0
  const isTrialUser =
    (profile as any).subscription_status === 'trialing' &&
    !(profile as any).stripe_customer_id

  if (isTrialUser) {
    const supabase = await createServerSupabase()
    const billingPeriod = (profile as any).billing_cycle_date
      ? getCurrentBillingPeriod((profile as any).billing_cycle_date)
      : (() => {
          const now = new Date()
          return {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59),
          }
        })()

    // Match the send action's accounting: originals are counted by creation
    // time (a credit is reserved as soon as a request is scheduled), nudges
    // by their actual send time.
    const [originals, nudges] = await Promise.all([
      (supabase as any)
        .from('review_requests')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', billingPeriod.start.toISOString())
        .lte('created_at', billingPeriod.end.toISOString()),
      countNudgesSentInPeriod(supabase, user.id, billingPeriod.start, billingPeriod.end),
    ])

    trialCreditsUsed = (originals.count || 0) + nudges
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop sidebar */}
        <DashboardNav className="hidden lg:flex" />

        {/* Main content area */}
        <div className="flex-1 lg:ml-64">
          {/* Desktop header */}
          <div className="hidden lg:block">
            <div className="flex h-16 items-center justify-end bg-white px-6 shadow-sm border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-sm font-medium text-green-600">
                    {(profile as any).business_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {(profile as any).business_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user.email}
                    </span>
                  </div>
                </div>
                <LogoutButton />
              </div>
            </div>
          </div>

          {/* Mobile header */}
          <DashboardHeader user={user} profile={profile} />

          {/* Trial credits exhausted banner — only fires for no-card trial
              users who've hit their cap before the trial ends */}
          <TrialCreditsBanner profile={profile} creditsUsed={trialCreditsUsed} />

          {/* Google Review URL Banner */}
          <GoogleReviewUrlBanner profile={profile} />

          {/* Prompt to enable two-factor authentication (hides once enabled) */}
          <TwoFactorBanner />

          {/* Page content */}
          <main>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}