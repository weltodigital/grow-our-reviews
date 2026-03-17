import { requireUserWithProfile, createServerSupabase } from '@/lib/auth'
import { BillingDashboard } from '@/components/dashboard/billing-dashboard'
import { getCurrentBillingPeriod, getDaysUntilReset } from '@/lib/billing-cycle'

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
    let startOfPeriod: Date, daysUntilReset: number, billingCycleDate: number | undefined

    if (profile?.billing_cycle_date) {
      const billingPeriod = getCurrentBillingPeriod(profile.billing_cycle_date)
      startOfPeriod = billingPeriod.start
      daysUntilReset = getDaysUntilReset(profile.billing_cycle_date)
      billingCycleDate = profile.billing_cycle_date
    } else {
      // Fallback to calendar month for users without billing cycle date
      const now = new Date()
      startOfPeriod = new Date(now.getFullYear(), now.getMonth(), 1)
      daysUntilReset = 0
      billingCycleDate = undefined
    }

    // Get requests sent this period
    const { count: requestsThisMonth } = await (supabase as any)
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('sent_at', startOfPeriod.toISOString())
      .not('sent_at', 'is', null)

    return {
      requestsSentThisMonth: requestsThisMonth || 0,
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