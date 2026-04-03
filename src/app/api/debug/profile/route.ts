import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { protectAdminEndpoint } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  // SECURITY: Protect debug endpoint - admin access only
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

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

    // Get all profiles with recent activity (admin view)
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      profiles,
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