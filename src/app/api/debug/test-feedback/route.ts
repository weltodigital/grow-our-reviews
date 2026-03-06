import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')
    const token = searchParams.get('token') || 'cb7653f0064b3e25'

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role key like the fixed feedback API
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

    // Test 1: Find the review request
    const { data: reviewRequest, error: findError } = await (supabase as any)
      .from('review_requests')
      .select('*')
      .eq('token', token)
      .single()

    if (findError || !reviewRequest) {
      return NextResponse.json({
        step: 'Find Review Request',
        success: false,
        error: findError?.message || 'Review request not found',
        token
      })
    }

    // Test 2: Try to create feedback
    const testFeedback = {
      review_request_id: reviewRequest.id,
      user_id: reviewRequest.user_id,
      rating: 2,
      comment: 'Test feedback comment',
    }

    const { data: feedbackResult, error: feedbackError } = await (supabase as any)
      .from('feedback')
      .insert(testFeedback)
      .select()

    if (feedbackError) {
      return NextResponse.json({
        step: 'Create Feedback',
        success: false,
        error: feedbackError.message,
        details: feedbackError.details,
        hint: feedbackError.hint,
        code: feedbackError.code,
        testData: testFeedback
      })
    }

    // Test 3: Update review request status
    const { error: updateError } = await (supabase as any)
      .from('review_requests')
      .update({ status: 'feedback_given' })
      .eq('id', reviewRequest.id)

    return NextResponse.json({
      step: 'Complete Test',
      success: true,
      message: 'Feedback submission test successful',
      feedbackCreated: feedbackResult,
      updateError: updateError?.message || null
    })

  } catch (error) {
    return NextResponse.json({
      step: 'Unexpected Error',
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}