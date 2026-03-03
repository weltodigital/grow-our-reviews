import { requireUserWithProfile, createServerSupabase } from '@/lib/auth'
import { SettingsDashboard } from '@/components/dashboard/settings-dashboard'

async function getSmsTemplates(userId: string) {
  try {
    const supabase = await createServerSupabase()

    const { data: templates, error } = await supabase
      .from('sms_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('type')

    if (error) {
      console.error('Error fetching SMS templates:', error)
      return { initial: null, nudge: null }
    }

    const initialTemplate = templates?.find((t: any) => t.type === 'initial') || null
    const nudgeTemplate = templates?.find((t: any) => t.type === 'nudge') || null

    return { initial: initialTemplate, nudge: nudgeTemplate }
  } catch (error) {
    console.error('Error fetching SMS templates:', error)
    return { initial: null, nudge: null }
  }
}

export default async function SettingsPage() {
  const { user, profile } = await requireUserWithProfile()
  const smsTemplates = await getSmsTemplates(user.id)

  return (
    <SettingsDashboard
      user={user}
      profile={profile}
      smsTemplates={smsTemplates}
    />
  )
}