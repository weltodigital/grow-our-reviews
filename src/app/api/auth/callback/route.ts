import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  // IMPORTANT: do not reassign `response` after this point. exchangeCodeForSession
  // writes the session cookies onto this exact object via the setAll callback;
  // creating a new NextResponse.redirect later would leave the cookies stranded
  // on the old object and the browser would receive a cookie-less redirect.
  // To change the destination after we've inspected the user's profile, mutate
  // response.headers.set('Location', ...) in place.
  const response = NextResponse.redirect(requestUrl.origin + next)

  if (!code) {
    return response
  }

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

  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    console.error('Auth callback error:', error)

    // PKCE error path — the exchange failed before any cookies were written,
    // so it's safe to return a fresh response here.
    if (error.message.includes('PKCE code verifier') || error.message.includes('code_verifier')) {
      console.log('PKCE error detected - likely cross-device signup. Redirecting to client-side handler.')
      return NextResponse.redirect(requestUrl.origin + `/confirm-signup?code=${code}&next=${encodeURIComponent(next)}`)
    }

    response.headers.set('Location', requestUrl.origin + '/login?error=auth_callback_error')
    return response
  }

  if (data.user && !next.includes('/reset-password')) {
    // Regular auth flow - check onboarding/billing status to pick the
    // post-confirmation destination.
    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, google_review_url, stripe_customer_id, subscription_status, created_at')
      .eq('id', data.user.id)
      .single() as { data: { business_name: string | null; google_review_url: string | null; stripe_customer_id: string | null; subscription_status: string | null; created_at: string } | null }

    console.log('Auth callback debug:', {
      userId: data.user.id,
      next,
      profile: profile ? {
        hasBusinessName: !!profile.business_name,
        hasGoogleUrl: !!profile.google_review_url,
        hasStripeId: !!profile.stripe_customer_id,
        subscriptionStatus: profile.subscription_status,
        createdAt: profile.created_at,
      } : null
    })

    let finalPath = next
    if (!profile || !profile.business_name) {
      console.log('No profile or incomplete onboarding - redirecting to onboarding')
      finalPath = '/onboarding'
    } else if (!profile.stripe_customer_id || !profile.subscription_status || !['active', 'trialing', 'cancelled'].includes(profile.subscription_status)) {
      console.log('No active subscription - redirecting to billing setup')
      finalPath = '/billing/setup'
    }

    response.headers.set('Location', requestUrl.origin + finalPath)
  }

  return response
}