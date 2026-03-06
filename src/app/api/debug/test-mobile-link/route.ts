import { NextRequest, NextResponse } from 'next/server'

// Simple endpoint to test mobile link accessibility
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.json({
      message: 'Debug Test - No Token Provided',
      instructions: 'Add ?token=your_token_here to test a specific review link',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
    })
  }

  // Test if we can access the review page data
  try {
    const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${token}`

    return NextResponse.json({
      message: 'Debug Test - Mobile Link Check',
      token,
      reviewUrl,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      isMobile: /Mobile|Android|iPhone|iPad/.test(request.headers.get('user-agent') || ''),
      instructions: 'Try accessing this URL on your mobile device',
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}