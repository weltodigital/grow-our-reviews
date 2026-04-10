import { NextRequest, NextResponse } from 'next/server'
import { protectAdminEndpoint } from '@/lib/admin-auth'
import { sendWelcomeEmail, sendSubscriptionConfirmationEmail } from '@/lib/resend'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // SECURITY: Protect admin endpoint
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

  try {
    const { userId, emailType } = await request.json()

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('email, business_name, subscription_status, monthly_request_limit')
      .eq('id', userId)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const results = []

    if (emailType === 'welcome' || emailType === 'both') {
      const welcomeResult = await sendWelcomeEmail(profile.email, profile.business_name)
      results.push({
        type: 'welcome',
        success: welcomeResult.success,
        error: welcomeResult.error
      })
    }

    if (emailType === 'subscription' || emailType === 'both') {
      const planName = profile.monthly_request_limit === 300 ? 'Growth' : 'Starter'
      const subscriptionResult = await sendSubscriptionConfirmationEmail(
        profile.email,
        profile.business_name,
        planName
      )
      results.push({
        type: 'subscription',
        success: subscriptionResult.success,
        error: subscriptionResult.error
      })
    }

    return NextResponse.json({
      success: true,
      profile: {
        email: profile.email,
        businessName: profile.business_name,
        plan: profile.monthly_request_limit === 300 ? 'Growth' : 'Starter'
      },
      results
    })

  } catch (error: any) {
    console.error('Error sending missing emails:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to send emails' },
      { status: 500 }
    )
  }
}