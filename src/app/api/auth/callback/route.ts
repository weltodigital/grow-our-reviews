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

      // Log for debugging
      console.log('Auth callback debug:', {
        userId: data.user.id,
        next,
        profile: profile ? {
          hasBusinessName: !!profile.business_name,
          hasStripeId: !!profile.stripe_customer_id,
          createdAt: profile.created_at,
        } : null
      })

      // Check if the redirect is explicitly requesting billing setup (from signup flow)
      const isBillingSetupRequest = next.includes('/billing/setup')

      // New flow: Onboarding first, then billing
      if (!profile) {
        // No profile at all - this is definitely a new user, start with onboarding
        console.log('No profile found - redirecting to onboarding')
        response = NextResponse.redirect(requestUrl.origin + '/onboarding')
      } else if (!profile.business_name) {
        // No business info - go to onboarding first
        console.log('No business name - redirecting to onboarding')
        response = NextResponse.redirect(requestUrl.origin + '/onboarding')
      } else if (!profile.stripe_customer_id) {
        // Has business info but no billing - go to billing setup
        console.log('No stripe customer ID - redirecting to billing setup')
        response = NextResponse.redirect(requestUrl.origin + '/billing/setup')
      }
      // Otherwise go to the requested destination (default is /dashboard)
    }
  }

  return response
}