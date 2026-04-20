import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to replicate webhook behavior exactly
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Simulate the exact webhook event data from your checkout
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_live_b1iU12M9U2FK2R3r0erIhip5I0sUJzDGzJwSSWxmR38UqNBcs5K8E7grG2',
          mode: 'subscription',
          customer: 'cus_UMk2nJv4wwhhtf',
          subscription: 'sub_1TO0YrK4siLpHZ95pI01uRBK',
          customer_details: {
            email: 'edwelton0@gmail.com'
          },
          metadata: {
            userId: 'b6bd84a8-f044-4f40-ae57-465c42157964'
          }
        }
      }
    }

    const session = mockEvent.data.object
    const userId = session.metadata?.userId

    console.log('🔧 Simulating webhook with actual session data')
    console.log('🔧 Session:', session)

    // Step 1: Check if userId exists (this should pass)
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'No userId in session metadata',
        step: 'userId_check'
      })
    }
    console.log('✅ Step 1: userId exists:', userId)

    // Step 2: Import and fetch subscription from Stripe (same as webhook does)
    let subscription, stripe
    try {
      const stripeModule = await import('@/lib/stripe')
      stripe = stripeModule.stripe
      if (!stripe) {
        throw new Error('Stripe is not configured')
      }
      subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      console.log('✅ Step 2: Stripe subscription fetched:', subscription.id)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch subscription',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'stripe_fetch'
      })
    }

    // Step 3: Get price info (same as webhook does)
    let priceInfo
    try {
      const { getPriceInfo } = await import('@/lib/stripe')
      const priceId = subscription.items.data[0]?.price.id
      priceInfo = getPriceInfo(priceId)
      console.log('✅ Step 3: Price info determined:', { priceId, priceInfo })
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to get price info',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'price_info'
      })
    }

    if (!priceInfo) {
      return NextResponse.json({
        success: false,
        error: 'Unknown price ID',
        step: 'price_validation'
      })
    }

    // Step 4: Database operations (same as webhook does)
    let existingProfile
    try {
      const { data } = await supabase
        .from('profiles')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('id', userId)
        .single()
      existingProfile = data
      console.log('✅ Step 4: Existing profile fetched:', existingProfile)
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch existing profile',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'existing_profile_fetch'
      })
    }

    // Step 5: Profile update/create logic (shortened version)
    try {
      const trialEnd = subscription.trial_end
        ? new Date(subscription.trial_end * 1000)
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now

      const updateData = {
        email: session.customer_details?.email || '',
        stripe_subscription_id: subscription.id,
        subscription_status: subscription.status,
        monthly_request_limit: priceInfo.monthlyRequestLimit,
        trial_ends_at: trialEnd.toISOString(),
        updated_at: new Date().toISOString(),
      }

      if (!existingProfile?.stripe_customer_id) {
        (updateData as any).stripe_customer_id = session.customer as string
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', userId)

      console.log('✅ Step 5: Profile updated:', { updateError })

      if (updateError) {
        throw new Error(`Profile update failed: ${updateError.message}`)
      }
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Profile update/create failed',
        details: error instanceof Error ? error.message : 'Unknown error',
        step: 'profile_update'
      })
    }

    // Step 6: Email sending logic (exact same as webhook)
    let emailResult
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, business_name')
        .eq('id', userId)
        .single()

      console.log('✅ Step 6: Profile for email fetched:', profile)

      if (profile?.email) {
        console.log('✅ Profile has email, importing email functions...')

        const { sendWelcomeEmail } = await import('@/lib/resend')
        console.log('✅ Email functions imported, sending welcome email...')

        emailResult = await sendWelcomeEmail((profile as any).email, (profile as any).business_name)
        console.log('✅ Email result:', emailResult)
      } else {
        emailResult = { success: false, error: 'No email in profile' }
      }
    } catch (error) {
      emailResult = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      }
    }

    return NextResponse.json({
      success: true,
      webhookSimulation: 'complete',
      steps: {
        userIdCheck: '✅ Passed',
        stripeFetch: '✅ Passed',
        priceInfo: '✅ Passed',
        profileFetch: '✅ Passed',
        profileUpdate: '✅ Passed',
        emailSending: emailResult?.success ? '✅ Passed' : '❌ Failed'
      },
      emailResult,
      analysis: {
        wouldWebhookSendEmail: emailResult?.success,
        issue: !emailResult?.success ? 'Email sending failed in webhook' : 'No issues found'
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Actual webhook simulation error:', error)
    return NextResponse.json({
      success: false,
      error: 'Simulation failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}