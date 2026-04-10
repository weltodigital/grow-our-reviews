import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'
import type { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createRouteSupabase(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
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
}

export async function getUser() {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

// Stripe webhook failure recovery functions
async function getStripeSessionInfo(sessionId: string) {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY is not configured')
    return null
  }

  // Validate session_id format - Stripe checkout session IDs start with 'cs_'
  if (!sessionId || !sessionId.startsWith('cs_') || sessionId.length < 10) {
    console.log('Invalid Stripe session ID format:', sessionId)
    return null
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
    })

    console.log('Checking Stripe session directly:', sessionId)

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription']
    })

    if (session.payment_status !== 'paid') {
      console.log('Session payment not completed:', session.payment_status)
      return null
    }

    if (!session.customer || !session.subscription) {
      console.log('Session missing customer or subscription')
      return null
    }

    const subscription = session.subscription as Stripe.Subscription

    return {
      customerId: session.customer as string,
      subscriptionId: subscription.id,
      subscriptionStatus: subscription.status,
      paymentStatus: session.payment_status,
    }
  } catch (error) {
    // Log error but don't expose details to prevent information leakage
    console.error('Error retrieving Stripe session (details hidden from user):', (error as any)?.message || 'Unknown error')
    return null
  }
}

async function handleWebhookFailure(userId: string, sessionId: string): Promise<boolean> {
  try {
    // First, check if this session has already been processed by checking if user already has active subscription
    // This prevents unnecessary Stripe API calls and ensures reconciliation only happens once
    const supabase = await createServerSupabase()

    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('stripe_customer_id, subscription_status')
      .eq('id', userId)
      .single()

    // If user already has an active subscription, skip reconciliation
    if ((currentProfile as any)?.stripe_customer_id &&
        (currentProfile as any)?.subscription_status &&
        ['active', 'trialing'].includes((currentProfile as any).subscription_status)) {
      console.log('User already has active subscription, skipping reconciliation')
      return true // Return true since reconciliation is not needed
    }

    // Get session info directly from Stripe
    const sessionInfo = await getStripeSessionInfo(sessionId)

    if (!sessionInfo) {
      console.log('No valid session info found for:', sessionId)
      return false
    }

    console.log('Reconciling webhook failure for user:', userId, 'session:', sessionId.substring(0, 10) + '...')

    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        stripe_customer_id: sessionInfo.customerId,
        stripe_subscription_id: sessionInfo.subscriptionId,
        subscription_status: sessionInfo.subscriptionStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      console.error('Error updating profile during reconciliation:', error)
      return false
    }

    console.log('Successfully reconciled webhook failure for user:', userId)
    return true
  } catch (error) {
    console.error('Error handling webhook failure:', error)
    return false
  }
}

export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabase()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return profile
}

export async function requireUserWithProfile(sessionId?: string): Promise<{ user: any; profile: any }> {
  const user = await requireAuth()
  let profile = await getUserProfile(user.id)

  if (!profile) {
    redirect('/onboarding')
    throw new Error('Redirected to onboarding')
  }

  // Explicit type assertion to help TypeScript understand the profile structure
  let validProfile = profile as any

  // Check if user has completed onboarding - business_name is required, google_review_url is optional
  if (!validProfile.business_name) {
    redirect('/onboarding')
    throw new Error('Redirected to onboarding')
  }

  // Check for webhook failure scenario: session_id present but no subscription
  if (sessionId && (!validProfile.stripe_customer_id || !validProfile.subscription_status || !['active', 'trialing'].includes(validProfile.subscription_status as string))) {
    console.log('🔥 WEBHOOK FAILURE DETECTED - attempting reconciliation', {
      userId: user.id,
      sessionId: sessionId.substring(0, 15) + '...',
      currentProfile: {
        hasStripeCustomerId: !!validProfile.stripe_customer_id,
        subscriptionStatus: validProfile.subscription_status,
        businessName: validProfile.business_name
      }
    })

    try {
      const reconciled = await handleWebhookFailure(user.id, sessionId)

      if (reconciled) {
        // Re-fetch profile after reconciliation
        console.log('🚀 Webhook reconciliation succeeded - refetching profile')
        profile = await getUserProfile(user.id)
        if (profile) {
          validProfile = profile as any
          console.log('✅ Profile updated after webhook reconciliation', {
            hasStripeCustomerId: !!validProfile.stripe_customer_id,
            subscriptionStatus: validProfile.subscription_status
          })
        }
      } else {
        console.log('❌ Webhook reconciliation failed - session invalid or incomplete')
      }
    } catch (error) {
      console.error('💥 Error during webhook reconciliation:', error)
    }
  }

  // Auto-fix legacy users with old monthly_request_limit values
  if (validProfile.monthly_request_limit === 50 &&
      validProfile.subscription_status === 'trialing' &&
      !validProfile.stripe_subscription_id) {
    console.log('🔧 Auto-fixing legacy user with 50 credit limit to 150 (Starter plan default)')
    try {
      const supabase = await createServerSupabase()
      const { error } = await supabase
        .from('profiles')
        .update({
          monthly_request_limit: 150,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (!error) {
        validProfile.monthly_request_limit = 150
        console.log('✅ Successfully updated user credit limit to 150')
      } else {
        console.error('❌ Failed to update user credit limit:', error)
      }
    } catch (error) {
      console.error('💥 Error auto-fixing user credit limit:', error)
    }
  }

  // Final check after potential reconciliation
  if (!validProfile.stripe_customer_id || !validProfile.subscription_status || !['active', 'trialing'].includes(validProfile.subscription_status as string)) {
    redirect('/billing/setup')
    throw new Error('Redirected to billing setup')
  }

  return { user, profile: validProfile }
}