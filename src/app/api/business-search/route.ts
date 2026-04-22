import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('query')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 })
    }

    const apiKey = process.env.GOOGLE_PLACES_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Google Places API key not configured' }, { status: 500 })
    }

    // Use Google Places API Text Search to find businesses
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&key=${apiKey}`

    const response = await fetch(url)
    const data = await response.json()

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message)
      return NextResponse.json({ error: 'Failed to search businesses' }, { status: 500 })
    }

    // Transform the results to a simpler format
    const businesses = data.results?.map((place: any) => ({
      placeId: place.place_id,
      name: place.name,
      address: place.formatted_address,
      rating: place.rating,
      userRatingsTotal: place.user_ratings_total,
      types: place.types,
      // Generate the direct review URL
      reviewUrl: `https://search.google.com/local/writereview?placeid=${place.place_id}`
    })) || []

    return NextResponse.json({ businesses })
  } catch (error) {
    console.error('Business search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}