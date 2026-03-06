import { requireUserWithProfile, createServerSupabase } from '@/lib/auth'
import SendRequestForm from '@/components/dashboard/SendRequestForm'
import MissingGoogleReviewUrl from '@/components/dashboard/MissingGoogleReviewUrl'

async function getSmsTemplate(userId: string) {
  try {
    const supabase = await createServerSupabase()

    const { data: template, error } = await (supabase as any)
      .from('sms_templates')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'initial')
      .eq('is_active', true)
      .single()

    if (error) {
      console.error('Error fetching SMS template:', error)
      return null
    }

    return template
  } catch (error) {
    console.error('Error fetching SMS template:', error)
    return null
  }
}

export default async function SendRequestPage() {
  const { user, profile } = await requireUserWithProfile()

  // Check if Google Review URL is set
  if (!(profile as any)?.google_review_url) {
    return <MissingGoogleReviewUrl />
  }

  const smsTemplate = await getSmsTemplate(user.id)

  return (
    <SendRequestForm
      profile={profile}
      smsTemplate={smsTemplate}
    />
  )
}