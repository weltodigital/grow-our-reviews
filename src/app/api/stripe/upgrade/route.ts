import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { PRICING_PLANS } from '@/lib/pricing'
import type { Database } from '@/types/database'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const { targetPlan } = await request.json() as { targetPlan: 'growth' }

    if (targetPlan !== 'growth') {
      return NextResponse.json(
        { error: 'Invalid target plan' },
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

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Failed to load profile' },
        { status: 500 }
      )
    }

    // Check if user is on starter plan
    if ((profile as any).monthly_request_limit !== 150) {
      return NextResponse.json(
        { error: 'Upgrade is only available for Starter plan users' },
        { status: 400 }
      )
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover'
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const growthPriceId = process.env.STRIPE_GROWTH_PRICE_ID!

    // If user has an existing subscription, modify it
    if ((profile as any).stripe_subscription_id) {
      try {
        // Update the existing subscription to Growth plan
        await stripe.subscriptions.update((profile as any).stripe_subscription_id, {
          items: [{
            id: (await stripe.subscriptions.retrieve((profile as any).stripe_subscription_id)).items.data[0].id,
            price: growthPriceId,
          }],
          proration_behavior: 'always_invoice', // Prorate the difference
        })

        // Update the profile in the database
        await (supabase as any)
          .from('profiles')
          .update({
            monthly_request_limit: 300,
            updated_at: new Date().toISOString()
          })
          .eq('id', user.id)

        response = NextResponse.json({
          success: true,
          message: 'Subscription upgraded successfully',
          redirect: `${baseUrl}/dashboard/billing?upgraded=true`
        })
        return response

      } catch (subscriptionError: any) {
        console.error('Failed to update subscription directly:', subscriptionError)
        // Fall through to checkout method if subscription update fails
      }
    }

    // Fallback: Create new checkout session (for users without existing subscription)
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      customer_email: user.email!,
      line_items: [
        {
          price: growthPriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: user.id,
          upgrade: 'true'
        },
      },
      metadata: {
        userId: user.id,
        upgrade: 'true'
      },
      success_url: `${baseUrl}/dashboard/billing?upgraded=true`,
      cancel_url: `${baseUrl}/dashboard/billing`,
      allow_promotion_codes: true,
    })

    response = NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
    return response

  } catch (error: any) {
    console.error('Error creating upgrade session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create upgrade session' },
      { status: 500 }
    )
  }
}