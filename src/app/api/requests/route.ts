import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
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
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get query parameters
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const status = searchParams.get('status')
    const search = searchParams.get('search')

    const offset = (page - 1) * limit

    // Build the query
    let query = supabase
      .from('review_requests')
      .select(`
        id,
        status,
        scheduled_for,
        sent_at,
        clicked_at,
        nudge_sent,
        nudge_sent_at,
        token,
        created_at,
        sms_message_sid,
        queued_reason,
        queued_at,
        customers(name, phone)
      `)
      .eq('user_id', user.id)
      .not('customers', 'is', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter (search in customer name and phone)
    if (search) {
      // Check if search looks like a phone number (contains digits)
      const isPhoneSearch = /\d/.test(search)

      if (isPhoneSearch) {
        // Search in phone field with multiple format possibilities
        // Phone numbers might be stored as "+447123456789", "07123456789", "07123 456789", etc.
        const searchTerm = search.trim()
        query = query.ilike('customers.phone', `%${searchTerm}%`)
      } else {
        // Search in customer name
        query = query.ilike('customers.name', `%${search}%`)
      }
    }

    const { data: requests, error } = await query

    if (error) {
      console.error('Error fetching requests:', error)
      response = NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
      return response
    }

    // Get status counts for ALL requests (not just current page)
    const { data: allRequests, error: countsError } = await supabase
      .from('review_requests')
      .select('status, customers(name)')
      .eq('user_id', user.id)
      .not('customers', 'is', null)

    if (countsError) {
      console.error('Error fetching status counts:', countsError)
      response = NextResponse.json(
        { error: 'Failed to fetch status counts' },
        { status: 500 }
      )
      return response
    }

    // Calculate status counts from ALL requests
    const statusCounts = {
      all: allRequests?.length || 0,
      scheduled: allRequests?.filter((r: any) => r.status === 'scheduled').length || 0,
      queued: allRequests?.filter((r: any) => r.status === 'queued').length || 0,
      sent: allRequests?.filter((r: any) => r.status === 'sent').length || 0,
      clicked: allRequests?.filter((r: any) => r.status === 'clicked').length || 0,
      feedback_given: allRequests?.filter((r: any) => r.status === 'feedback_given').length || 0,
      failed: allRequests?.filter((r: any) => r.status === 'failed').length || 0,
      suppressed: allRequests?.filter((r: any) => r.status === 'suppressed').length || 0,
      // Handle legacy 'reviewed' status by including it in feedback_given count
      reviewed: allRequests?.filter((r: any) => r.status === 'reviewed').length || 0,
    }

    // Format the data for the frontend
    const formattedRequests = requests?.map((request: any) => ({
      id: request.id,
      customer_name: request.customers?.name || 'Unknown Customer',
      customer_phone: request.customers?.phone || '',
      status: request.status,
      scheduled_for: request.scheduled_for,
      sent_at: request.sent_at,
      clicked_at: request.clicked_at,
      nudge_sent: request.nudge_sent,
      nudge_sent_at: request.nudge_sent_at,
      token: request.token,
      created_at: request.created_at
    })) || []

    // Use count based on current filter
    const totalCount = status && status !== 'all'
      ? statusCounts[status as keyof typeof statusCounts] || 0
      : statusCounts.all || 0


    response = NextResponse.json({
      requests: formattedRequests,
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit),
      statusCounts
    })
    return response

  } catch (error) {
    console.error('Error in requests API:', error)
    response = NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
    return response
  }
}