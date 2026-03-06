import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // First verify the request exists and belongs to the user
    const { data: reviewRequest, error: fetchError } = await (supabase as any)
      .from('review_requests')
      .select('id, status, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (fetchError || !reviewRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Only allow deletion of scheduled requests
    if (reviewRequest.status !== 'scheduled') {
      return NextResponse.json(
        { error: 'Only scheduled requests can be deleted' },
        { status: 400 }
      )
    }

    // Delete the request
    const { error: deleteError } = await (supabase as any)
      .from('review_requests')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (deleteError) {
      console.error('Error deleting request:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete request' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Request deleted successfully'
    })

  } catch (error) {
    console.error('Unexpected error deleting request:', error)
    return NextResponse.json(
      { error: 'Failed to delete request' },
      { status: 500 }
    )
  }
}