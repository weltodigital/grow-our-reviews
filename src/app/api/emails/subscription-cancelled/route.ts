import { NextRequest, NextResponse } from 'next/server'
import { sendSubscriptionCancelledEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, businessName } = await request.json()

    if (!email || !businessName) {
      return NextResponse.json(
        { error: 'Email and business name are required' },
        { status: 400 }
      )
    }

    const result = await sendSubscriptionCancelledEmail(email, businessName)

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Subscription cancelled email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}