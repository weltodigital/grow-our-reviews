import { requireUserWithProfile } from '@/lib/auth'
import { BillingDashboard } from '@/components/dashboard/billing-dashboard'

export default async function BillingPage() {
  const { user, profile } = await requireUserWithProfile()

  return <BillingDashboard user={user} profile={profile} />
}