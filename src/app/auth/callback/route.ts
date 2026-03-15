import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const origin = requestUrl.origin
  const redirectTo = requestUrl.searchParams.get('next') ?? '/reset-password/confirm'

  if (!code) {
    console.error('No auth code provided')
    return NextResponse.redirect(`${origin}/reset-password?error=No auth code provided`)
  }

  console.log('Server auth callback - processing code')

  let response = NextResponse.redirect(`${origin}${redirectTo}`)

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

  try {
    // Try to exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Server auth exchange error:', error.message)

      // If it's a PKCE error, try a different approach
      if (error.message.includes('PKCE code verifier')) {
        console.log('PKCE error detected, attempting direct redirect to allow client-side handling')
        // Redirect to confirm page with the code, let client handle it
        return NextResponse.redirect(`${origin}/reset-password/confirm?code=${code}`)
      }

      return NextResponse.redirect(`${origin}/reset-password?error=${encodeURIComponent(error.message)}`)
    }

    if (data.session) {
      console.log('Server auth exchange successful for:', data.session.user?.email)
      return response
    } else {
      console.error('No session created after server auth exchange')
      return NextResponse.redirect(`${origin}/reset-password?error=No session created`)
    }
  } catch (err) {
    console.error('Unexpected error in server auth exchange:', err)
    return NextResponse.redirect(`${origin}/reset-password?error=${encodeURIComponent('Unexpected error')}`)
  }
}