import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    // Simple test - no authentication needed
    const testEmail = 'ed@weltodigital.com'
    const testBusinessName = 'Simple Email Test'

    console.log('🔧 Simple email test started...')
    console.log('🔧 RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)
    console.log(`🔧 Attempting to send welcome email to: ${testEmail}`)

    const result = await sendWelcomeEmail(testEmail, testBusinessName)

    console.log('🔧 Welcome email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Welcome email sent successfully to ${testEmail}`
        : `Failed to send welcome email: ${result.error}`,
      destination: testEmail,
      businessName: testBusinessName,
      emailResult: result,
      environment: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Simple email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      environment: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}