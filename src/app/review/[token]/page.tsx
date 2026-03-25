import { createServerSupabase } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { SentimentGate } from '@/components/review/sentiment-gate'
import type { Database } from '@/types/database'

interface PageProps {
  params: Promise<{ token: string }>
}

async function getReviewRequest(token: string) {
  // Use service role key to bypass RLS for public review pages
  const { createServerClient } = await import('@supabase/ssr')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

  // First get the review request
  const { data: reviewRequest, error: reviewError } = await (supabase as any)
    .from('review_requests')
    .select('*')
    .eq('token', token)
    .single()

  if (reviewError || !reviewRequest) {
    console.error('Review request not found:', {
      token,
      error: reviewError,
      timestamp: new Date().toISOString()
    })
    return null
  }

  // Check if token has expired (90 days from creation)
  const createdAt = new Date(reviewRequest.created_at)
  const now = new Date()
  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

  if (daysSinceCreation > 90) {
    console.log(`Review request ${token} has expired (${daysSinceCreation} days old) - blocking access`)
    return { expired: true }
  }

  // Only block failed or expired requests
  if (['failed', 'expired'].includes(reviewRequest.status)) {
    console.log(`Review request ${token} has status: ${reviewRequest.status} - blocking access`)
    return null
  }

  // Log status for monitoring
  console.log(`Review request ${token} has status: ${reviewRequest.status} - allowing access`)

  // Get the CURRENT profile and customer data (not cached from request creation)
  // This ensures business name and Google URL are up-to-date
  const [profileResult, customerResult] = await Promise.all([
    (supabase as any)
      .from('profiles')
      .select('business_name, google_review_url')
      .eq('id', reviewRequest.user_id)
      .single(),
    (supabase as any)
      .from('customers')
      .select('name')
      .eq('id', reviewRequest.customer_id)
      .single()
  ])

  if (profileResult.error) {
    console.error('Profile not found for review request:', {
      token,
      userId: reviewRequest.user_id,
      error: profileResult.error,
      timestamp: new Date().toISOString()
    })
    return null
  }

  if (customerResult.error) {
    console.error('Customer not found for review request:', {
      token,
      customerId: reviewRequest.customer_id,
      error: customerResult.error,
      timestamp: new Date().toISOString()
    })
    return null
  }

  return {
    ...reviewRequest,
    profiles: profileResult.data,
    customers: customerResult.data
  }
}

async function trackClick(token: string) {
  // Use service role key to update review request status
  const { createServerClient } = await import('@supabase/ssr')
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

  // Only update if this is the first click
  await (supabase as any)
    .from('review_requests')
    .update({
      status: 'clicked',
      clicked_at: new Date().toISOString(),
    })
    .eq('token', token)
    .eq('status', 'sent') // Only update if status is still 'sent'
}

export default async function ReviewPage({ params }: PageProps) {
  const { token } = await params

  const reviewRequest = await getReviewRequest(token)

  if (!reviewRequest) {
    notFound()
  }

  // Handle expired tokens with helpful messaging
  if ('expired' in reviewRequest && reviewRequest.expired) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md mx-auto text-center bg-white rounded-lg shadow-sm border p-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-orange-100 p-3">
              <svg className="h-8 w-8 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 18.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Review Link Has Expired
          </h2>
          <p className="text-gray-600 mb-6">
            This review link is more than 90 days old and has expired for security reasons. The business information may have changed since this link was created.
          </p>
          <p className="text-sm text-gray-500">
            Please contact the business directly if you'd still like to leave feedback about your experience.
          </p>
        </div>
      </div>
    )
  }

  // Track the click (first time only)
  await trackClick(token)

  return (
    <div className="min-h-screen bg-gray-50">
      <SentimentGate
        token={token}
        businessName={reviewRequest.profiles.business_name}
        customerName={reviewRequest.customers.name}
        googleReviewUrl={reviewRequest.profiles.google_review_url}
      />
    </div>
  )
}

// Optimize for mobile performance
export const metadata = {
  title: 'Rate Your Experience',
  description: 'How was your experience? Let us know with a quick rating.',
  viewport: 'width=device-width, initial-scale=1',
}