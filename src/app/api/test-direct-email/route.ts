import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail, sendSubscriptionConfirmationEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { emailType, email, businessName, planName } = await request.json()

    let result

    switch (emailType) {
      case 'welcome':
        result = await sendWelcomeEmail(email || 'test@example.com', businessName || 'Test Business')
        break
      case 'subscription':
        result = await sendSubscriptionConfirmationEmail(email || 'test@example.com', businessName || 'Test Business', planName || 'Starter')
        break
      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    return NextResponse.json({
      success: result.success,
      error: result.error,
      message: result.success ? 'Email sent successfully' : `Email failed: ${result.error}`
    })

  } catch (error: any) {
    console.error('Direct email test error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    )
  }
}