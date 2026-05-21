import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

// Supabase SSR token-refresh middleware.
//
// Without this, an expired access token is never silently renewed on a
// server-side request — server actions and server components then see a
// logged-in user as "not authenticated" (e.g. the onboarding "Complete
// Setup" action). This refreshes the session on every matched request and
// writes the rotated cookies back so the route/action runs with a fresh token.
//
// Keep this minimal: do NOT add logic between createServerClient and
// getUser(), and do NOT issue redirects here — that keeps the blast radius
// small and avoids redirect loops.
export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          )
        },
      },
    },
  )

  // Triggers a token refresh when the access token has expired and rewrites
  // the auth cookies. Must run with nothing between it and createServerClient.
  await supabase.auth.getUser()

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Run on every path except static assets and image files — those never
     * need a session refresh and middleware on them just wastes work.
     */
    '/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.*\\.xml|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
}
