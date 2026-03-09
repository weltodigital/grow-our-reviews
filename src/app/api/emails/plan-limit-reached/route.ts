import { NextRequest, NextResponse } from 'next/server'
import { sendPlanLimitReachedEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const { email, businessName, currentLimit, requestsUsed } = await request.json()

    if (!email || !currentLimit || !requestsUsed) {
      return NextResponse.json(
        { error: 'Email, currentLimit, and requestsUsed are required' },
        { status: 400 }
      )
    }

    const result = await sendPlanLimitReachedEmail(email, businessName || 'there', currentLimit, requestsUsed)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Plan limit email API error:', error)
    return NextResponse.json(
      { error: 'Failed to send plan limit email' },
      { status: 500 }
    )
  }
}