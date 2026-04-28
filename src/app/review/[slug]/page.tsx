import { ReviewContent } from '@/components/review/review-content'

interface PageProps {
  // Legacy single-segment URL: /review/<token>. The path is named [slug] only
  // to match the parameter name used by /review/[slug]/[token] — Next.js
  // requires the same dynamic-segment name at the same depth across routes.
  params: Promise<{ slug: string }>
}

export default async function ReviewPage({ params }: PageProps) {
  const { slug } = await params
  return <ReviewContent token={slug} />
}

// Optimize for mobile performance
export const metadata = {
  title: 'Rate Your Experience',
  description: 'How was your experience? Let us know with a quick rating.',
  viewport: 'width=device-width, initial-scale=1',
}
