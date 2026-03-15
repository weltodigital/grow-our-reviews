import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/reset-password/confirm'

  if (!code) {
    console.error('No auth code provided')
    return NextResponse.redirect(`${origin}/reset-password?error=No auth code provided`)
  }

  console.log('Server-side auth callback - processing code:', code)

  let response = NextResponse.redirect(`${origin}${next}`)

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
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('Server-side code exchange error:', error)
      return NextResponse.redirect(`${origin}/reset-password?error=${encodeURIComponent(error.message)}`)
    }

    if (data.session) {
      console.log('Server-side code exchange successful for user:', data.session.user?.email)
      return response
    } else {
      console.error('No session created after server-side code exchange')
      return NextResponse.redirect(`${origin}/reset-password?error=No session created`)
    }
  } catch (err) {
    console.error('Unexpected error in server-side code exchange:', err)
    return NextResponse.redirect(`${origin}/reset-password?error=${encodeURIComponent('Server error: ' + (err as Error).message)}`)
  }
}