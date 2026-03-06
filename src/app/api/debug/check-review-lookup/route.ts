import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json({
        error: 'Token parameter required',
        usage: 'Add ?token=your_token_here'
      }, { status: 400 })
    }

    const supabase = await createServerSupabase()

    // Step 1: Check if review request exists
    const { data: reviewRequest, error: reviewError } = await (supabase as any)
      .from('review_requests')
      .select('*')
      .eq('token', token)
      .single()

    const step1 = {
      step: 'Review Request Lookup',
      found: !!reviewRequest,
      error: reviewError?.message,
      data: reviewRequest
    }

    if (!reviewRequest) {
      return NextResponse.json({
        token,
        steps: [step1],
        conclusion: 'Review request not found in database'
      })
    }

    // Step 2: Check profile lookup
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('business_name, google_review_url')
      .eq('id', reviewRequest.user_id)
      .single()

    const step2 = {
      step: 'Profile Lookup',
      user_id: reviewRequest.user_id,
      found: !!profile,
      error: profileError?.message,
      data: profile
    }

    // Step 3: Check customer lookup
    const { data: customer, error: customerError } = await (supabase as any)
      .from('customers')
      .select('name')
      .eq('id', reviewRequest.customer_id)
      .single()

    const step3 = {
      step: 'Customer Lookup',
      customer_id: reviewRequest.customer_id,
      found: !!customer,
      error: customerError?.message,
      data: customer
    }

    const allStepsSuccessful = !!reviewRequest && !!profile && !!customer

    return NextResponse.json({
      token,
      steps: [step1, step2, step3],
      all_lookups_successful: allStepsSuccessful,
      conclusion: allStepsSuccessful
        ? 'All lookups successful - review page should work'
        : 'One or more lookups failed - this would cause "Review Link Not Found"'
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}