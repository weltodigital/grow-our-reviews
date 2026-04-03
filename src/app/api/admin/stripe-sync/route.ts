import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { getPriceInfo } from '@/lib/stripe'
import { protectAdminEndpoint } from '@/lib/admin-auth'

// Manual sync API for admin use
export async function POST(request: NextRequest) {
  // SECURITY: Protect admin endpoint
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult
  try {
    const { userId, subscriptionId } = await request.json()

    if (!userId && !subscriptionId) {
      return NextResponse.json(
        { error: 'Either userId or subscriptionId required' },
        { status: 400 }
      )
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    const { stripe } = await import('@/lib/stripe')
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }

    let profile
    let subscription

    if (userId) {
      // Get profile by user ID
      const { data: foundProfile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error || !foundProfile) {
        return NextResponse.json(
          { error: 'Profile not found' },
          { status: 404 }
        )
      }

      profile = foundProfile

      if ((profile as any).stripe_subscription_id) {
        subscription = await stripe.subscriptions.retrieve((profile as any).stripe_subscription_id)
      }
    } else {
      // Get subscription from Stripe and find matching profile
      subscription = await stripe.subscriptions.retrieve(subscriptionId)

      const { data: foundProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('stripe_subscription_id', subscriptionId)
        .single()

      profile = foundProfile
    }

    if (!subscription) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 404 }
      )
    }

    // Sync the profile with current Stripe data
    const priceId = subscription.items.data[0]?.price.id
    const priceInfo = getPriceInfo(priceId)

    const updateData = {
      subscription_status: subscription.status,
      updated_at: new Date().toISOString(),
    } as any

    if (priceInfo) {
      updateData.monthly_request_limit = priceInfo.monthlyRequestLimit
    }

    if (subscription.trial_end) {
      updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString()
    }

    const { error: syncError } = await (supabase as any)
      .from('profiles')
      .update(updateData)
      .eq('id', (profile as any).id)

    if (syncError) {
      throw new Error(`Sync failed: ${syncError.message}`)
    }

    return NextResponse.json({
      success: true,
      message: 'Profile synced successfully',
      profile: {
        id: (profile as any).id,
        email: (profile as any).email,
        subscription_status: subscription.status,
        monthly_request_limit: priceInfo?.monthlyRequestLimit,
        stripe_subscription_id: subscription.id
      }
    })

  } catch (error: any) {
    console.error('Manual sync failed:', error)
    return NextResponse.json(
      { error: 'Sync failed', details: error.message },
      { status: 500 }
    )
  }
}