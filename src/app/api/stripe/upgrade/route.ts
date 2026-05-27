import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getPlanByLimit, PRICING_PLANS, type PlanKey } from '@/lib/pricing'
import type { Database } from '@/types/database'
import Stripe from 'stripe'

// Plan-change endpoint. Despite the legacy `/upgrade` path, this handles any
// direction (upgrade or downgrade) between Lite, Starter, Growth, and Pro.
export async function POST(request: NextRequest) {
  try {
    const { targetPlan } = (await request.json()) as { targetPlan: PlanKey }

    if (!targetPlan || !PRICING_PLANS[targetPlan]) {
      return NextResponse.json({ error: 'Invalid target plan' }, { status: 400 })
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
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 })
    }

    const currentLimit = (profile as any).monthly_request_limit
    const currentPlanKey = getPlanByLimit(currentLimit)
    const target = PRICING_PLANS[targetPlan]

    if (currentPlanKey === targetPlan) {
      return NextResponse.json({ error: 'Already on this plan' }, { status: 400 })
    }

    const isDowngrade =
      PRICING_PLANS[targetPlan].monthlyRequestLimit < PRICING_PLANS[currentPlanKey].monthlyRequestLimit

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2026-01-28.clover',
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const targetPriceId = target.stripeProductId
    if (!targetPriceId) {
      return NextResponse.json(
        { error: 'Target plan is not configured for billing' },
        { status: 500 },
      )
    }

    console.log('Plan change - Current profile state:', {
      userId: user.id,
      currentPlan: currentPlanKey,
      targetPlan,
      direction: isDowngrade ? 'downgrade' : 'upgrade',
      monthly_request_limit: currentLimit,
      subscription_status: (profile as any).subscription_status,
      stripe_subscription_id: (profile as any).stripe_subscription_id,
      stripe_customer_id: (profile as any).stripe_customer_id,
      trial_ends_at: (profile as any).trial_ends_at,
    })

    let existingSubscription: any = null

    if ((profile as any).stripe_subscription_id) {
      try {
        existingSubscription = await stripe.subscriptions.retrieve(
          (profile as any).stripe_subscription_id,
        )
      } catch (error) {
        console.log('Stored subscription ID not found, searching by customer...')
      }
    }

    if (!existingSubscription && (profile as any).stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: (profile as any).stripe_customer_id,
          status: 'all',
          limit: 1,
        })

        if (subscriptions.data.length > 0) {
          existingSubscription = subscriptions.data[0]
          await (supabase as any)
            .from('profiles')
            .update({
              stripe_subscription_id: existingSubscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)
        }
      } catch (error) {
        console.log('Error searching subscriptions by customer:', error)
      }
    }

    // If we have an active or trialing subscription, modify it directly.
    if (
      existingSubscription &&
      (existingSubscription.status === 'active' || existingSubscription.status === 'trialing')
    ) {
      try {
        const updateConfig: any = {
          items: [
            {
              id: existingSubscription.items.data[0].id,
              price: targetPriceId,
            },
          ],
        }

        if (existingSubscription.status === 'trialing') {
          // Don't charge during trial; preserve trial end date.
          updateConfig.proration_behavior = 'none'
          if (existingSubscription.trial_end) {
            const trialEndDate = new Date(existingSubscription.trial_end * 1000)
            if (trialEndDate > new Date()) {
              updateConfig.trial_end = existingSubscription.trial_end
            }
          }
        } else {
          // For active subscriptions: prorate. Stripe will invoice the difference
          // on upgrade or apply a credit on downgrade.
          updateConfig.proration_behavior = 'always_invoice'
        }

        await stripe.subscriptions.update(existingSubscription.id, updateConfig)

        const profileUpdateData: any = {
          monthly_request_limit: target.monthlyRequestLimit,
          updated_at: new Date().toISOString(),
        }
        if (!(profile as any).stripe_customer_id && existingSubscription.customer) {
          profileUpdateData.stripe_customer_id = existingSubscription.customer as string
        }
        if (!(profile as any).stripe_subscription_id) {
          profileUpdateData.stripe_subscription_id = existingSubscription.id
        }

        await (supabase as any).from('profiles').update(profileUpdateData).eq('id', user.id)

        try {
          const { sendSubscriptionConfirmationEmail } = await import('@/lib/resend')
          const emailResult = await sendSubscriptionConfirmationEmail(
            user.email!,
            (profile as any)?.business_name || 'there',
            target.name,
          )
          if (!emailResult.success) {
            console.error('Plan change confirmation email failed:', emailResult.error)
          }
        } catch (error) {
          console.error('Plan change email sending failed:', error)
        }

        response = NextResponse.json({
          success: true,
          message: isDowngrade
            ? 'Subscription downgraded successfully'
            : 'Subscription upgraded successfully',
          redirect: `${baseUrl}/dashboard/billing?planChanged=true`,
        })
        return response
      } catch (subscriptionError: any) {
        console.error('Failed to update subscription directly:', subscriptionError)
        // Fall through to checkout flow on failure.
      }
    }

    // Variables for preserving trial time in fallback flows.
    const isTrialing = (profile as any).subscription_status === 'trialing'
    let trialEndsAt = (profile as any).trial_ends_at
      ? new Date((profile as any).trial_ends_at)
      : null
    const now = new Date()
    if (isTrialing && !trialEndsAt) {
      const { calculateTrialEndDate } = await import('@/lib/pricing')
      const accountCreated = (profile as any).created_at
        ? new Date((profile as any).created_at)
        : new Date()
      trialEndsAt = calculateTrialEndDate(accountCreated)
    }
    const hasActiveTrialTime = trialEndsAt && trialEndsAt > now
    const customerId = (profile as any).stripe_customer_id

    // No existing subscription but customer has a saved card → create a fresh
    // subscription on the target plan directly (skip checkout UI).
    if (customerId && !existingSubscription) {
      try {
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card',
        })

        if (paymentMethods.data.length > 0) {
          const subscriptionData: any = {
            customer: customerId,
            items: [{ price: targetPriceId }],
            default_payment_method: paymentMethods.data[0].id,
            metadata: {
              userId: user.id,
              planChange: 'true',
              targetPlan,
            },
          }

          if (isTrialing && hasActiveTrialTime && trialEndsAt) {
            const trialDaysRemaining = Math.ceil(
              (trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
            )
            if (trialDaysRemaining > 0) {
              subscriptionData.trial_period_days = trialDaysRemaining
            }
          }

          const newSubscription = await stripe.subscriptions.create(subscriptionData)

          await (supabase as any)
            .from('profiles')
            .update({
              stripe_subscription_id: newSubscription.id,
              subscription_status: newSubscription.status,
              monthly_request_limit: target.monthlyRequestLimit,
              updated_at: new Date().toISOString(),
            })
            .eq('id', user.id)

          try {
            const { sendSubscriptionConfirmationEmail } = await import('@/lib/resend')
            await sendSubscriptionConfirmationEmail(
              user.email!,
              (profile as any)?.business_name || 'there',
              target.name,
            )
          } catch (error) {
            console.error('Plan change email sending failed:', error)
          }

          return NextResponse.json({
            success: true,
            message: 'Subscription updated successfully',
            redirect: `${baseUrl}/dashboard/billing?planChanged=true`,
          })
        }
      } catch (error) {
        console.error('Error creating subscription directly:', error)
      }
    }

    // Fallback: create a checkout session for the target plan.
    const sessionConfig: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: targetPriceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        metadata: {
          userId: user.id,
          planChange: 'true',
          targetPlan,
        },
      },
      metadata: {
        userId: user.id,
        planChange: 'true',
        targetPlan,
      },
      success_url: `${baseUrl}/dashboard/billing?planChanged=true`,
      cancel_url: `${baseUrl}/dashboard/billing`,
      allow_promotion_codes: true,
    }

    if (isTrialing && hasActiveTrialTime && trialEndsAt) {
      const trialDaysRemaining = Math.ceil(
        (trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      )
      if (trialDaysRemaining > 0) {
        sessionConfig.subscription_data.trial_period_days = trialDaysRemaining
      }
    }

    if (customerId) {
      sessionConfig.customer = customerId
    } else {
      sessionConfig.customer_email = user.email!
    }

    const session = await stripe.checkout.sessions.create(sessionConfig)

    response = NextResponse.json({
      url: session.url,
      sessionId: session.id,
    })
    return response
  } catch (error: any) {
    console.error('Error processing plan change:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to process plan change' },
      { status: 500 },
    )
  }
}
