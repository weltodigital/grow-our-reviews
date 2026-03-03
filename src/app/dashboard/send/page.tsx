import { requireUserWithProfile } from '@/lib/auth'
import SendRequestForm from '@/components/dashboard/SendRequestForm'
import MissingGoogleReviewUrl from '@/components/dashboard/MissingGoogleReviewUrl'

export default async function SendRequestPage() {
  const { user, profile } = await requireUserWithProfile()

  // Check if Google Review URL is set
  if (!(profile as any)?.google_review_url) {
    return <MissingGoogleReviewUrl />
  }

  return <SendRequestForm />
}