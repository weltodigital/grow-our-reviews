import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  // TEMPORARY DEBUG: Allow everything to bypass middleware
  console.log('Middleware processing:', req.nextUrl.pathname)

  // First check for API routes and static files - these should never be processed by middleware
  if (req.nextUrl.pathname.startsWith('/api') ||
      req.nextUrl.pathname.endsWith('.xml') ||
      req.nextUrl.pathname.endsWith('.txt') ||
      req.nextUrl.pathname.endsWith('.ico') ||
      req.nextUrl.pathname === '/sitemap.xml' ||
      req.nextUrl.pathname === '/robots.txt') {
    console.log('Early return for:', req.nextUrl.pathname)
    return NextResponse.next()
  }

  // Define public routes that should never require auth
  const publicRoutes = ['/blog', '/debug', '/pricing', '/privacy', '/terms', '/cookies', '/test123', '/sitemap']
  const isPublicRoute = publicRoutes.some(route => {
    return req.nextUrl.pathname.startsWith(route)
  })

  if (isPublicRoute) {
    return NextResponse.next()
  }

  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  const hostname = req.headers.get('host') || ''
  const isAppSubdomain = hostname.startsWith('app.')

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  )

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Subdomain routing logic
  const protectedPaths = ['/dashboard', '/onboarding']
  const authPaths = ['/login', '/signup', '/reset-password']
  const isProtectedPath = protectedPaths.some(path => req.nextUrl.pathname.startsWith(path))
  const isAuthPath = authPaths.some(path => req.nextUrl.pathname.startsWith(path))

  // If accessing app routes on main domain, redirect to app subdomain
  if (!isAppSubdomain && (isProtectedPath || isAuthPath) && !req.nextUrl.pathname.startsWith('/test-emails') && !req.nextUrl.pathname.startsWith('/blog')) {
    const appUrl = new URL(req.url)
    appUrl.hostname = `app.${hostname}`
    return NextResponse.redirect(appUrl)
  }

  // If accessing marketing pages on app subdomain, redirect to main domain
  if (isAppSubdomain && !isProtectedPath && !isAuthPath && req.nextUrl.pathname !== '/' && !req.nextUrl.pathname.startsWith('/api') && !req.nextUrl.pathname.startsWith('/test-emails') && !req.nextUrl.pathname.startsWith('/blog')) {
    const mainUrl = new URL(req.url)
    mainUrl.hostname = hostname.replace('app.', '')
    return NextResponse.redirect(mainUrl)
  }

  // Authentication logic - only apply on app subdomain
  if (isAppSubdomain) {
    // Redirect to login if accessing protected route without session
    if (isProtectedPath && !session) {
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Redirect to dashboard if logged in and accessing auth pages
    if (isAuthPath && session) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    }
  }

  // If accessing main domain root while logged in, redirect to app
  if (!isAppSubdomain && req.nextUrl.pathname === '/' && session) {
    const appUrl = new URL('/dashboard', req.url)
    appUrl.hostname = `app.${hostname}`
    return NextResponse.redirect(appUrl)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}