import { NextRequest, NextResponse } from 'next/server'

// Manual trigger for nudge sending - for debugging purposes
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Trigger the nudge cron endpoint manually
    const nudgeUrl = `${request.url.split('/api/debug')[0]}/api/cron/send-nudges`

    const response = await fetch(nudgeUrl, {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${process.env.CRON_SECRET}`,
        'user-agent': 'Manual Debug Trigger'
      }
    })

    const result = await response.json()

    return NextResponse.json({
      message: 'Manual nudge trigger completed',
      cronResponse: result,
      status: response.status
    })

  } catch (error) {
    console.error('Error in manual nudge trigger:', error)
    return NextResponse.json(
      {
        error: 'Failed to trigger nudge sending',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}