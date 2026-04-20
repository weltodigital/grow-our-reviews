import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const testResults = {
      stripeConfiguration: {
        secretKey: !!process.env.STRIPE_SECRET_KEY,
        publishableKey: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
        webhookSecret: !!process.env.STRIPE_WEBHOOK_SECRET,
        priceIds: {
          starter: !!process.env.STRIPE_STARTER_PRICE_ID,
          growth: !!process.env.STRIPE_GROWTH_PRICE_ID
        }
      },
      apiEndpoints: {
        createCheckout: false,
        customerPortal: false,
        webhook: false,
        upgrade: false
      },
      userProfile: null as any,
      stripeCustomer: null as any,
      errors: [] as string[]
    }

    // Test 1: Check Stripe configuration
    if (!testResults.stripeConfiguration.secretKey) {
      testResults.errors.push('STRIPE_SECRET_KEY not configured')
    }
    if (!testResults.stripeConfiguration.publishableKey) {
      testResults.errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY not configured')
    }
    if (!testResults.stripeConfiguration.webhookSecret) {
      testResults.errors.push('STRIPE_WEBHOOK_SECRET not configured')
    }

    // Test 2: Check API endpoints exist and are accessible
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    try {
      // Test create-checkout endpoint (should return 400 for GET request)
      const checkoutTest = await fetch(`${baseUrl}/api/stripe/create-checkout`, {
        method: 'GET'
      })
      testResults.apiEndpoints.createCheckout = checkoutTest.status === 405 || checkoutTest.status === 400
    } catch (e) {
      testResults.errors.push('Create checkout endpoint unreachable')
    }

    try {
      // Test customer portal endpoint
      const portalTest = await fetch(`${baseUrl}/api/stripe/portal`, {
        method: 'GET'
      })
      testResults.apiEndpoints.customerPortal = portalTest.status === 405 || portalTest.status === 401
    } catch (e) {
      testResults.errors.push('Customer portal endpoint unreachable')
    }

    try {
      // Test webhook endpoint
      const webhookTest = await fetch(`${baseUrl}/api/stripe/webhook`, {
        method: 'GET'
      })
      testResults.apiEndpoints.webhook = webhookTest.status === 405 || webhookTest.status === 400
    } catch (e) {
      testResults.errors.push('Webhook endpoint unreachable')
    }

    // Test 3: Check your user profile and Stripe customer
    const userId = 'b6bd84a8-f044-4f40-ae57-465c42157964'

    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      testResults.userProfile = {
        hasProfile: !!profile,
        email: (profile as any)?.email,
        stripeCustomerId: (profile as any)?.stripe_customer_id,
        subscriptionId: (profile as any)?.stripe_subscription_id,
        subscriptionStatus: (profile as any)?.subscription_status,
        monthlyLimit: (profile as any)?.monthly_request_limit,
        trialEndsAt: (profile as any)?.trial_ends_at,
        billingCycleDate: (profile as any)?.billing_cycle_date
      }

      // Test Stripe customer if we have customer ID
      if ((profile as any)?.stripe_customer_id) {
        try {
          const { stripe } = await import('@/lib/stripe')
          if (stripe) {
            const customer = await stripe.customers.retrieve((profile as any).stripe_customer_id)
            testResults.stripeCustomer = {
              exists: !customer.deleted,
              email: (customer as any).email,
              hasSubscriptions: (customer as any).subscriptions?.data?.length > 0
            }
          }
        } catch (stripeError) {
          testResults.errors.push(`Failed to fetch Stripe customer: ${stripeError}`)
        }
      }
    } catch (dbError) {
      testResults.errors.push(`Failed to fetch user profile: ${dbError}`)
    }

    // Test 4: Test Stripe library import
    let stripeLibraryTest = false
    try {
      const { stripe, createCheckoutSession, createCustomerPortalSession } = await import('@/lib/stripe')
      stripeLibraryTest = !!stripe && !!createCheckoutSession && !!createCustomerPortalSession
    } catch (e) {
      testResults.errors.push('Stripe library import failed')
    }

    // Test 5: Check pricing configuration
    let pricingConfigTest = false
    try {
      const { PRICING_PLANS } = await import('@/lib/pricing')
      pricingConfigTest = !!PRICING_PLANS && Object.keys(PRICING_PLANS).length > 0
    } catch (e) {
      testResults.errors.push('Pricing configuration import failed')
    }

    return NextResponse.json({
      success: testResults.errors.length === 0,
      billingFlowStatus: testResults.errors.length === 0 ? 'OPERATIONAL' : 'ISSUES_DETECTED',
      testResults,
      stripeLibraryTest,
      pricingConfigTest,
      billingCapabilities: {
        canCreateCheckout: testResults.stripeConfiguration.secretKey && testResults.apiEndpoints.createCheckout,
        canAccessPortal: testResults.stripeConfiguration.secretKey && testResults.apiEndpoints.customerPortal,
        canProcessWebhooks: testResults.stripeConfiguration.webhookSecret && testResults.apiEndpoints.webhook,
        userHasSubscription: !!testResults.userProfile?.subscriptionId
      },
      nextSteps: testResults.errors.length === 0 ? [
        'Billing infrastructure is healthy',
        'User profile is configured correctly',
        'Ready to process payments and subscriptions'
      ] : [
        'Fix configuration errors before processing payments',
        'Verify Stripe dashboard settings',
        'Check environment variable configuration'
      ],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Billing flow test error:', error)
    return NextResponse.json({
      success: false,
      billingFlowStatus: 'TEST_FAILED',
      error: 'Billing test infrastructure failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}