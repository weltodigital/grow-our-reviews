import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { sendWelcomeEmail } from '@/lib/resend'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

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
      email: profile.email,
      businessName: profile.business_name
    })

    // Check if Resend is configured
    console.log('🔧 RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)

    // Send welcome email
    const result = await sendWelcomeEmail(profile.email, profile.business_name)

    console.log('🔧 Welcome email result:', result)

    return NextResponse.json({
      success: result.success,
      message: result.success
        ? `Welcome email sent successfully to ${profile.email}`
        : `Failed to send welcome email: ${result.error}`,
      userInfo: {
        email: profile.email,
        businessName: profile.business_name
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