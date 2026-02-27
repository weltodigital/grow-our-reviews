import { requireUserWithProfile } from '@/lib/auth'
import { SettingsDashboard } from '@/components/dashboard/settings-dashboard'

export default async function SettingsPage() {
  const { user, profile } = await requireUserWithProfile()

  return <SettingsDashboard user={user} profile={profile} />
}