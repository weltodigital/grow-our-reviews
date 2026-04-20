import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to test the latest user
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the most recent user (latest signup)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No profiles found'
      })
    }

    const latestProfile = profiles[0]
    const userId = (latestProfile as any).id

    console.log('🔧 Testing webhook for latest user:', userId)

    // Check if this user has any Stripe customer data
    let stripeCustomer = null
    try {
      if ((latestProfile as any).stripe_customer_id) {
        const { stripe } = await import('@/lib/stripe')
        if (stripe) {
          stripeCustomer = await stripe.customers.retrieve((latestProfile as any).stripe_customer_id)
        }
      }
    } catch (e) {
      // Customer doesn't exist
    }

    // Try to find recent checkout sessions for this user's email
    let recentSessions = []
    try {
      const { stripe } = await import('@/lib/stripe')
      if (stripe) {
        console.log('🔧 Looking for checkout sessions for email:', (latestProfile as any).email)

        // Search for recent sessions in the last hour
        const oneHourAgo = Math.floor(Date.now() / 1000) - 3600
        const sessions = await stripe.checkout.sessions.list({
          limit: 10,
          created: { gte: oneHourAgo }
        })

        // Filter sessions for this user's email
        recentSessions = sessions.data.filter(session =>
          session.customer_details?.email === (latestProfile as any).email
        )

        console.log('🔧 Found sessions:', recentSessions.length)
      }
    } catch (e) {
      console.error('Error fetching sessions:', e)
    }

    // Simulate webhook processing if we have a recent session
    let webhookSimulation = null
    if (recentSessions.length > 0) {
      const latestSession = recentSessions[0]
      console.log('🔧 Simulating webhook for session:', latestSession.id)

      try {
        // Test if we can send welcome email
        const { sendWelcomeEmail } = await import('@/lib/resend')
        const emailResult = await sendWelcomeEmail(
          (latestProfile as any).email,
          (latestProfile as any).business_name
        )

        webhookSimulation = {
          sessionId: latestSession.id,
          sessionMode: latestSession.mode,
          hasUserId: !!latestSession.metadata?.userId,
          emailTest: emailResult
        }
      } catch (emailError) {
        webhookSimulation = {
          sessionId: latestSession.id,
          error: emailError instanceof Error ? emailError.message : 'Unknown error'
        }
      }
    }

    return NextResponse.json({
      success: true,
      latestUser: {
        userId,
        email: (latestProfile as any).email,
        businessName: (latestProfile as any).business_name,
        createdAt: (latestProfile as any).created_at,
        hasStripeData: !!(latestProfile as any).stripe_customer_id,
        subscriptionStatus: (latestProfile as any).subscription_status
      },
      stripeStatus: {
        hasStripeCustomer: !!stripeCustomer,
        recentSessionsFound: recentSessions.length,
        mostRecentSession: recentSessions[0] ? {
          id: recentSessions[0].id,
          mode: recentSessions[0].mode,
          status: recentSessions[0].status,
          hasUserId: !!recentSessions[0].metadata?.userId,
          customerId: recentSessions[0].customer
        } : null
      },
      webhookSimulation,
      diagnosis: {
        profileExists: true,
        stripeSessionExists: recentSessions.length > 0,
        webhookProbablyFailed: recentSessions.length > 0 && !(latestProfile as any).stripe_customer_id,
        likelyIssue: recentSessions.length === 0 ?
          'No checkout sessions found - Stripe checkout might have failed' :
          'Checkout session exists but webhook did not process - webhook configuration issue'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Latest user webhook test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}