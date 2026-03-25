import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Use service role key for public access
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // Get the review request and current profile data
    const { data: reviewRequest, error: reviewError } = await (supabase as any)
      .from('review_requests')
      .select('user_id, created_at')
      .eq('token', token)
      .single()

    if (reviewError || !reviewRequest) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 404 }
      )
    }

    // Check if token has expired (90 days)
    const createdAt = new Date((reviewRequest as any).created_at)
    const now = new Date()
    const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))

    if (daysSinceCreation > 90) {
      return NextResponse.json(
        { error: 'Token has expired' },
        { status: 410 }
      )
    }

    // Fetch the CURRENT Google review URL from the profile
    const { data: profile, error: profileError } = await (supabase as any)
      .from('profiles')
      .select('google_review_url')
      .eq('id', (reviewRequest as any).user_id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    if (!(profile as any).google_review_url) {
      return NextResponse.json(
        { error: 'Google review URL not configured' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      googleReviewUrl: (profile as any).google_review_url
    })

  } catch (error) {
    console.error('Error fetching current Google URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}