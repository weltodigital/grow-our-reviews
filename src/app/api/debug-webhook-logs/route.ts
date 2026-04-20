import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    // Use service role key to check webhook logs
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Try to get recent webhook events from the database
    let webhookEvents = null
    try {
      const { data: events } = await supabase
        .from('webhook_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)

      webhookEvents = events
    } catch (e) {
      webhookEvents = 'Table does not exist or no access'
    }

    // Try to get recent Stripe events
    let stripeEvents = []
    try {
      const { stripe } = await import('@/lib/stripe')
      if (stripe) {
        const events = await stripe.events.list({
          limit: 5,
          types: ['checkout.session.completed']
        })
        stripeEvents = events.data.map(event => ({
          id: event.id,
          type: event.type,
          created: new Date(event.created * 1000).toISOString(),
          object: event.data.object.id
        }))
      }
    } catch (e) {
      stripeEvents = ['Failed to fetch Stripe events']
    }

    // Get the latest checkout session that should have triggered the webhook
    const latestSessionId = 'cs_live_b1e3ieMTNaaRgGJdChaQCE9HJw4Q9eUFJfvpiX2eTQksloEIwRJzWRPZtZ'
    let sessionDetails = null
    try {
      const { stripe } = await import('@/lib/stripe')
      if (stripe) {
        const session = await stripe.checkout.sessions.retrieve(latestSessionId)
        sessionDetails = {
          id: session.id,
          mode: session.mode,
          status: session.status,
          customer: session.customer,
          subscription: session.subscription,
          metadata: session.metadata,
          customer_details: session.customer_details
        }
      }
    } catch (e) {
      sessionDetails = 'Failed to fetch session details'
    }

    // Test webhook endpoint directly
    let webhookEndpointTest = null
    try {
      const testResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/stripe/webhook`, {
        method: 'GET'
      })
      webhookEndpointTest = {
        status: testResponse.status,
        accessible: testResponse.status === 405 || testResponse.status === 200
      }
    } catch (e) {
      webhookEndpointTest = 'Endpoint not accessible'
    }

    return NextResponse.json({
      success: true,
      webhookAnalysis: {
        webhookEvents,
        recentStripeEvents: stripeEvents,
        latestSessionDetails: sessionDetails,
        webhookEndpointTest,
        diagnosis: {
          webhookReceivingEvents: 'Yes - Stripe shows 200 OK responses',
          webhookProcessingEvents: webhookEvents && Array.isArray(webhookEvents) && webhookEvents.length > 0 ?
            'Check webhook_events table for processing status' : 'No webhook events recorded in database',
          likelyIssue: 'Webhook receives events but fails during processing - check logs for specific error'
        }
      },
      nextSteps: [
        'Check server logs for webhook processing errors',
        'Verify userId is in the checkout session metadata',
        'Test webhook processing logic with the actual session data',
        'Check if database write permissions are working'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Webhook logs debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}