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

      // Handle PKCE errors for cross-device authentication
      if (error.message.includes('PKCE code verifier') || error.message.includes('code_verifier')) {
        console.log('PKCE error detected - likely cross-device signup. Redirecting to client-side handler.')
        // Redirect to a client-side page that can handle the code exchange
        return NextResponse.redirect(requestUrl.origin + `/auth/confirm-signup?code=${code}&next=${encodeURIComponent(next)}`)
      }

      return NextResponse.redirect(requestUrl.origin + '/login?error=auth_callback_error')
    }

    if (data.user) {
      // Check if this is a password reset flow
      const isPasswordReset = next.includes('/reset-password')

      if (isPasswordReset) {
        // For password reset, just redirect to the reset confirmation page
        console.log('Password reset flow - redirecting to:', next)
        response = NextResponse.redirect(requestUrl.origin + next)
      } else {
        // Regular auth flow - check onboarding/billing status
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name, google_review_url, stripe_customer_id, subscription_status, created_at')
          .eq('id', data.user.id)
          .single() as { data: { business_name: string | null; google_review_url: string | null; stripe_customer_id: string | null; subscription_status: string | null; created_at: string } | null }

        // Log for debugging
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

        // Determine redirect based on completion status
        if (!profile) {
          // No profile at all - this is definitely a new user, start with onboarding
          console.log('No profile found - redirecting to onboarding')
          response = NextResponse.redirect(requestUrl.origin + '/onboarding')
        } else if (!profile.business_name) {
          // Incomplete onboarding - go to onboarding first (google_review_url is optional)
          console.log('Incomplete onboarding - redirecting to onboarding')
          response = NextResponse.redirect(requestUrl.origin + '/onboarding')
        } else if (!profile.stripe_customer_id || !profile.subscription_status || !['active', 'trialing'].includes(profile.subscription_status)) {
          // Completed onboarding but no active subscription - go to billing setup
          console.log('No active subscription - redirecting to billing setup')
          response = NextResponse.redirect(requestUrl.origin + '/billing/setup')
        }
        // Otherwise go to the requested destination (default is /dashboard)
      }
    }
  }

  return response
}