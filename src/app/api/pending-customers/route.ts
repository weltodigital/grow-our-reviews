import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

// GET - Fetch user's pending customers
export async function GET(request: NextRequest) {
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

    const { data: pendingCustomers, error } = await supabase
      .from('pending_customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching pending customers:', error)
      return NextResponse.json(
        { error: 'Failed to fetch pending customers' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      pendingCustomers: pendingCustomers || []
    })

  } catch (error) {
    console.error('Pending customers GET error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE - Remove pending customers
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('id')

    if (!customerId) {
      return NextResponse.json(
        { error: 'Customer ID required' },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from('pending_customers')
      .update({ status: 'cancelled' })
      .eq('id', customerId)
      .eq('user_id', user.id)
      .eq('status', 'pending')

    if (error) {
      console.error('Error cancelling pending customer:', error)
      return NextResponse.json(
        { error: 'Failed to cancel pending customer' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Pending customer cancelled'
    })

  } catch (error) {
    console.error('Pending customers DELETE error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}