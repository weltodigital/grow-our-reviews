/**
 * Google Places API (New) integration for pulling a user's Google Business reviews.
 *
 * We cache results in `google_reviews_cache` and only hit the paid Places API
 * when the cached row is older than REFRESH_INTERVAL_MS (every other day).
 */

const REFRESH_INTERVAL_MS = 48 * 60 * 60 * 1000 // every 2 days

export interface GoogleReviewAuthor {
  displayName: string
  photoUri?: string
  uri?: string
}

export interface GoogleReview {
  reviewId: string
  rating: number
  text: string
  relativePublishTimeDescription: string
  publishTime: string
  author: GoogleReviewAuthor
}

export interface CachedReviews {
  placeId: string
  totalReviewCount: number | null
  averageRating: number | null
  reviews: GoogleReview[]
  lastFetchedAt: string
  lastError: string | null
}

/**
 * Pull the Place ID out of a Google review URL. We generate URLs in
 * `...writereview?placeid=ChIJxxx` format on our business-search flow, but
 * users can also paste URLs themselves.
 */
export function extractPlaceId(googleReviewUrl: string | null): string | null {
  if (!googleReviewUrl) return null

  try {
    const url = new URL(googleReviewUrl)
    const placeId = url.searchParams.get('placeid') || url.searchParams.get('place_id')
    if (placeId) return placeId

    // CID-based URLs (e.g. g.page/r/CxxxxxxxxxxxxxxEAE) can't be resolved to a
    // Place ID without an extra round-trip. We surface a null here and let the
    // caller prompt the user to reconnect with a searchable URL.
    return null
  } catch {
    return null
  }
}

/**
 * Shape of the Places API (New) review object we consume.
 */
interface PlacesApiReview {
  name?: string
  rating?: number
  text?: { text?: string; languageCode?: string }
  originalText?: { text?: string }
  relativePublishTimeDescription?: string
  publishTime?: string
  authorAttribution?: {
    displayName?: string
    uri?: string
    photoUri?: string
  }
}

function sortByPublishTimeDesc(reviews: GoogleReview[]): GoogleReview[] {
  return [...reviews].sort((a, b) => {
    const ta = a.publishTime ? Date.parse(a.publishTime) : 0
    const tb = b.publishTime ? Date.parse(b.publishTime) : 0
    return tb - ta
  })
}

function normalizeReview(review: PlacesApiReview): GoogleReview {
  // Review resource name looks like "places/{placeId}/reviews/{reviewId}" — we
  // pull the trailing ID for stable dedup keys if we ever want to store full
  // history.
  const name = review.name || ''
  const reviewId = name.split('/').pop() || name

  return {
    reviewId,
    rating: review.rating || 0,
    text: review.text?.text || review.originalText?.text || '',
    relativePublishTimeDescription: review.relativePublishTimeDescription || '',
    publishTime: review.publishTime || '',
    author: {
      displayName: review.authorAttribution?.displayName || 'Anonymous',
      photoUri: review.authorAttribution?.photoUri,
      uri: review.authorAttribution?.uri,
    },
  }
}

/**
 * Fetch fresh review data for a Place ID from the Places API (New).
 */
export async function fetchPlaceReviews(placeId: string): Promise<{
  totalReviewCount: number | null
  averageRating: number | null
  reviews: GoogleReview[]
}> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    throw new Error('GOOGLE_PLACES_API_KEY is not configured')
  }

  const url = `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}`

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'X-Goog-Api-Key': apiKey,
      'X-Goog-FieldMask': 'id,rating,userRatingCount,reviews',
    },
  })

  if (!response.ok) {
    const body = await response.text()
    throw new Error(`Places API ${response.status}: ${body.slice(0, 300)}`)
  }

  const data = await response.json()

  const rawReviews: PlacesApiReview[] = Array.isArray(data.reviews) ? data.reviews : []

  // Places API (New) returns reviews ordered by relevance, not recency. Re-sort
  // by publishTime descending so the dashboard always shows the genuinely most
  // recent five.
  return {
    totalReviewCount: typeof data.userRatingCount === 'number' ? data.userRatingCount : null,
    averageRating: typeof data.rating === 'number' ? data.rating : null,
    reviews: sortByPublishTimeDesc(rawReviews.map(normalizeReview)),
  }
}

function isStale(lastFetchedAt: string | null | undefined): boolean {
  if (!lastFetchedAt) return true
  const age = Date.now() - new Date(lastFetchedAt).getTime()
  return age >= REFRESH_INTERVAL_MS
}

/**
 * Return cached reviews for a user, refreshing from Google if the cache is
 * missing or older than REFRESH_INTERVAL_MS. Returns null if the user doesn't
 * have a resolvable Place ID yet (e.g. hasn't set google_review_url, or their
 * URL is CID-based).
 */
export async function getOrRefreshReviews(
  supabase: any,
  userId: string,
  googleReviewUrl: string | null
): Promise<CachedReviews | null> {
  const placeId = extractPlaceId(googleReviewUrl)
  if (!placeId) return null

  const { data: existing } = await supabase
    .from('google_reviews_cache')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()

  // Cache hit and fresh — return as-is. Sort defensively in case the row was
  // written before we started ordering by publishTime.
  if (existing && existing.place_id === placeId && !isStale(existing.last_fetched_at)) {
    return {
      placeId: existing.place_id,
      totalReviewCount: existing.total_review_count,
      averageRating: existing.average_rating ? Number(existing.average_rating) : null,
      reviews: sortByPublishTimeDesc((existing.reviews || []) as GoogleReview[]),
      lastFetchedAt: existing.last_fetched_at,
      lastError: existing.last_error,
    }
  }

  // Refresh from Google.
  try {
    const fresh = await fetchPlaceReviews(placeId)
    const nowIso = new Date().toISOString()

    const row = {
      user_id: userId,
      place_id: placeId,
      total_review_count: fresh.totalReviewCount,
      average_rating: fresh.averageRating,
      reviews: fresh.reviews,
      last_fetched_at: nowIso,
      last_error: null,
      updated_at: nowIso,
    }

    await supabase
      .from('google_reviews_cache')
      .upsert(row, { onConflict: 'user_id' })

    // Record an observation so we can compute month-over-month review growth.
    // We only record if the API returned a numeric total — null totals would
    // poison the time series.
    if (fresh.totalReviewCount != null) {
      await supabase.from('google_review_observations').insert({
        user_id: userId,
        observed_at: nowIso,
        total_review_count: fresh.totalReviewCount,
        average_rating: fresh.averageRating,
      })
    }

    return {
      placeId,
      totalReviewCount: fresh.totalReviewCount,
      averageRating: fresh.averageRating,
      reviews: fresh.reviews,
      lastFetchedAt: nowIso,
      lastError: null,
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`Failed to refresh Google reviews for user ${userId}:`, errorMessage)

    // If we have stale data, serve it alongside the error so the user still
    // sees something useful while we work through the failure.
    if (existing) {
      await supabase
        .from('google_reviews_cache')
        .update({ last_error: errorMessage, updated_at: new Date().toISOString() })
        .eq('user_id', userId)

      return {
        placeId: existing.place_id,
        totalReviewCount: existing.total_review_count,
        averageRating: existing.average_rating ? Number(existing.average_rating) : null,
        reviews: sortByPublishTimeDesc((existing.reviews || []) as GoogleReview[]),
        lastFetchedAt: existing.last_fetched_at,
        lastError: errorMessage,
      }
    }

    return {
      placeId,
      totalReviewCount: null,
      averageRating: null,
      reviews: [],
      lastFetchedAt: new Date(0).toISOString(),
      lastError: errorMessage,
    }
  }
}

/**
 * Count reviews added this calendar month for a user. We combine two signals
 * and take the larger:
 *
 *   A. Observation-based delta: current total − (last observation before this
 *      month, or the earliest observation in this month if we have no prior).
 *      Accurate for any volume but only counts growth since we started
 *      observing this user.
 *
 *   B. Publish-time count: how many of the 5 most recent review objects from
 *      Google have a publishTime in this month. Works retroactively (great
 *      for users who already had reviews when we deployed) but caps at 5,
 *      since Places API only returns 5.
 *
 * Taking max(A, B) gives accurate retroactive coverage for typical volume
 * while still scaling correctly when more than 5 reviews land in one month.
 *
 * Returns null when we have no information at all (the UI hides the badge).
 */
export async function getNewReviewsThisMonth(
  supabase: any,
  userId: string,
  currentTotal: number | null,
  reviews: GoogleReview[]
): Promise<number | null> {
  if (currentTotal == null) return null

  const now = new Date()
  const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
  const monthStartIso = monthStart.toISOString()

  // Signal B: count reviews in the latest 5 that were published this month.
  const publishTimeCount = reviews.reduce((acc, r) => {
    if (!r.publishTime) return acc
    const ts = Date.parse(r.publishTime)
    if (Number.isNaN(ts)) return acc
    return ts >= monthStart.getTime() ? acc + 1 : acc
  }, 0)

  // Signal A: observation-based delta.
  let observationDelta: number | null = null

  const { data: priorMonth } = await supabase
    .from('google_review_observations')
    .select('total_review_count')
    .eq('user_id', userId)
    .lt('observed_at', monthStartIso)
    .order('observed_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (priorMonth && typeof priorMonth.total_review_count === 'number') {
    observationDelta = Math.max(0, currentTotal - priorMonth.total_review_count)
  } else {
    const { data: earliestThisMonth } = await supabase
      .from('google_review_observations')
      .select('total_review_count')
      .eq('user_id', userId)
      .gte('observed_at', monthStartIso)
      .order('observed_at', { ascending: true })
      .limit(1)
      .maybeSingle()

    if (earliestThisMonth && typeof earliestThisMonth.total_review_count === 'number') {
      observationDelta = Math.max(0, currentTotal - earliestThisMonth.total_review_count)
    }
  }

  if (observationDelta == null && publishTimeCount === 0) return null
  return Math.max(observationDelta ?? 0, publishTimeCount)
}
