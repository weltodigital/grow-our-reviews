import { NextRequest, NextResponse } from 'next/server'
import { sendPaymentSuspendedEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, businessName, cancellationReason } = await request.json()

    if (!email || !businessName) {
      return NextResponse.json(
        { error: 'Email and business name are required' },
        { status: 400 }
      )
    }

    const result = await sendPaymentSuspendedEmail(email, businessName, cancellationReason)

    if (result.success) {
      return NextResponse.json({ success: true, messageId: result.messageId })
    } else {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Payment suspended email error:', error)
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    )
  }
}