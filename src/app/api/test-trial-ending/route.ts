import { NextRequest, NextResponse } from 'next/server'
import { sendTrialEndingEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    // Test trial ending email with your data
    const testEmail = 'edwelton0@gmail.com'
    const testBusinessName = 'Welton Property'
    const testTrialEndDate = '2026-04-27' // 7 days from now

    console.log('🔧 Trial ending email test started...')
    console.log(`🔧 Attempting to send trial ending email to: ${testEmail}`)

    const result = await sendTrialEndingEmail(testEmail, testBusinessName, testTrialEndDate)

    console.log('🔧 Trial ending email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Trial ending email sent successfully to ${testEmail}`
        : `Failed to send trial ending email: ${result.error}`,
      destination: testEmail,
      businessName: testBusinessName,
      trialEndsAt: testTrialEndDate,
      emailResult: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Trial ending email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}