import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createCheckoutSession } from '@/lib/stripe'
import { PRICING_PLANS, type PlanKey } from '@/lib/pricing'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { planKey } = await request.json() as { planKey: PlanKey }

    // Validate plan
    if (!planKey || !PRICING_PLANS[planKey]) {
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

    // Check if user already has an active subscription
    if ((profile as any).stripe_subscription_id && (profile as any).subscription_status === 'active') {
      return NextResponse.json(
        { error: 'You already have an active subscription' },
        { status: 400 }
      )
    }

    const plan = PRICING_PLANS[planKey]
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // Create Stripe checkout session
    const session = await createCheckoutSession({
      priceId: plan.stripeProductId!,
      successUrl: `${baseUrl}/dashboard/billing?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${baseUrl}/pricing`,
      customerEmail: user.email!,
      userId: user.id,
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