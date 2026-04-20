import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  return await handleProfileDebug(request)
}

export async function POST(request: NextRequest) {
  return await handleProfileDebug(request)
}

async function handleProfileDebug(request: NextRequest) {
  try {
    let response = NextResponse.json({ temp: true })

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

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🔧 Profile debug for user:', user.id)

    // Check profile with the exact same query used in webhook
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, business_name, stripe_customer_id, stripe_subscription_id, subscription_status, monthly_request_limit, trial_ends_at')
      .eq('id', user.id)
      .single()

    console.log('🔧 Profile query result:', { profile, profileError })

    // Test the exact condition used in webhook
    const hasEmailForWelcome = (profile as any)?.email
    const hasBusinessName = (profile as any)?.business_name

    // Check if business_name exists but is empty/null
    const businessNameStatus = hasBusinessName ? 'exists' :
      ((profile as any)?.business_name === '' ? 'empty_string' :
       (profile as any)?.business_name === null ? 'null' : 'undefined')

    return NextResponse.json({
      success: true,
      debug: {
        userId: user.id,
        profileFound: !!profile,
        profileError: profileError,
        fullProfile: profile,
        webhookConditions: {
          hasEmailForWelcome,
          hasBusinessName,
          businessNameStatus,
          wouldSendEmail: hasEmailForWelcome && hasBusinessName
        },
        environment: {
          hasResendKey: !!process.env.RESEND_API_KEY,
          hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Profile debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}