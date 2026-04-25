import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { getOrRefreshReviews } from '@/lib/google-reviews'

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

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('google_review_url')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    response = NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    return response
  }

  const googleReviewUrl: string | null = (profile as any).google_review_url

  if (!googleReviewUrl) {
    response = NextResponse.json({
      status: 'no_url',
      message: 'No Google review URL configured for this account.',
    })
    return response
  }

  const cached = await getOrRefreshReviews(supabase, user.id, googleReviewUrl)

  if (!cached) {
    response = NextResponse.json({
      status: 'no_place_id',
      message: 'Could not extract a Place ID from your Google review URL.',
    })
    return response
  }

  response = NextResponse.json({
    status: 'ok',
    placeId: cached.placeId,
    totalReviewCount: cached.totalReviewCount,
    averageRating: cached.averageRating,
    reviews: cached.reviews,
    lastFetchedAt: cached.lastFetchedAt,
    lastError: cached.lastError,
  })
  return response
}
