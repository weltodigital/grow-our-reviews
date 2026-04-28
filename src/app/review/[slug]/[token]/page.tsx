import { ReviewContent } from '@/components/review/review-content'

interface PageProps {
  // The slug is purely cosmetic — the token alone identifies the review request,
  // so we accept whatever string the URL has and ignore it for lookup.
  params: Promise<{ slug: string; token: string }>
}

export default async function ReviewPage({ params }: PageProps) {
  const { token } = await params
  return <ReviewContent token={token} />
}

// Optimize for mobile performance
export const metadata = {
  title: 'Rate Your Experience',
  description: 'How was your experience? Let us know with a quick rating.',
  viewport: 'width=device-width, initial-scale=1',
}
