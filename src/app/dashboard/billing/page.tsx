import { requireUserWithProfile, createServerSupabase } from '@/lib/auth'
import { BillingDashboard } from '@/components/dashboard/billing-dashboard'
import { getCurrentBillingPeriod, getDaysUntilReset } from '@/lib/billing-cycle'
import { countCreditsSentInPeriod } from '@/lib/credit-usage'

async function getBillingStats(userId: string) {
  try {
    const supabase = await createServerSupabase()

    // Get user profile for billing cycle date
    const { data: profile } = await supabase
      .from('profiles')
      .select('billing_cycle_date')
      .eq('id', userId)
      .single() as { data: { billing_cycle_date?: number } | null }

    // Get billing period bounds based on user's billing cycle
    // If user doesn't have billing_cycle_date, fall back to calendar month
    let startOfPeriod: Date, endOfPeriod: Date, daysUntilReset: number, billingCycleDate: number | undefined

    if (profile?.billing_cycle_date) {
      const billingPeriod = getCurrentBillingPeriod(profile.billing_cycle_date)
      startOfPeriod = billingPeriod.start
      endOfPeriod = billingPeriod.end
      daysUntilReset = getDaysUntilReset(profile.billing_cycle_date)
      billingCycleDate = profile.billing_cycle_date
    } else {
      // Fallback to calendar month for users without billing cycle date
      const now = new Date()
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
      endOfPeriod = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      daysUntilReset = 0
      billingCycleDate = undefined
    }

    const creditsUsed = await countCreditsSentInPeriod(supabase, userId, startOfPeriod, endOfPeriod)

    return {
      requestsSentThisMonth: creditsUsed, // credits = originals + nudges
      daysUntilReset: daysUntilReset,
      billingCycleDate: billingCycleDate,
    }
  } catch (error) {
    console.error('Error fetching billing stats:', error)
    return {
      requestsSentThisMonth: 0,
      daysUntilReset: 0,
      billingCycleDate: undefined,
    }
  }
}

export default async function BillingPage() {
  const { user, profile } = await requireUserWithProfile()
  const billingStats = await getBillingStats(user.id)

  return <BillingDashboard user={user} profile={profile} billingStats={billingStats} />
}