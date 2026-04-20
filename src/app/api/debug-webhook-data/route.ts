import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to check webhook logs table if it exists
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Check if there's a webhook logs table
    let webhookLogs = null
    try {
      const { data: logs } = await supabase
        .from('webhook_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      webhookLogs = logs
    } catch (e) {
      // Table might not exist
      webhookLogs = 'Table does not exist'
    }

    // Get recent checkout sessions from your Stripe customer
    const customerId = 'cus_UMk2nJv4wwhhtf' // From your profile debug data

    // Check what happens when we create a mock checkout.session.completed event
    const mockCheckoutSession = {
      id: 'cs_test_mock',
      mode: 'subscription',
      customer: customerId,
      subscription: 'sub_1TO0YrK4siLpHZ95pI01uRBK', // Your actual subscription ID
      customer_details: {
        email: 'edwelton0@gmail.com'
      },
      metadata: {
        userId: 'b6bd84a8-f044-4f40-ae57-465c42157964'
      }
    }

    console.log('🔧 Mock checkout session:', mockCheckoutSession)

    // Test the webhook conditions that might prevent email sending
    const conditions = {
      sessionMode: mockCheckoutSession.mode === 'subscription',
      hasUserId: !!mockCheckoutSession.metadata?.userId,
      hasSubscription: !!mockCheckoutSession.subscription,
      hasCustomerEmail: !!mockCheckoutSession.customer_details?.email,
      wouldProcessWebhook: mockCheckoutSession.mode === 'subscription' &&
                          !!mockCheckoutSession.metadata?.userId &&
                          !!mockCheckoutSession.subscription
    }

    return NextResponse.json({
      success: true,
      debug: {
        yourActualData: {
          stripeCustomerId: customerId,
          userId: 'b6bd84a8-f044-4f40-ae57-465c42157964',
          subscriptionId: 'sub_1TO0YrK4siLpHZ95pI01uRBK'
        },
        mockCheckoutSession,
        webhookConditions: conditions,
        webhookLogs: webhookLogs,
        analysis: {
          likelyIssue: !conditions.wouldProcessWebhook ? 'Webhook conditions not met' :
                      'Webhook should have processed - possible race condition or error in webhook logic',
          recommendations: [
            conditions.sessionMode ? '✅ Session mode is subscription' : '❌ Session mode is not subscription',
            conditions.hasUserId ? '✅ userId exists in metadata' : '❌ userId missing from session metadata',
            conditions.hasSubscription ? '✅ Subscription ID exists' : '❌ Subscription ID missing',
            conditions.wouldProcessWebhook ? '✅ All webhook conditions met' : '❌ Webhook would not process'
          ]
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook data debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}