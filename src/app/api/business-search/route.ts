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

    console.log('Making request to Google Places API:', { query, url: url.replace(apiKey, '***') })

    const response = await fetch(url)

    if (!response.ok) {
      console.error('Google Places API HTTP error:', response.status, response.statusText)
      return NextResponse.json({
        error: `Google Places API error: ${response.status} ${response.statusText}`
      }, { status: 500 })
    }

    const data = await response.json()
    console.log('Google Places API response:', { status: data.status, resultsCount: data.results?.length })

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places API error:', data.status, data.error_message)

      // Provide specific error messages based on status
      let errorMessage = 'Failed to search businesses'
      if (data.status === 'REQUEST_DENIED') {
        errorMessage = 'Google Places API access denied. Please check API key and permissions.'
      } else if (data.status === 'OVER_QUERY_LIMIT') {
        errorMessage = 'Google Places API quota exceeded. Please try again later.'
      } else if (data.status === 'INVALID_REQUEST') {
        errorMessage = 'Invalid search query. Please try different keywords.'
      }

      return NextResponse.json({
        error: errorMessage,
        details: data.error_message || data.status
      }, { status: 500 })
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