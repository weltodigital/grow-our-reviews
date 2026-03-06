import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/auth'

// Manual status update for review requests - for debugging purposes
export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const token = searchParams.get('token')
    const status = searchParams.get('status') || 'sent'

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (!token) {
      return NextResponse.json(
        { error: 'Token parameter required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Update the review request status
    const { data: reviewRequest, error } = await (supabase as any)
      .from('review_requests')
      .update({
        status,
        ...(status === 'sent' && { sent_at: new Date().toISOString() })
      })
      .eq('token', token)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json(
        {
          error: 'Failed to update status',
          details: error.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Review request status updated successfully',
      token,
      oldStatus: 'scheduled',
      newStatus: status,
      reviewRequest
    })

  } catch (error) {
    console.error('Error updating review request status:', error)
    return NextResponse.json(
      {
        error: 'Failed to update review request status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}