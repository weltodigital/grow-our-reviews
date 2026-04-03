import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { PRICING_PLANS } from '@/lib/pricing'
import { STRIPE_CONFIG } from '@/lib/stripe'
import { protectAdminEndpoint } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // SECURITY: Protect debug endpoint - admin access only
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

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

  try {
    // Get all user profiles for debugging (admin view)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10)

    const debug = {
      recentProfiles: profiles,
      pricingConfig: PRICING_PLANS,
      stripeConfig: STRIPE_CONFIG,
      envVars: {
        STRIPE_STARTER_PRICE_ID: process.env.STRIPE_STARTER_PRICE_ID,
        STRIPE_GROWTH_PRICE_ID: process.env.STRIPE_GROWTH_PRICE_ID
      },
      expectedDefaults: {
        monthly_request_limit: 150,
        subscription_status: 'trialing'
      }
    }

    return NextResponse.json(debug)

  } catch (error) {
    console.error('Debug error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch debug info' },
      { status: 500 }
    )
  }
}