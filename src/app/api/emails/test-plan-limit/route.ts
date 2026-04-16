import { NextRequest, NextResponse } from 'next/server'
import { sendPlanLimitReachedEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    // Test data for Starter plan limit
    const result = await sendPlanLimitReachedEmail(
      'ed@weltodigital.com',
      'Welto Digital',
      150, // Starter plan limit
      150  // Used all requests
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Plan limit email sent to ed@weltodigital.com',
      data: result.data
    })
  } catch (error) {
    console.error('Test plan limit email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { planType = 'starter' } = await request.json()

    // Different test data based on plan type
    const testData = planType === 'growth'
      ? {
          limit: 300,
          used: 300,
          businessName: 'Welto Digital (Growth Plan)'
        }
      : {
          limit: 150,
          used: 150,
          businessName: 'Welto Digital (Starter Plan)'
        }

    const result = await sendPlanLimitReachedEmail(
      'ed@weltodigital.com',
      testData.businessName,
      testData.limit,
      testData.used
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${planType.charAt(0).toUpperCase() + planType.slice(1)} plan limit email sent to ed@weltodigital.com`,
      data: result.data
    })
  } catch (error) {
    console.error('Test plan limit email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}