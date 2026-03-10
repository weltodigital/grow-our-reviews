import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // Check edwelton0@gmail.com profile
    const { data: profile, error: profileError } = await (supabase as any)
      .from('auth.users')
      .select('id, email')
      .eq('email', 'edwelton0@gmail.com')
      .single()

    if (profileError || !profile) {
      return NextResponse.json({
        error: 'User not found',
        details: profileError?.message
      }, { status: 404 })
    }

    // Get profile data
    const { data: profileData, error: profileDataError } = await (supabase as any)
      .from('profiles')
      .select('*')
      .eq('id', profile.id)
      .single()

    return NextResponse.json({
      message: 'User profile check',
      user_id: profile.id,
      email: profile.email,
      profile_data: profileData,
      profile_error: profileDataError?.message || null,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({
      error: 'Profile check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}