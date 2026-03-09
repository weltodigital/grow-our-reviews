import { NextRequest, NextResponse } from 'next/server'
import { sendPaymentFailedEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, businessName, planName, retryDate } = await request.json()

    if (!email || !planName) {
      return NextResponse.json(
        { error: 'Email and planName are required' },
        { status: 400 }
      )
    }

    // Format retry date or use default
    const formattedRetryDate = retryDate || new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')

    const result = await sendPaymentFailedEmail(email, businessName || 'there', planName, formattedRetryDate)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Payment failed email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send payment failed email' },
      { status: 500 }
    )
  }
}