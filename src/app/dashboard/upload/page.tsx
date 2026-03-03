import { requireUserWithProfile, createServerSupabase } from '@/lib/auth'
import { BulkUpload } from '@/components/dashboard/bulk-upload'

async function getUserStats(userId: string) {
  try {
    const supabase = await createServerSupabase()

    // Get current month bounds
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    // Get user profile for request limit
    const { data: profile } = await supabase
      .from('profiles')
      .select('monthly_request_limit')
      .eq('id', userId)
      .single()

    // Get requests sent this month
    const { data: requestsThisMonth } = await supabase
      .from('review_requests')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('sent_at', startOfMonth.toISOString())
      .lte('sent_at', endOfMonth.toISOString())
      .not('sent_at', 'is', null)

    const requestsSent = requestsThisMonth?.length || 0
    const monthlyLimit = (profile as any)?.monthly_request_limit || 50
    const requestsRemaining = Math.max(0, monthlyLimit - requestsSent)

    return {
      requestsSent,
      monthlyLimit,
      requestsRemaining
    }
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {
      requestsSent: 0,
      monthlyLimit: 50,
      requestsRemaining: 50
    }
  }
}

export default async function UploadPage() {
  const { user, profile } = await requireUserWithProfile()
  const userStats = await getUserStats(user.id)

  return (
    <BulkUpload
      user={user}
      profile={profile}
      userStats={userStats}
    />
  )
}