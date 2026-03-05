import { NextRequest, NextResponse } from 'next/server'

// Manual trigger for SMS sending - for debugging purposes
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    // For now, require a simple secret to prevent abuse
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Trigger the SMS cron endpoint manually
    const cronUrl = `${request.url.split('/api/debug')[0]}/api/cron/send-sms`

    const response = await fetch(cronUrl, {
      method: 'GET',
      headers: {
        'authorization': `Bearer ${process.env.CRON_SECRET}`,
        'user-agent': 'Manual Debug Trigger'
      }
    })

    const result = await response.json()

    return NextResponse.json({
      message: 'Manual SMS trigger completed',
      cronResponse: result,
      status: response.status
    })

  } catch (error) {
    console.error('Error in manual SMS trigger:', error)
    return NextResponse.json(
      {
        error: 'Failed to trigger SMS sending',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}