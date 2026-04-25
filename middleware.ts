import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function middleware(request: NextRequest) {
  // Define public routes that should never require auth
  const publicRoutes = ['/blog', '/pricing', '/privacy', '/terms', '/cookies', '/sitemap.xml', '/robots.txt']
  const isPublicRoute = publicRoutes.some(route => request.nextUrl.pathname.startsWith(route))

  if (isPublicRoute) {
    console.log('PUBLIC ROUTE BYPASSED:', request.nextUrl.pathname)
    return NextResponse.next()
  }

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

  // Additional public routes that don't need authentication
  const additionalPublicRoutes = [
    '/',
    '/login',
    '/signup',
    '/reset-password',
    '/forgot-password',
  ]

  // Check if this is a public route, review route, or API route
  const isAdditionalPublicRoute = additionalPublicRoutes.some(route => pathname === route) ||
    pathname.startsWith('/review/') ||
    pathname.startsWith('/reset-password/') ||
    pathname.startsWith('/auth/callback') ||
    pathname.startsWith('/api/auth/callback') ||
    pathname.startsWith('/api/cron/') ||
    pathname.startsWith('/api/stripe/webhook') ||
    pathname.startsWith('/api/twilio/webhook') ||
    pathname.startsWith('/api/feedback') ||
    pathname.startsWith('/api/emails/') ||
    pathname.startsWith('/api/business-search') ||
    pathname === '/sitemap.xml' ||
    pathname === '/robots.txt'

  // Review pages should NEVER require authentication - exit early for review routes
  if (pathname.startsWith('/review/')) {
    return response
  }

  // Get the current user
  const { data: { user } } = await supabase.auth.getUser()

  // If accessing a protected route without auth, redirect to login
  if (!isAdditionalPublicRoute && !user) {
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
     * - Static files (.xml, .txt, images, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|xml|txt)$).*)',
  ],
}