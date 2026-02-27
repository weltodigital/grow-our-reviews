import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  const { pathname } = request.nextUrl

  // Public routes that don't need authentication
  const publicRoutes = [
    '/',
    '/login',
    '/signup',
    '/pricing',
    '/reset-password',
    '/forgot-password',
  ]

  // Check if this is a public route, review route, or API route
  const isPublicRoute = publicRoutes.some(route => pathname === route) ||
    pathname.startsWith('/review/') ||
    pathname.startsWith('/api/cron/') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/twilio/webhook')

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  // If accessing a protected route without auth, redirect to login
  if (!isPublicRoute && !user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // If authenticated user tries to access auth pages, redirect to dashboard
  if (user && (pathname === '/login' || pathname === '/signup')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // If authenticated user accesses dashboard but has no profile, redirect to onboarding
  if (user && pathname.startsWith('/dashboard') && pathname !== '/onboarding') {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', user.id)
      .single() as { data: { business_name: string | null } | null, error: any }

    if (error || !profile?.business_name) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}