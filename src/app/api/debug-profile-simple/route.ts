import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to bypass RLS for debugging
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get the most recently created profile (likely yours)
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, business_name, stripe_customer_id, stripe_subscription_id, subscription_status, monthly_request_limit, trial_ends_at, created_at')
      .order('created_at', { ascending: false })
      .limit(5)

    if (profilesError) {
      return NextResponse.json({
        success: false,
        error: 'Failed to fetch profiles',
        details: profilesError.message
      }, { status: 500 })
    }

    // Check each recent profile for webhook email conditions
    const profileAnalysis = profiles?.map(profile => {
      const hasEmailForWelcome = !!profile.email
      const hasBusinessName = !!profile.business_name

      return {
        userId: profile.id,
        email: profile.email,
        businessName: profile.business_name,
        stripeData: {
          customerId: profile.stripe_customer_id,
          subscriptionId: profile.stripe_subscription_id,
          status: profile.subscription_status
        },
        webhookConditions: {
          hasEmailForWelcome,
          hasBusinessName,
          wouldSendEmail: hasEmailForWelcome && hasBusinessName
        },
        businessNameStatus: hasBusinessName ? 'exists' :
          (profile.business_name === '' ? 'empty_string' :
           profile.business_name === null ? 'null' : 'undefined'),
        createdAt: profile.created_at
      }
    }) || []

    return NextResponse.json({
      success: true,
      debug: {
        totalProfilesChecked: profiles?.length || 0,
        profiles: profileAnalysis,
        environment: {
          hasResendKey: !!process.env.RESEND_API_KEY,
          hasStripeWebhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
          hasServiceRoleKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
        },
        summary: {
          profilesReadyForEmails: profileAnalysis.filter(p => p.webhookConditions.wouldSendEmail).length,
          commonIssues: {
            missingBusinessName: profileAnalysis.filter(p => !p.webhookConditions.hasBusinessName).length,
            missingEmail: profileAnalysis.filter(p => !p.webhookConditions.hasEmailForWelcome).length
          }
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Simple profile debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}