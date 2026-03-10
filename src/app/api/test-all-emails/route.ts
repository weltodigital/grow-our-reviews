import { NextRequest, NextResponse } from 'next/server'
import {
  sendWelcomeEmail,
  sendTrialEndingEmail,
  sendSubscriptionConfirmationEmail,
  sendPlanLimitReachedEmail,
  sendPaymentFailedEmail
} from '@/lib/resend'

export async function GET(request: NextRequest) {
  const results = []
  const testEmail = 'ed@weltodigital.com'
  const testBusiness = 'Welto Digital (Test)'

  try {
    // Test Welcome Email
    const welcomeResult = await sendWelcomeEmail(testEmail, testBusiness)
    results.push({
      type: 'Welcome Email',
      success: welcomeResult.success,
      error: welcomeResult.error || null
    })

    // Test Trial Ending Email
    const trialEndDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
    const trialResult = await sendTrialEndingEmail(testEmail, testBusiness, trialEndDate)
    results.push({
      type: 'Trial Ending Email',
      success: trialResult.success,
      error: trialResult.error || null
    })

    // Test Subscription Confirmation Email
    const subscriptionResult = await sendSubscriptionConfirmationEmail(testEmail, testBusiness, 'Growth')
    results.push({
      type: 'Subscription Confirmation Email',
      success: subscriptionResult.success,
      error: subscriptionResult.error || null
    })

    // Test Plan Limit Reached Email (Starter)
    const planLimitResult = await sendPlanLimitReachedEmail(testEmail, testBusiness, 50, 50)
    results.push({
      type: 'Plan Limit Reached Email (Starter)',
      success: planLimitResult.success,
      error: planLimitResult.error || null
    })

    // Test Payment Failed Email
    const retryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')
    const paymentFailedResult = await sendPaymentFailedEmail(testEmail, testBusiness, 'Growth', retryDate)
    results.push({
      type: 'Payment Failed Email (Growth)',
      success: paymentFailedResult.success,
      error: paymentFailedResult.error || null
    })

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length

    return NextResponse.json({
      success: true,
      message: `Sent ${successCount}/${totalCount} test emails to ${testEmail}`,
      emailsSent: successCount,
      totalEmails: totalCount,
      destination: testEmail,
      results: results,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to send test emails',
      details: error instanceof Error ? error.message : 'Unknown error',
      results: results
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { emailType = 'all', planType = 'starter' } = await request.json()
    const testEmail = 'ed@weltodigital.com'
    const testBusiness = 'Welto Digital (Test)'

    let result;
    let emailDescription;

    switch (emailType) {
      case 'plan-limit':
        const limit = planType === 'growth' ? 150 : 50
        result = await sendPlanLimitReachedEmail(testEmail, `${testBusiness} (${planType.charAt(0).toUpperCase() + planType.slice(1)})`, limit, limit)
        emailDescription = `Plan Limit Reached (${planType.charAt(0).toUpperCase() + planType.slice(1)})`
        break

      case 'payment-failed':
        const retryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')
        result = await sendPaymentFailedEmail(testEmail, `${testBusiness} (${planType.charAt(0).toUpperCase() + planType.slice(1)})`, planType.charAt(0).toUpperCase() + planType.slice(1), retryDate)
        emailDescription = `Payment Failed (${planType.charAt(0).toUpperCase() + planType.slice(1)})`
        break

      case 'welcome':
        result = await sendWelcomeEmail(testEmail, testBusiness)
        emailDescription = 'Welcome'
        break

      case 'trial-ending':
        const trialEndDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
        result = await sendTrialEndingEmail(testEmail, testBusiness, trialEndDate)
        emailDescription = 'Trial Ending'
        break

      case 'subscription-confirmation':
        result = await sendSubscriptionConfirmationEmail(testEmail, testBusiness, planType.charAt(0).toUpperCase() + planType.slice(1))
        emailDescription = `Subscription Confirmation (${planType.charAt(0).toUpperCase() + planType.slice(1)})`
        break

      default:
        return NextResponse.json({ error: 'Invalid email type' }, { status: 400 })
    }

    if (!result.success) {
      return NextResponse.json({
        success: false,
        error: result.error,
        emailType: emailDescription
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `${emailDescription} email sent to ${testEmail}`,
      emailType: emailDescription,
      destination: testEmail,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to send test email',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}