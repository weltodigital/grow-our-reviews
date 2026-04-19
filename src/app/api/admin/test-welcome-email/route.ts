import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'
import { protectAdminEndpoint } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // SECURITY: Protect admin endpoint
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

  try {
    // Test email to your account
    const testEmail = 'ed@weltodigital.com'
    const testBusinessName = 'Welto Digital (Admin Test)'

    console.log('🔧 Admin welcome email test started...')
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
        hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin welcome email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  // SECURITY: Protect admin endpoint
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

  try {
    const { email, businessName } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    console.log(`🔧 Admin welcome email test to: ${email}`)
    console.log('🔧 RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)

    const result = await sendWelcomeEmail(email, businessName || 'Test Business')

    console.log('🔧 Welcome email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Welcome email sent successfully to ${email}`
        : `Failed to send welcome email: ${result.error}`,
      destination: email,
      businessName: businessName || 'Test Business',
      emailResult: result,
      environment: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Admin welcome email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}