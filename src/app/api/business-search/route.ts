import { NextRequest, NextResponse } from 'next/server'

// Generous in-memory per-IP rate limit. This endpoint is unauthenticated and
// each call costs a Google Places query, so this caps scripted quota/cost abuse.
// The onboarding typeahead is debounced (300ms) and only fires at length >= 2,
// so a real user makes far fewer than this in a minute — the limit is invisible
// to legitimate use. In-memory means per serverless instance, which is fine as a
// cost backstop.
const RATE_WINDOW_MS = 60_000
const RATE_MAX = 30
const rateHits = new Map<string, number[]>()

function withinRateLimit(ip: string): boolean {
  const now = Date.now()
  const recent = (rateHits.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS)
  if (recent.length >= RATE_MAX) {
    rateHits.set(ip, recent)
    return false
  }
  recent.push(now)
  rateHits.set(ip, recent)
  return true
}

export async function GET(request: NextRequest) {
  try {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'
    if (!withinRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Too many searches. Please wait a moment and try again.' },
        { status: 429 },
      )
    }

    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 })
    }

    // Use the NEW Google Places API Text Search
    const url = 'https://places.googleapis.com/v1/places:searchText'

    console.log('Making request to Google Places API (New):', { query })

    const requestBody = {
      textQuery: query,
      maxResultCount: 10
      // Remove locationBias for now to avoid potential issues
      // Can add back later if needed for location-specific searches
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.types'
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    if (!response.ok) {
      console.error('Google Places API HTTP error:', response.status, response.statusText)
      console.error('Google Places API error response:', data)
      return NextResponse.json({
        error: `Google Places API error: ${response.status} ${response.statusText}`,
        details: data.error?.message || JSON.stringify(data)
      }, { status: 500 })
    }

    console.log('Google Places API (New) response:', { places: data.places?.length })

    // The new API doesn't return a status field like the old one
    // Instead, check if we got places data or error
    if (data.error) {
      console.error('Google Places API error:', data.error)

      let errorMessage = 'Failed to search businesses'
      if (data.error.code === 403) {
        errorMessage = 'Google Places API access denied. Please check API key and permissions.'
      } else if (data.error.code === 429) {
        errorMessage = 'Google Places API quota exceeded. Please try again later.'
      }

      return NextResponse.json({
        error: errorMessage,
        details: data.error.message
      }, { status: 500 })
    }

    // Transform the results to a simpler format
    const businesses = data.places?.map((place: any) => ({
      placeId: place.id,
      name: place.displayName?.text || place.displayName,
      address: place.formattedAddress,
      rating: place.rating,
      userRatingsTotal: place.userRatingCount,
      types: place.types || [],
      // Generate the direct review URL using the place ID
      reviewUrl: `https://search.google.com/local/writereview?placeid=${place.id}`
    })) || []

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error('Business search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}