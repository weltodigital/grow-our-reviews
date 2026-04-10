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

    // Check if user is on starter plan (50 or 150 requests)
    const currentLimit = (profile as any).monthly_request_limit
    if (currentLimit !== 50 && currentLimit !== 150) {
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

    console.log('Upgrade - Current profile state:', {
      userId: user.id,
      monthly_request_limit: (profile as any).monthly_request_limit,
      subscription_status: (profile as any).subscription_status,
      stripe_subscription_id: (profile as any).stripe_subscription_id,
      stripe_customer_id: (profile as any).stripe_customer_id,
      trial_ends_at: (profile as any).trial_ends_at
    })

    // Try to find existing subscription - either from stored ID or by searching customer subscriptions
    let existingSubscription: any = null

    // First try with stored subscription ID
    if ((profile as any).stripe_subscription_id) {
      try {
        existingSubscription = await stripe.subscriptions.retrieve((profile as any).stripe_subscription_id)
        console.log('Found subscription using stored ID:', existingSubscription.id)
      } catch (error) {
        console.log('Stored subscription ID not found, searching by customer...')
      }
    }

    // If no stored subscription ID or it failed, search by customer
    if (!existingSubscription && (profile as any).stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: (profile as any).stripe_customer_id,
          status: 'all',
          limit: 1
        })

        if (subscriptions.data.length > 0) {
          existingSubscription = subscriptions.data[0]
          console.log('Found subscription by customer search:', existingSubscription.id)

          // Update our database with the found subscription ID
          await (supabase as any)
            .from('profiles')
            .update({
              stripe_subscription_id: existingSubscription.id,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)
        }
      } catch (error) {
        console.log('Error searching subscriptions by customer:', error)
      }
    }

    // If we found an existing subscription, try to modify it directly
    if (existingSubscription) {
      try {

        // Try direct update if subscription is active or trialing
        if (existingSubscription.status === 'active' || existingSubscription.status === 'trialing') {
          // Update the existing subscription to Growth plan
          const updateConfig: any = {
            items: [{
              id: existingSubscription.items.data[0].id,
              price: growthPriceId,
            }],
          }

          // If subscription is trialing, don't prorate and preserve trial
          if (existingSubscription.status === 'trialing') {
            updateConfig.proration_behavior = 'none'
            // Preserve trial end date if it exists and is in the future
            if (existingSubscription.trial_end) {
              const trialEndDate = new Date(existingSubscription.trial_end * 1000)
              const now = new Date()
              if (trialEndDate > now) {
                updateConfig.trial_end = existingSubscription.trial_end
                console.log(`Preserving trial end date: ${trialEndDate.toISOString()}`)
              }
            }
          } else {
            updateConfig.proration_behavior = 'always_invoice' // Prorate the difference
          }

          await stripe.subscriptions.update(existingSubscription.id, updateConfig)

          // Update the profile in the database
          const profileUpdateData: any = {
            monthly_request_limit: 300,
            updated_at: new Date().toISOString()
          }

          // Also save the customer ID and subscription ID if we don't have them in the profile
          if (!(profile as any).stripe_customer_id && existingSubscription.customer) {
            profileUpdateData.stripe_customer_id = existingSubscription.customer as string
          }
          if (!(profile as any).stripe_subscription_id) {
            profileUpdateData.stripe_subscription_id = existingSubscription.id
          }

          await (supabase as any)
            .from('profiles')
            .update(profileUpdateData)
            .eq('id', user.id)

          // Send upgrade confirmation email immediately (don't rely on webhook)
          try {
            console.log('Sending upgrade confirmation email to:', user.email)
            const { sendSubscriptionConfirmationEmail } = await import('@/lib/resend')

            const planName = 'Growth' // This is the upgrade API so it's always Growth
            const emailResult = await sendSubscriptionConfirmationEmail(
              user.email!,
              (profile as any)?.business_name || 'there',
              planName
            )

            if (emailResult.success) {
              console.log('✅ Upgrade confirmation email sent successfully')
            } else {
              console.error('❌ Upgrade confirmation email failed:', emailResult.error)
            }
          } catch (error) {
            console.error('💥 Upgrade email sending failed:', error)
            // Don't fail the upgrade if email fails
          }

          response = NextResponse.json({
            success: true,
            message: 'Subscription upgraded successfully',
            redirect: `${baseUrl}/dashboard/billing?upgraded=true`
          })
          return response
        } else {
          console.log('Subscription is not active (status: ' + existingSubscription.status + '), using checkout flow')
        }

      } catch (subscriptionError: any) {
        console.error('Failed to update subscription directly:', subscriptionError)
        // Fall through to checkout method if subscription update fails
      }
    }

    // Declare trial variables early for use in multiple places
    const isTrialing = (profile as any).subscription_status === 'trialing'
    let trialEndsAt = (profile as any).trial_ends_at ? new Date((profile as any).trial_ends_at) : null
    const now = new Date()

    // If user is trialing but has no trial_ends_at, calculate it from their account creation
    if (isTrialing && !trialEndsAt) {
      const { calculateTrialEndDate } = await import('@/lib/pricing')
      const accountCreated = (profile as any).created_at ? new Date((profile as any).created_at) : new Date()
      trialEndsAt = calculateTrialEndDate(accountCreated)
      console.log(`User trialing but missing trial_ends_at, calculated: ${trialEndsAt.toISOString()}`)
    }

    const hasActiveTrialTime = trialEndsAt && trialEndsAt > now

    // Enhanced fallback: If user has customer ID but no subscription, create subscription directly
    // Otherwise fall back to checkout session
    const customerId = (profile as any).stripe_customer_id

    if (customerId && !existingSubscription) {
      try {
        console.log('User has customer ID but no subscription, creating subscription directly...')

        // Get default payment method for the customer
        const paymentMethods = await stripe.paymentMethods.list({
          customer: customerId,
          type: 'card'
        })

        if (paymentMethods.data.length > 0) {
          // Create subscription directly using existing payment method
          const subscriptionData: any = {
            customer: customerId,
            items: [{ price: growthPriceId }],
            default_payment_method: paymentMethods.data[0].id,
            metadata: {
              userId: user.id,
              upgrade: 'true'
            }
          }

          // Add trial period if user should have trial time remaining
          if (isTrialing && hasActiveTrialTime && trialEndsAt) {
            const trialDaysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
            if (trialDaysRemaining > 0) {
              subscriptionData.trial_period_days = trialDaysRemaining
              console.log(`Creating subscription with ${trialDaysRemaining} trial days remaining`)
            }
          }

          const newSubscription = await stripe.subscriptions.create(subscriptionData)

          // Update profile with new subscription
          await (supabase as any)
            .from('profiles')
            .update({
              stripe_subscription_id: newSubscription.id,
              subscription_status: newSubscription.status,
              monthly_request_limit: 300,
              updated_at: new Date().toISOString()
            })
            .eq('id', user.id)

          console.log('Successfully created subscription directly:', newSubscription.id)

          // Send upgrade confirmation email immediately (don't rely on webhook)
          try {
            console.log('Sending upgrade confirmation email to:', user.email)
            const { sendSubscriptionConfirmationEmail } = await import('@/lib/resend')

            const planName = 'Growth' // This is the upgrade API so it's always Growth
            const emailResult = await sendSubscriptionConfirmationEmail(
              user.email!,
              (profile as any)?.business_name || 'there',
              planName
            )

            if (emailResult.success) {
              console.log('✅ Upgrade confirmation email sent successfully')
            } else {
              console.error('❌ Upgrade confirmation email failed:', emailResult.error)
            }
          } catch (error) {
            console.error('💥 Upgrade email sending failed:', error)
            // Don't fail the upgrade if email fails
          }

          return NextResponse.json({
            success: true,
            message: 'Subscription upgraded successfully',
            redirect: `${baseUrl}/dashboard/billing?upgraded=true`
          })
        } else {
          console.log('Customer has no saved payment methods, falling back to checkout')
        }
      } catch (error) {
        console.error('Error creating subscription directly:', error)
        console.log('Falling back to checkout flow')
      }
    }

    // Final fallback: Create new checkout session (for users without existing customer or failed direct creation)
    const sessionConfig: any = {
      mode: 'subscription',
      payment_method_types: ['card'],
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
    }

    // If user has active trial time remaining, preserve it in the new subscription
    if (isTrialing && hasActiveTrialTime && trialEndsAt) {
      const trialDaysRemaining = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000))
      if (trialDaysRemaining > 0) {
        sessionConfig.subscription_data.trial_period_days = trialDaysRemaining
        console.log(`Preserving ${trialDaysRemaining} trial days for upgrade (trial ends: ${trialEndsAt.toISOString()})`)
      }
    } else if (isTrialing) {
      // User is marked as trialing but trial has ended or no trial end date
      console.log('User trialing but no active trial time found:', {
        trialEndsAt: trialEndsAt?.toISOString(),
        now: now.toISOString(),
        hasActiveTrialTime
      })
    }

    // Use existing customer ID if available, otherwise use email to create new one
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
    console.error('Error creating upgrade session:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create upgrade session' },
      { status: 500 }
    )
  }
}