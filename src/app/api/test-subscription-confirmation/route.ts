import { NextRequest, NextResponse } from 'next/server'
import { sendSubscriptionConfirmationEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    // Test subscription confirmation email
    const testEmail = 'edwelton0@gmail.com'
    const testBusinessName = 'Welton Property'
    const testPlan = 'Growth' // Based on your subscription

    console.log('🔧 Subscription confirmation email test started...')
    console.log('🔧 RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)
    console.log(`🔧 Attempting to send subscription confirmation email to: ${testEmail}`)

    const result = await sendSubscriptionConfirmationEmail(testEmail, testBusinessName, testPlan)

    console.log('🔧 Subscription confirmation email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Subscription confirmation email sent successfully to ${testEmail}`
        : `Failed to send subscription confirmation email: ${result.error}`,
      destination: testEmail,
      businessName: testBusinessName,
      planName: testPlan,
      emailResult: result,
      environment: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        nodeEnv: process.env.NODE_ENV
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Subscription confirmation email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}