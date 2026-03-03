import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const next = requestUrl.searchParams.get('next') || '/dashboard'

  let response = NextResponse.redirect(requestUrl.origin + next)

  if (code) {
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
      return NextResponse.redirect(requestUrl.origin + '/login?error=auth_callback_error')
    }

    if (data.user) {
      // Check if user has completed onboarding and billing setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('business_name, stripe_customer_id, created_at')
        .eq('id', data.user.id)
        .single() as { data: { business_name: string | null; stripe_customer_id: string | null; created_at: string } | null }

      // Check if the redirect is explicitly requesting billing setup (from signup flow)
      const isBillingSetupRequest = next.includes('/billing/setup')

      // Consider a user "new" if:
      // 1. No profile exists yet, OR
      // 2. Profile was created recently (within last hour) AND has no stripe customer ID, OR
      // 3. The redirect explicitly requests billing setup
      const isNewUser = !profile ||
        (profile && new Date(profile.created_at).getTime() > (Date.now() - 60 * 60 * 1000) && !profile.stripe_customer_id) ||
        isBillingSetupRequest

      if (!profile) {
        // No profile at all - this is definitely a new user, start with billing
        response = NextResponse.redirect(requestUrl.origin + '/billing/setup')
      } else if (isNewUser && !profile.stripe_customer_id) {
        // New user without billing setup - redirect to billing
        response = NextResponse.redirect(requestUrl.origin + '/billing/setup')
      } else if (!profile.business_name) {
        // Existing user or new user with billing - check for business info
        response = NextResponse.redirect(requestUrl.origin + '/onboarding')
      }
      // Otherwise go to the requested destination (default is /dashboard)
    }
  }

  return response
}