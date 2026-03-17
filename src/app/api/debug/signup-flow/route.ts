import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { PRICING_PLANS } from '@/lib/pricing'
import { STRIPE_CONFIG } from '@/lib/stripe'

export async function GET(request: NextRequest) {
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Readonly for debugging
        },
      },
    }
  )

  // Get the current user
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  try {
    // Get user profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    const debug = {
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      profile,
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