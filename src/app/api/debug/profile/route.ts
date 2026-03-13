import { createServerSupabase } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
      profile,
      stripeConfig: {
        starter: {
          monthlyRequestLimit: 150,
        },
        growth: {
          monthlyRequestLimit: 300,
        }
      }
    })

  } catch (error) {
    console.error('Debug profile error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}