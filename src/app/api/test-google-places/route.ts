import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY

    if (!apiKey) {
      return NextResponse.json({
        status: 'error',
        message: 'GOOGLE_PLACES_API_KEY not found in environment',
        suggestions: [
          'Check that .env.local contains GOOGLE_PLACES_API_KEY',
          'Restart your development server after adding the key'
        ]
      })
    }

    // Test with a simple known business using NEW API
    const testQuery = 'McDonald\'s London'
    const url = 'https://places.googleapis.com/v1/places:searchText'

    console.log('Testing Google Places API (New) with query:', testQuery)

    const requestBody = {
      textQuery: testQuery,
      maxResultCount: 1,
      includedType: 'restaurant'
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'places.id,places.displayName,places.formattedAddress'
      },
      body: JSON.stringify(requestBody)
    })

    const data = await response.json()

    return NextResponse.json({
      status: 'success',
      apiKeyConfigured: true,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      usingNewAPI: true,
      googleResponse: {
        httpStatus: response.status,
        error: data.error,
        resultsCount: data.places?.length || 0,
        sampleResult: data.places?.[0] ? {
          name: data.places[0].displayName?.text || data.places[0].displayName,
          place_id: data.places[0].id,
          formatted_address: data.places[0].formattedAddress
        } : null
      },
      troubleshooting: {
        apiUpgrade: 'Now using Places API (New) instead of legacy API',
        commonIssues: [
          'HTTP 403: API key lacks permissions or Places API (New) not enabled',
          'HTTP 429: Billing not set up or daily quota exceeded',
          'HTTP 400: Invalid request format'
        ],
        nextSteps: [
          '1. Go to Google Cloud Console: https://console.cloud.google.com',
          '2. Enable "Places API (New)" (not the old Places API)',
          '3. Set up billing (required for Places API New)',
          '4. Check API key restrictions in Credentials section',
          '5. Ensure your API key has Places API (New) in allowed APIs'
        ]
      }
    })

  } catch (error) {
    console.error('Google Places API test error:', error)
    return NextResponse.json({
      status: 'error',
      message: 'Failed to test Google Places API',
      error: error instanceof Error ? error.message : 'Unknown error',
      suggestions: [
        'Check network connectivity',
        'Verify API key format',
        'Check Google Cloud Console for API status'
      ]
    })
  }
}