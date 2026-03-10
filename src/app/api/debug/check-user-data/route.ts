import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
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

    // Check what user IDs we have in requests
    const { data: requestUsers } = await (supabase as any)
      .from('review_requests')
      .select('user_id')
      .limit(20)

    const userIds = [...new Set(requestUsers?.map((r: any) => r.user_id) || [])]

    // Now check if these users exist in auth.users
    const { data: authUsers } = await (supabase as any)
      .from('auth.users')
      .select('id, email')
      .in('id', userIds)

    // Check profiles for these users
    const { data: profiles } = await (supabase as any)
      .from('profiles')
      .select('*')
      .in('id', userIds)

    // Check customers for these users
    const { data: customers } = await (supabase as any)
      .from('customers')
      .select('*')
      .in('user_id', userIds)

    // Check a specific request to see the full picture
    const { data: sampleRequest } = await (supabase as any)
      .from('review_requests')
      .select(`
        *,
        profiles(*),
        customers(*)
      `)
      .eq('status', 'sent')
      .eq('nudge_sent', false)
      .limit(1)
      .single()

    return NextResponse.json({
      message: 'User data analysis',
      user_ids_in_requests: userIds,
      auth_users_found: authUsers?.length || 0,
      profiles_found: profiles?.length || 0,
      customers_found: customers?.length || 0,
      auth_users: authUsers || [],
      profiles: profiles || [],
      customers: customers || [],
      sample_request_with_joins: sampleRequest || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      error: 'User data check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}