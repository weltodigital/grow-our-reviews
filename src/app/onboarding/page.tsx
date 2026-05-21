import { requireAuth } from '@/lib/auth'
import { OnboardingForm } from './onboarding-form'

// Server-side auth guard: an unauthenticated visitor is redirected to /login
// up front instead of filling in the whole form and only hitting a dead-end
// "Not authenticated" error on submit. requireAuth() also benefits from the
// session refresh performed by middleware before this renders.
export default async function OnboardingPage() {
  await requireAuth()
  return <OnboardingForm />
}
