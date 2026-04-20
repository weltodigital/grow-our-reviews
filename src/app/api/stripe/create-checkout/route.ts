import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { PRICING_PLANS, type PlanKey } from '@/lib/pricing'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { planKey, priceId, successUrl, cancelUrl, trialDays } = await request.json() as {
      planKey?: PlanKey
      priceId?: string
      successUrl?: string
      cancelUrl?: string
      trialDays?: number
    }

    // Validate input - either planKey or priceId is required
    if (!planKey && !priceId) {
      return NextResponse.json(
        { error: 'Plan key or price ID is required' },
        { status: 400 }
      )
    }

    if (planKey && !PRICING_PLANS[planKey]) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      )
    }

    let response: NextResponse

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options })
              response.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get user's profile to check current subscription
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('Error fetching profile:', profileError)
      return NextResponse.json(
        { error: 'Failed to load profile' },
        { status: 500 }
      )
    }

    // Log profile for debugging
    console.log('Create checkout - Current profile:', {
      id: user.id,
      monthly_request_limit: (profile as any)?.monthly_request_limit,
      subscription_status: (profile as any)?.subscription_status,
      stripe_subscription_id: (profile as any)?.stripe_subscription_id,
      trial_ends_at: (profile as any)?.trial_ends_at
    })

    // Check if user already has an active subscription
    if ((profile as any).stripe_subscription_id &&
        ((profile as any).subscription_status === 'active' || (profile as any).subscription_status === 'trialing')) {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Determine the price ID to use
    const finalPriceId = priceId || (planKey ? PRICING_PLANS[planKey].stripeProductId : null)

    if (!finalPriceId) {
      return NextResponse.json(
        { error: 'Unable to determine price ID' },
        { status: 400 }
      )
    }

    // UPDATE: Set the correct monthly_request_limit and billing_cycle_date immediately
    // Handle both planKey and priceId scenarios
    let selectedPlan = null
    let planType = 'unknown'

    if (planKey) {
      selectedPlan = PRICING_PLANS[planKey]
      planType = planKey
    } else if (priceId) {
      // Determine plan from priceId
      const starterPriceId = process.env.STRIPE_STARTER_PRICE_ID
      const growthPriceId = process.env.STRIPE_GROWTH_PRICE_ID

      if (priceId === starterPriceId) {
        selectedPlan = PRICING_PLANS.starter
        planType = 'starter'
      } else if (priceId === growthPriceId) {
        selectedPlan = PRICING_PLANS.growth
        planType = 'growth'
      }
    }

    if (selectedPlan) {
      // Import billing cycle calculation function
      const { calculateBillingCycleDate } = await import('@/lib/billing-cycle')

      const updateData: any = {
        monthly_request_limit: selectedPlan.monthlyRequestLimit,
        updated_at: new Date().toISOString()
      }

      // Set billing cycle date if user doesn't have one
      if (!profile || !(profile as any).billing_cycle_date) {
        updateData.billing_cycle_date = calculateBillingCycleDate(new Date())
      }

      const { error: updateError } = await (supabase as any)
        .from('profiles')
        .update(updateData)
        .eq('id', user.id)

      if (updateError) {
        console.error('Error updating profile:', updateError)
        // Don't fail checkout, but log the error
      } else {
        console.log(`Updated user ${user.id} to ${selectedPlan.monthlyRequestLimit} credits for ${planType} plan`, updateData)
      }
    } else {
      console.warn('Could not determine plan to set monthly_request_limit')
    }

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      priceId: finalPriceId,
      successUrl: successUrl || `${baseUrl}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: cancelUrl || `${baseUrl}/billing/setup`,
      customerEmail: user.email!,
      userId: user.id,
      trialDays: trialDays,
    })

    response = NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
    return response

  } catch (error: any) {
    console.error('Error creating checkout session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}