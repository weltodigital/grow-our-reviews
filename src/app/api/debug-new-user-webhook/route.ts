import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to test the new user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Test the new user account
    const userId = 'c5733ce5-f7f7-4ca1-a3e4-324e8461687e'  // New test account
    const email = 'ed@weltodigital.com'

    console.log('🔧 Testing webhook email logic for new user:', userId)

    // Step 1: Fetch profile exactly as webhook does
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, business_name')
      .eq('id', userId)
      .single()

    console.log('🔧 Profile fetch result:', { profile, profileError })

    if (profileError) {
      return NextResponse.json({
        success: false,
        error: 'Profile fetch failed',
        details: profileError.message,
        step: 'profile_fetch'
      })
    }

    if (!profile?.email) {
      return NextResponse.json({
        success: false,
        error: 'No email in profile',
        step: 'email_check',
        profile: profile
      })
    }

    // Step 2: Test welcome email sending
    let welcomeEmailResult
    try {
      console.log('🔧 Importing email functions...')
      const { sendWelcomeEmail } = await import('@/lib/resend')
      console.log('🔧 Email functions imported successfully')

      console.log('🔧 Attempting to send welcome email to:', (profile as any).email)
      console.log('🔧 Business name:', (profile as any).business_name)

      welcomeEmailResult = await sendWelcomeEmail((profile as any).email, (profile as any).business_name)
      console.log('🔧 Welcome email result:', welcomeEmailResult)

    } catch (emailError) {
      welcomeEmailResult = {
        success: false,
        error: emailError instanceof Error ? emailError.message : 'Unknown email error'
      }
    }

    // Step 3: Check billing page redirect logic
    const billingRedirectTest = {
      hasStripeCustomerId: !!(profile as any)?.stripe_customer_id,
      hasSubscriptionStatus: !!(profile as any)?.subscription_status,
      shouldRedirectToDashboard: false
    }

    // Test the exact logic from billing setup page
    const { data: fullProfile } = await supabase
      .from('profiles')
      .select('subscription_status, stripe_customer_id, business_name')
      .eq('id', userId)
      .single()

    if (fullProfile) {
      const hasActiveSubscription = ((fullProfile as any).subscription_status === 'active' ||
                                   (fullProfile as any).subscription_status === 'trialing') &&
                                   (fullProfile as any).stripe_customer_id
      billingRedirectTest.shouldRedirectToDashboard = hasActiveSubscription
    }

    return NextResponse.json({
      success: true,
      newUserTest: 'complete',
      userId,
      email,
      steps: {
        profileFetch: '✅ Success',
        emailSending: welcomeEmailResult?.success ? '✅ Success' : '❌ Failed',
        billingRedirect: billingRedirectTest.shouldRedirectToDashboard ? '✅ Should redirect' : '❌ Won\'t redirect'
      },
      results: {
        profile: {
          email: (profile as any).email,
          businessName: (profile as any).business_name,
          fullProfileData: fullProfile
        },
        welcomeEmail: welcomeEmailResult,
        billingRedirectLogic: billingRedirectTest
      },
      diagnosis: {
        webhookWorked: !profileError && !!profile?.email,
        emailWouldSend: welcomeEmailResult?.success,
        billingPageIssue: !billingRedirectTest.shouldRedirectToDashboard ?
          'Profile missing subscription data' : 'Should redirect to dashboard'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('New user webhook test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}