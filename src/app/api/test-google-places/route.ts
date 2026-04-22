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

    // Test with a simple known business
    const testQuery = 'McDonald\'s London'
    const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(testQuery)}&key=${apiKey}`

    console.log('Testing Google Places API with query:', testQuery)

    const response = await fetch(url)
    const data = await response.json()

    return NextResponse.json({
      status: 'success',
      apiKeyConfigured: true,
      apiKeyLength: apiKey.length,
      apiKeyPrefix: apiKey.substring(0, 8) + '...',
      googleResponse: {
        status: data.status,
        error_message: data.error_message,
        resultsCount: data.results?.length || 0,
        sampleResult: data.results?.[0] ? {
          name: data.results[0].name,
          place_id: data.results[0].place_id,
          formatted_address: data.results[0].formatted_address
        } : null
      },
      troubleshooting: {
        commonIssues: [
          'REQUEST_DENIED: API key lacks permissions or Places API not enabled',
          'OVER_QUERY_LIMIT: Billing not set up or daily quota exceeded',
          'INVALID_REQUEST: API request format incorrect'
        ],
        nextSteps: [
          '1. Go to Google Cloud Console: https://console.cloud.google.com',
          '2. Enable "Places API (New)" in APIs & Services',
          '3. Set up billing if not already done',
          '4. Check API key restrictions in Credentials section'
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