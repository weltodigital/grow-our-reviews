import { NextRequest, NextResponse } from 'next/server'
import { sendTrialEndingEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, businessName, trialEndsAt } = await request.json()

    if (!email || !trialEndsAt) {
      return NextResponse.json(
        { error: 'Email and trial end date are required' },
        { status: 400 }
      )
    }

    const result = await sendTrialEndingEmail(email, businessName || 'there', trialEndsAt)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Trial ending email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send trial ending email' },
      { status: 500 }
    )
  }
}