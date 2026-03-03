import { requireUserWithProfile, createServerSupabase } from '@/lib/auth'
import { BillingDashboard } from '@/components/dashboard/billing-dashboard'

async function getBillingStats(userId: string) {
  try {
    const supabase = await createServerSupabase()

    // Get current month bounds
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Get requests sent this month
    const { count: requestsThisMonth } = await (supabase as any)
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .gte('created_at', startOfMonth.toISOString())

    return {
      requestsSentThisMonth: requestsThisMonth || 0,
    }
  } catch (error) {
    console.error('Error fetching billing stats:', error)
    return {
      requestsSentThisMonth: 0,
    }
  }
}

export default async function BillingPage() {
  const { user, profile } = await requireUserWithProfile()
  const billingStats = await getBillingStats(user.id)

  return <BillingDashboard user={user} profile={profile} billingStats={billingStats} />
}