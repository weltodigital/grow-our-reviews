import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // First, check if there are ANY review requests at all
    const { data: allRequests, error: allError, count: totalCount } = await (supabase as any)
      .from('review_requests')
      .select('*', { count: 'exact' })
      .limit(20)

    if (allError) {
      return NextResponse.json({
        error: 'Failed to fetch all requests',
        details: allError.message
      }, { status: 500 })
    }

    // Now try the join query
    const { data: requestsWithProfiles, error: joinError } = await (supabase as any)
      .from('review_requests')
      .select(`
        id,
        token,
        status,
        nudge_sent,
        sent_at,
        created_at,
        user_id,
        customer_id,
        profiles(
          id,
          business_name,
          nudge_enabled,
          nudge_delay_hours
        ),
        customers(
          id,
          name,
          phone
        )
      `)
      .limit(10)

    // Check profiles separately
    const { data: profiles, error: profileError, count: profileCount } = await (supabase as any)
      .from('profiles')
      .select('id, business_name, nudge_enabled, nudge_delay_hours', { count: 'exact' })
      .limit(10)

    // Check customers separately
    const { data: customers, error: customerError, count: customerCount } = await (supabase as any)
      .from('customers')
      .select('id, name, phone, user_id', { count: 'exact' })
      .limit(10)

    const summary = {
      database_status: {
        total_requests: totalCount || 0,
        total_profiles: profileCount || 0,
        total_customers: customerCount || 0,
      },
      requests_sample: allRequests ? allRequests.map((req: any) => ({
        id: req.id,
        status: req.status,
        nudge_sent: req.nudge_sent,
        sent_at: req.sent_at,
        created_at: req.created_at,
        user_id: req.user_id,
        customer_id: req.customer_id
      })) : [],
      profiles_sample: profiles ? profiles.map((profile: any) => ({
        id: profile.id,
        business_name: profile.business_name,
        nudge_enabled: profile.nudge_enabled,
        nudge_delay_hours: profile.nudge_delay_hours
      })) : [],
      customers_sample: customers ? customers.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        user_id: customer.user_id
      })) : [],
      join_query_result: requestsWithProfiles ? requestsWithProfiles.length : 0,
      errors: {
        all_requests_error: allError?.message || null,
        join_error: joinError?.message || null,
        profile_error: profileError?.message || null,
        customer_error: customerError?.message || null
      }
    }

    return NextResponse.json({
      message: 'Database analysis complete',
      current_time: new Date().toISOString(),
      ...summary
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Analysis failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}