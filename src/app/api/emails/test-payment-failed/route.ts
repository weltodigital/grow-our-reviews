import { NextRequest, NextResponse } from 'next/server'
import { sendPaymentFailedEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    // Test data for Starter plan payment failed
    const retryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')

    const result = await sendPaymentFailedEmail(
      'ed@weltodigital.com',
      'Welto Digital',
      'Starter',
      retryDate
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payment failed email sent to ed@weltodigital.com',
      retryDate: retryDate,
      data: result.data
    })
  } catch (error) {
    console.error('Test payment failed email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const { planType = 'starter' } = await request.json()
    const retryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')

    const businessName = planType === 'growth'
      ? 'Welto Digital (Growth Plan)'
      : 'Welto Digital (Starter Plan)'

    const planName = planType.charAt(0).toUpperCase() + planType.slice(1)

    const result = await sendPaymentFailedEmail(
      'ed@weltodigital.com',
      businessName,
      planName,
      retryDate
    )

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: `${planName} payment failed email sent to ed@weltodigital.com`,
      retryDate: retryDate,
      data: result.data
    })
  } catch (error) {
    console.error('Test payment failed email error:', error)
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    )
  }
}