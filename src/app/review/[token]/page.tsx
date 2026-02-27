import { createServerSupabase } from '@/lib/auth'
import { notFound } from 'next/navigation'
import { SentimentGate } from '@/components/review/sentiment-gate'
import type { Database } from '@/types/database'

interface PageProps {
  params: Promise<{ token: string }>
}

async function getReviewRequest(token: string) {
  const supabase = await createServerSupabase()

  const { data: reviewRequest, error } = await (supabase as any)
    .from('review_requests')
    .select(`
      *,
      profiles!inner(business_name, google_review_url),
      customers!inner(name)
    `)
    .eq('token', token)
    .single()

  if (error || !reviewRequest) {
    return null
  }

  return reviewRequest
}

async function trackClick(token: string) {
  const supabase = await createServerSupabase()

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