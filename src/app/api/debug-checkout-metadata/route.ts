import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Import Stripe dynamically
    const { stripe } = await import('@/lib/stripe')
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }

    // Get the most recent checkout sessions for your customer
    const sessions = await stripe.checkout.sessions.list({
      customer: 'cus_UMk2nJv4wwhhtf',
      limit: 5
    })

    console.log('🔧 Recent checkout sessions:', sessions.data)

    // Analyze each session's metadata
    const sessionAnalysis = sessions.data.map(session => ({
      sessionId: session.id,
      mode: session.mode,
      created: new Date(session.created * 1000).toISOString(),
      status: session.status,
      metadata: session.metadata,
      hasUserId: !!session.metadata?.userId,
      subscriptionId: session.subscription,
      webhookWouldProcess: session.mode === 'subscription' && !!session.metadata?.userId,
      customerEmail: session.customer_details?.email
    }))

    // Also check the actual subscription metadata
    let subscriptionMetadata = null
    try {
      const subscription = await stripe.subscriptions.retrieve('sub_1TO0YrK4siLpHZ95pI01uRBK')
      subscriptionMetadata = {
        subscriptionId: subscription.id,
        metadata: subscription.metadata,
        hasUserId: !!subscription.metadata?.userId
      }
    } catch (e) {
      subscriptionMetadata = { error: 'Could not fetch subscription' }
    }

    return NextResponse.json({
      success: true,
      debug: {
        checkoutSessions: sessionAnalysis,
        subscriptionMetadata,
        analysis: {
          totalSessions: sessions.data.length,
          sessionsWithUserId: sessionAnalysis.filter(s => s.hasUserId).length,
          sessionsThatWouldProcessWebhook: sessionAnalysis.filter(s => s.webhookWouldProcess).length,
          mostRecentSession: sessionAnalysis[0] || null,
          likelyIssue: sessionAnalysis.length > 0 && !sessionAnalysis[0]?.hasUserId ?
            'Most recent checkout session is missing userId in metadata' :
            'Sessions appear to have correct metadata'
        }
      },
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Checkout metadata debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}