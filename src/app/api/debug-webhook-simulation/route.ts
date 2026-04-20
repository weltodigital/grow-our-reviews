import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to bypass RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get your specific user profile
    const userId = 'b6bd84a8-f044-4f40-ae57-465c42157964'

    console.log('🔧 Simulating webhook for user:', userId)

    // Step 1: Fetch profile data (same as webhook does)
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

    console.log('🔧 Profile has email, proceeding with email send simulation')

    // Step 2: Import email functions (same as webhook)
    console.log('🔧 Debug: RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)
    console.log('🔧 Debug: Importing email functions...')

    const { sendWelcomeEmail } = await import('@/lib/resend')
    console.log('🔧 Debug: Email functions imported successfully')

    // Step 3: Send welcome email (exact same logic as webhook)
    console.log('🔧 Debug: Attempting to send welcome email to:', profile.email)
    console.log('🔧 Debug: Business name:', profile.business_name)

    const welcomeResult = await sendWelcomeEmail(profile.email, profile.business_name)
    console.log('🔧 Debug: Welcome email result:', welcomeResult)

    return NextResponse.json({
      success: true,
      simulation: 'webhook_email_flow',
      steps: {
        profileFetch: {
          success: true,
          email: profile.email,
          businessName: profile.business_name
        },
        emailImport: {
          success: true,
          message: 'Email functions imported successfully'
        },
        emailSend: {
          success: welcomeResult.success,
          result: welcomeResult,
          emailId: welcomeResult.success ? welcomeResult.data?.id : null,
          error: !welcomeResult.success ? welcomeResult.error : null
        }
      },
      environment: {
        hasResendKey: !!process.env.RESEND_API_KEY,
        hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
      },
      webhookLogic: 'This simulates the exact email sending logic from checkout.session.completed webhook',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook simulation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Simulation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}