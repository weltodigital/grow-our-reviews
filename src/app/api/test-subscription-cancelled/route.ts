import { NextRequest, NextResponse } from 'next/server'
import { sendSubscriptionCancelledEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    // Test subscription cancelled email
    const testEmail = 'edwelton0@gmail.com'
    const testBusinessName = 'Welton Property'

    console.log('🔧 Subscription cancelled email test started...')
    console.log(`🔧 Attempting to send subscription cancelled email to: ${testEmail}`)

    const result = await sendSubscriptionCancelledEmail(testEmail, testBusinessName)

    console.log('🔧 Subscription cancelled email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Subscription cancelled email sent successfully to ${testEmail}`
        : `Failed to send subscription cancelled email: ${result.error}`,
      destination: testEmail,
      businessName: testBusinessName,
      emailResult: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Subscription cancelled email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}