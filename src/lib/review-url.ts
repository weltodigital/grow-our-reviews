import { slugify } from './slugify'

/**
 * Build the customer-facing review URL.
 *
 * Includes a slugified business name as a path segment so the URL gives
 * customers a clear signal about who's asking, e.g.:
 *
 *   https://app.growourreviews.com/review/welto-digital/abc123...
 *
 * Falls back to the plain `/review/{token}` form if the business name is
 * missing or slugifies to an empty string. Both URL shapes resolve via the
 * /review routes so old links keep working.
 */
export function buildReviewUrl(token: string, businessName?: string | null): string {
  const base = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  if (businessName) {
    const slug = slugify(businessName)
    if (slug) return `${base}/review/${slug}/${token}`
  }

  return `${base}/review/${token}`
}
