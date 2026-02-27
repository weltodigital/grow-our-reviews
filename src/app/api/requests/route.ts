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
        customers(name, phone)
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    // Apply search filter (search in customer name)
    if (search) {
      query = query.ilike('customers.name', `%${search}%`)
    }

    const { data: requests, error, count } = await query

    if (error) {
      console.error('Error fetching requests:', error)
      response = NextResponse.json(
        { error: 'Failed to fetch requests' },
        { status: 500 }
      )
      return response
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

    response = NextResponse.json({
      requests: formattedRequests,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
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