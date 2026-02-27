import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, businessName } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    const result = await sendWelcomeEmail(email, businessName || 'there')

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Welcome email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send welcome email' },
      { status: 500 }
    )
  }
}