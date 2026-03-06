import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const token = searchParams.get('token')

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

    // Use service role key
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // Find the review request
    const { data: reviewRequest, error: findError } = await (supabase as any)
      .from('review_requests')
      .select('id')
      .eq('token', token)
      .single()

    if (findError || !reviewRequest) {
      return NextResponse.json({
        error: 'Review request not found',
        token
      })
    }

    // Delete any existing feedback for this review request
    const { data: deletedFeedback, error: deleteError } = await (supabase as any)
      .from('feedback')
      .delete()
      .eq('review_request_id', reviewRequest.id)
      .select()

    if (deleteError) {
      return NextResponse.json({
        error: 'Failed to delete feedback',
        details: deleteError.message
      }, { status: 500 })
    }

    // Reset review request status back to 'sent'
    const { error: updateError } = await (supabase as any)
      .from('review_requests')
      .update({ status: 'sent' })
      .eq('id', reviewRequest.id)

    return NextResponse.json({
      success: true,
      message: 'Test feedback cleared successfully',
      deletedCount: deletedFeedback?.length || 0,
      token,
      updateError: updateError?.message || null
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Failed to clear test feedback',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}