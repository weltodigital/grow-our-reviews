import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function GET(request: NextRequest) {
  return await handleWebhookTest(request)
}

export async function POST(request: NextRequest) {
  return await handleWebhookTest(request)
}

async function handleWebhookTest(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Simulate the exact webhook flow that should happen after checkout
    console.log('🔧 Simulating webhook flow for user:', user.id)

    // Get user's profile (same as webhook does)
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, business_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json({
        success: false,
        error: 'Profile not found',
        debug: {
          userId: user.id,
          profileFound: false
        }
      })
    }

    console.log('🔧 Profile found:', {
      email: (profile as any).email,
      businessName: (profile as any).business_name
    })

    if (!(profile as any).email) {
      return NextResponse.json({
        success: false,
        error: 'No email in profile',
        debug: {
          userId: user.id,
          profile: profile
        }
      })
    }

    // Check environment variables (same as webhook does)
    const hasResendKey = !!process.env.RESEND_API_KEY
    const hasStripeWebhookSecret = !!process.env.STRIPE_WEBHOOK_SECRET

    console.log('🔧 Environment check:', {
      hasResendKey,
      hasStripeWebhookSecret
    })

    // Send welcome email (same as webhook does)
    console.log('🔧 Attempting to send welcome email...')
    const welcomeResult = await sendWelcomeEmail((profile as any).email, (profile as any).business_name)
    console.log('🔧 Welcome email result:', welcomeResult)

    return NextResponse.json({
      success: welcomeResult.success,
      message: welcomeResult.success
        ? 'Webhook simulation successful - welcome email sent!'
        : 'Webhook simulation failed',
      debug: {
        userId: user.id,
        profile: {
          email: (profile as any).email,
          businessName: (profile as any).business_name
        },
        environment: {
          hasResendKey,
          hasStripeWebhookSecret
        },
        emailResult: welcomeResult,
        webhookLogic: 'This simulates the exact same logic that runs in the Stripe webhook after checkout.session.completed'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook simulation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Simulation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}