import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const token = searchParams.get('token')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!token) {
      return NextResponse.json({ error: 'Token parameter required' }, { status: 400 })
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() { /* no-op */ },
        },
      }
    )

    // First, try to find the review request with this token
    const { data: reviewRequest, error } = await (supabase as any)
      .from('review_requests')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !reviewRequest) {
      // Also check all tokens to see what's available
      const { data: allTokens } = await (supabase as any)
        .from('review_requests')
        .select('id, token, status, created_at')
        .order('created_at', { ascending: false })
        .limit(10)

      return NextResponse.json({
        message: 'Token not found',
        searchedToken: token,
        error: error?.message,
        recentTokens: allTokens || []
      })
    }

    // Get the profile and customer data
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('business_name, google_review_url')
      .eq('id', reviewRequest.user_id)
      .single()

    const { data: customer } = await (supabase as any)
      .from('customers')
      .select('name, phone')
      .eq('id', reviewRequest.customer_id)
      .single()

    return NextResponse.json({
      message: 'Token found',
      token: token,
      reviewRequest,
      profile,
      customer,
      hasProfile: !!profile,
      hasCustomer: !!customer
    })

  } catch (error) {
    console.error('Error checking token:', error)
    return NextResponse.json({
      error: 'Failed to check token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}