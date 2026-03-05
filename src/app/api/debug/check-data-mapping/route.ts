import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    const now = new Date().toISOString()

    // Step 1: Get review requests
    const { data: reviewRequests, error: fetchError } = await (supabase as any)
      .from('review_requests')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)

    if (fetchError) {
      return NextResponse.json({ error: 'Failed to fetch review requests', details: fetchError }, { status: 500 })
    }

    if (!reviewRequests || reviewRequests.length === 0) {
      return NextResponse.json({ message: 'No scheduled requests found' })
    }

    // Step 2: Get unique IDs
    const userIds = [...new Set(reviewRequests.map((req: any) => req.user_id))]
    const customerIds = [...new Set(reviewRequests.map((req: any) => req.customer_id))]

    // Step 3: Fetch profiles
    const { data: profiles, error: profilesError } = await (supabase as any)
      .from('profiles')
      .select('id, business_name, google_review_url')
      .in('id', userIds)

    // Step 4: Fetch customers
    const { data: customers, error: customersError } = await (supabase as any)
      .from('customers')
      .select('id, name, phone')
      .in('id', customerIds)

    // Step 5: Show mapping results
    const profileMap = new Map()
    const customerMap = new Map()

    profiles?.forEach((profile: any) => profileMap.set(profile.id, profile))
    customers?.forEach((customer: any) => customerMap.set(customer.id, customer))

    const mappingResults = reviewRequests.map((request: any) => ({
      requestId: request.id,
      userId: request.user_id,
      customerId: request.customer_id,
      profileFound: !!profileMap.get(request.user_id),
      customerFound: !!customerMap.get(request.customer_id),
      profileData: profileMap.get(request.user_id) || null,
      customerData: customerMap.get(request.customer_id) || null
    }))

    return NextResponse.json({
      message: 'Data mapping analysis',
      currentTime: now,
      reviewRequestsCount: reviewRequests.length,
      userIds,
      customerIds,
      profilesCount: profiles?.length || 0,
      customersCount: customers?.length || 0,
      mappingResults,
      profiles: profiles || [],
      customers: customers || [],
      errors: {
        fetchError,
        profilesError,
        customersError
      }
    })

  } catch (error) {
    console.error('Error in data mapping debug:', error)
    return NextResponse.json({
      error: 'Failed to analyze data mapping',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}