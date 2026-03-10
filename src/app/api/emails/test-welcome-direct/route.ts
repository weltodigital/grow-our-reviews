import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    console.log('Direct welcome email test started...')

    // Send directly to ed@weltodigital.com for testing
    const testEmail = 'ed@weltodigital.com'
    const testBusiness = 'Welto Digital (Direct Test)'

    console.log(`Attempting to send welcome email to: ${testEmail}`)

    const result = await sendWelcomeEmail(testEmail, testBusiness)

    console.log('Welcome email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Welcome email sent successfully to ${testEmail}`
        : `Failed to send welcome email: ${result.error}`,
      destination: testEmail,
      businessName: testBusiness,
      error: result.error || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Direct welcome email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, businessName } = await request.json()

    if (!email) {
      return NextResponse.json({
        success: false,
        error: 'Email is required'
      }, { status: 400 })
    }

    console.log(`Direct welcome email test to: ${email}`)

    const result = await sendWelcomeEmail(email, businessName || 'Test Business')

    console.log('Welcome email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Welcome email sent successfully to ${email}`
        : `Failed to send welcome email: ${result.error}`,
      destination: email,
      businessName: businessName || 'Test Business',
      error: result.error || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Direct welcome email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}