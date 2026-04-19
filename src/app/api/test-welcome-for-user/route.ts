import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  return await handleWelcomeEmailTest(request)
}

export async function POST(request: NextRequest) {
  return await handleWelcomeEmailTest(request)
}

async function handleWelcomeEmailTest(request: NextRequest) {
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

    // Get user's profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, business_name')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    console.log('🔧 Manual welcome email test for user:', {
      userId: user.id,
      email: (profile as any).email,
      businessName: (profile as any).business_name
    })

    // Check if Resend is configured
    console.log('🔧 RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)

    // Send welcome email
    const result = await sendWelcomeEmail((profile as any).email, (profile as any).business_name)

    console.log('🔧 Welcome email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Welcome email sent successfully to ${(profile as any).email}`
        : `Failed to send welcome email: ${result.error}`,
      userInfo: {
        email: (profile as any).email,
        businessName: (profile as any).business_name
      },
      emailResult: result,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Manual welcome email test error:', error)
    return NextResponse.json({
      success: false,
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}