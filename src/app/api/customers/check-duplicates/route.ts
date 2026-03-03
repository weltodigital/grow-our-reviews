import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { phoneNumbers } = await request.json()

    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return NextResponse.json(
        { error: 'Phone numbers array required' },
        { status: 400 }
      )
    }

    // Check for existing review requests in the last 30 days
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: existingRequests, error } = await supabase
      .from('review_requests')
      .select(`
        customers!inner(phone)
      `)
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .in('customers.phone', phoneNumbers)

    if (error) {
      console.error('Error checking duplicates:', error)
      return NextResponse.json(
        { error: 'Failed to check duplicates' },
        { status: 500 }
      )
    }

    // Extract phone numbers that already have requests
    const existingPhones = existingRequests?.map((req: any) => req.customers.phone) || []

    return NextResponse.json({
      existingPhones
    })

  } catch (error) {
    console.error('Check duplicates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}