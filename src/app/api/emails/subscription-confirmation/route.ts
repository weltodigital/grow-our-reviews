import { NextRequest, NextResponse } from 'next/server'
import { sendSubscriptionConfirmationEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, businessName, planName } = await request.json()

    if (!email || !planName) {
      return NextResponse.json(
        { error: 'Email and plan name are required' },
        { status: 400 }
      )
    }

    const result = await sendSubscriptionConfirmationEmail(email, businessName || 'there', planName)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Subscription confirmation email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send subscription confirmation email' },
      { status: 500 }
    )
  }
}