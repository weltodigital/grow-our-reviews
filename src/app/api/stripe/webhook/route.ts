import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, getPriceInfo } from '@/lib/stripe'
import { PRICING_PLANS, getPlanByLimit, calculateTrialEndDate } from '@/lib/pricing'
import { calculateBillingCycleDate } from '@/lib/billing-cycle'
import type { Database } from '@/types/database'
import Stripe from 'stripe'

// Helper function to log webhook events with correlation ID
function logWebhookEvent(correlationId: string, level: 'info' | 'error', message: string, data?: any) {
  const logData = { correlationId, message, ...data }
  if (level === 'error') {
    console.error(logData)
  } else {
    console.log(logData)
  }
}

// Helper function to record webhook event
async function recordWebhookEvent(
  supabase: any,
  stripeEventId: string,
  eventType: string,
  status: 'success' | 'failed' | 'skipped_duplicate',
  payload: any,
  errorMessage?: string
) {
  try {
    await supabase
      .from('webhook_events')
      .insert({
        stripe_event_id: stripeEventId,
        event_type: eventType,
        status,
        error_message: errorMessage,
        payload
      })
  } catch (error) {
    console.error('Failed to record webhook event:', error)
  }
}

export async function POST(request: NextRequest) {
  const correlationId = `wh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

  // Log request details for debugging 307 redirects
  console.log('Webhook request details:', {
    correlationId,
    url: request.url,
    method: request.method,
    headers: {
      host: request.headers.get('host'),
      'user-agent': request.headers.get('user-agent'),
      'content-type': request.headers.get('content-type'),
      'stripe-signature': request.headers.get('stripe-signature') ? 'present' : 'missing',
      'x-forwarded-proto': request.headers.get('x-forwarded-proto'),
      'x-forwarded-host': request.headers.get('x-forwarded-host')
    },
    timestamp: new Date().toISOString()
  })

  try {
    const body = Buffer.from(await request.arrayBuffer())
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      logWebhookEvent(correlationId, 'error', 'No signature provided')
      return NextResponse.json({ received: true }, { status: 200 }) // Return 200 to prevent retries
    }

    // Construct and verify webhook event
    let event
    try {
      event = constructWebhookEvent(body, signature)
    } catch (error) {
      logWebhookEvent(correlationId, 'error', 'Invalid webhook signature', { error: (error as any).message })
      return NextResponse.json({ received: true }, { status: 200 }) // Return 200 to prevent retries
    }

    logWebhookEvent(correlationId, 'info', 'Webhook received', {
      eventId: event.id,
      eventType: event.type
    })

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for webhook operations
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )

    // Check for duplicate event (idempotency)
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('stripe_event_id', event.id)
      .single()

    if (existingEvent) {
      logWebhookEvent(correlationId, 'info', 'Duplicate event skipped', { eventId: event.id })
      await recordWebhookEvent(supabase, event.id, event.type, 'skipped_duplicate', event)
      return NextResponse.json({ received: true }, { status: 200 })
    }

    // Process the webhook event
    let processingError: Error | null = null

    try {
      await processWebhookEvent(event, supabase, correlationId)
      await recordWebhookEvent(supabase, event.id, event.type, 'success', event)
      logWebhookEvent(correlationId, 'info', 'Webhook processed successfully', {
        eventId: event.id,
        eventType: event.type
      })

      // Track health metrics
      try {
        const { healthMetrics } = await import('@/lib/health-metrics')
        await healthMetrics.increment('webhooks_processed')
      } catch (healthError) {
        console.error('Failed to track webhook health metrics:', healthError)
      }

    } catch (error) {
      processingError = error as Error
      logWebhookEvent(correlationId, 'error', 'Webhook processing failed', {
        eventId: event.id,
        eventType: event.type,
        error: (error as any).message
      })
      await recordWebhookEvent(supabase, event.id, event.type, 'failed', event, (error as any).message)

      // Track failed webhook
      try {
        const { healthMetrics } = await import('@/lib/health-metrics')
        await healthMetrics.increment('webhooks_failed')
      } catch (healthError) {
        console.error('Failed to track webhook failure metrics:', healthError)
      }
    }

    // Always return 200 to prevent Stripe retries
    return NextResponse.json({ received: true }, { status: 200 })

  } catch (error: any) {
    logWebhookEvent(correlationId, 'error', 'Webhook handler failed', { error: error.message })
    // Always return 200 to prevent Stripe retries
    return NextResponse.json({ received: true }, { status: 200 })
  }
}

// Separate function for processing webhook events
async function processWebhookEvent(event: any, supabase: any, correlationId: string) {
  switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        logWebhookEvent(correlationId, 'info', 'Processing checkout completion', {
          sessionId: session.id,
          mode: session.mode,
          customerId: session.customer
        })

        if (session.mode === 'subscription') {
          const { stripe } = await import('@/lib/stripe')
          if (!stripe) {
            throw new Error('Stripe is not configured')
          }

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

          const userId = session.metadata?.userId
          if (!userId) {
            throw new Error('No userId in session metadata')
          }

          logWebhookEvent(correlationId, 'info', 'Processing subscription for user', {
            userId,
            subscriptionId: subscription.id
          })

          // Get price info to determine plan
          const priceId = subscription.items.data[0]?.price.id
          const priceInfo = getPriceInfo(priceId)

          console.log('Webhook processing checkout:', {
            userId,
            priceId,
            priceInfo,
            subscriptionStatus: subscription.status,
            subscriptionId: subscription.id,
            customerId: subscription.customer
          })

          if (!priceInfo) {
            throw new Error(`Unknown price ID: ${priceId}`)
          }

          // Calculate trial end date
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : calculateTrialEndDate()

          // Check if this is an upgrade (user already has stripe_customer_id)
          const { data: existingProfile } = await (supabase as any)
            .from('profiles')
            .select('stripe_customer_id, stripe_subscription_id')
            .eq('id', userId)
            .single()

          const updateData: any = {
            email: session.customer_details?.email || '',
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            monthly_request_limit: priceInfo.monthlyRequestLimit,
            trial_ends_at: trialEnd.toISOString(),
            updated_at: new Date().toISOString(),
          }

          // Only update stripe_customer_id if user doesn't have one (prevents overwriting existing customer)
          if (!existingProfile?.stripe_customer_id) {
            updateData.stripe_customer_id = session.customer as string
          }

          // Set billing cycle date if user doesn't have one
          if (!existingProfile || !existingProfile.billing_cycle_date) {
            updateData.billing_cycle_date = calculateBillingCycleDate(new Date())
          }

          console.log('Updating profile with data:', updateData)

          // Atomic operation: Update or create profile
          // First try update, then create if needed
          const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update(updateData)
            .eq('id', userId)

          // If update failed because profile doesn't exist, create it
          if (updateError && updateError.code === 'PGRST116') {
            const insertData = {
              id: userId,
              email: session.customer_details?.email || '',
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              monthly_request_limit: priceInfo.monthlyRequestLimit,
              trial_ends_at: trialEnd.toISOString(),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            }

            logWebhookEvent(correlationId, 'info', 'Creating new profile', { userId, insertData })

            const { error: insertError } = await (supabase as any)
              .from('profiles')
              .insert(insertData)

            if (insertError) {
              throw new Error(`Failed to create profile: ${insertError.message}`)
            }
            logWebhookEvent(correlationId, 'info', 'Successfully created new profile', { userId })
          } else if (updateError) {
            throw new Error(`Failed to update profile: ${updateError.message}`)
          } else {
            logWebhookEvent(correlationId, 'info', 'Successfully updated existing profile', { userId })
          }

          console.log(`Subscription created for user ${userId}:`, {
            subscriptionId: subscription.id,
            status: subscription.status,
            limit: priceInfo.monthlyRequestLimit,
            trialEnd: trialEnd.toISOString(),
          })

          // Track trial start in health metrics
          try {
            const { healthMetrics } = await import('@/lib/health-metrics')
            await healthMetrics.increment('trials_started')
          } catch (healthError) {
            console.error('Failed to track trial start:', healthError)
          }

          // Send welcome email first (when user officially starts trial)
          try {
              const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('email, business_name')
                .eq('id', userId)
                .single()

              if (profile?.email) {
                console.log('Sending welcome email after successful checkout to:', profile.email)

                // Send emails directly instead of via API calls (bypass 405 routing issues)
                try {
                  console.log('🔧 Debug: RESEND_API_KEY configured:', !!process.env.RESEND_API_KEY)
                  console.log('🔧 Debug: Importing email functions...')

                  const { sendWelcomeEmail, sendSubscriptionConfirmationEmail } = await import('@/lib/resend')

                  console.log('🔧 Debug: Email functions imported successfully')
                  console.log('🔧 Debug: Attempting to send welcome email to:', profile.email)

                  // Send welcome email directly
                  const welcomeResult = await sendWelcomeEmail(profile.email, profile.business_name)
                  console.log('🔧 Debug: Welcome email result:', welcomeResult)

                  if (welcomeResult.success) {
                    console.log('✅ Welcome email sent successfully')
                  } else {
                    console.error('❌ Welcome email failed:', welcomeResult.error)
                  }

                  // Send subscription confirmation email directly
                  const planName = priceInfo.monthlyRequestLimit === 150 ? 'Starter' : 'Growth'
                  console.log('🔧 Debug: Attempting to send subscription email for plan:', planName)

                  const subscriptionResult = await sendSubscriptionConfirmationEmail(
                    profile.email,
                    profile.business_name,
                    planName
                  )
                  console.log('🔧 Debug: Subscription email result:', subscriptionResult)

                  if (subscriptionResult.success) {
                    console.log('✅ Subscription confirmation email sent successfully')
                  } else {
                    console.error('❌ Subscription confirmation email failed:', subscriptionResult.error)
                  }
                } catch (error) {
                  console.error('💥 Email sending failed with error:', error)
                  console.error('💥 Error stack:', (error as any)?.stack)
                }
              }
            } catch (error) {
              logWebhookEvent(correlationId, 'error', 'Failed to send emails', {
                userId,
                error: (error as any).message
              })
              // Don't throw - email failures shouldn't fail the webhook
            }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId
        let profile = null

        logWebhookEvent(correlationId, 'info', 'Processing subscription update', {
          subscriptionId: subscription.id,
          status: subscription.status,
          userId
        })

        if (!userId) {
          // Try to find user by subscription ID
          const { data: foundProfile } = await (supabase as any)
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (!foundProfile) {
            throw new Error(`No user found for subscription: ${subscription.id}`)
          }
          profile = foundProfile
        }

        // Get price info to determine plan limits
        const priceId = subscription.items.data[0]?.price.id
        const priceInfo = getPriceInfo(priceId)

        console.log('Webhook processing subscription:', {
          subscriptionId: subscription.id,
          priceId,
          priceInfo,
          currentProfile: profile,
          customerId: subscription.customer
        })

        const updateData: any = {
          subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        }

        if (priceInfo) {
          updateData.monthly_request_limit = priceInfo.monthlyRequestLimit
          console.log('Setting monthly_request_limit to:', priceInfo.monthlyRequestLimit)
        } else {
          console.warn('No price info found for priceId:', priceId)
        }

        if (subscription.trial_end) {
          updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString()
        }

        // Handle subscription period end and cancellation logic
        if ((subscription as any).current_period_end) {
          updateData.current_period_end = new Date((subscription as any).current_period_end * 1000).toISOString()
        }

        // Track if subscription is cancelled but access continues until period end
        if ((subscription as any).cancel_at_period_end) {
          updateData.cancelled_at_period_end = true
          logWebhookEvent(correlationId, 'info', 'Subscription cancelled at period end', {
            subscriptionId: subscription.id,
            periodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000).toISOString() : null
          })
        } else {
          updateData.cancelled_at_period_end = false
        }

        // Update profile
        const { error: updateError } = await (supabase as any)
          .from('profiles')
          .update(updateData)
          .eq(userId ? 'id' : 'stripe_subscription_id', userId || subscription.id)

        if (updateError) {
          throw new Error(`Failed to update subscription: ${updateError.message}`)
        }

        logWebhookEvent(correlationId, 'info', 'Subscription updated successfully', {
          subscriptionId: subscription.id,
          status: subscription.status,
          limit: priceInfo?.monthlyRequestLimit
        })

        // Send upgrade confirmation email if this was a plan change
        if (priceInfo && profile?.email && subscription.status === 'active') {
          try {
            console.log('Sending upgrade confirmation email to:', profile.email)
            const { sendSubscriptionConfirmationEmail } = await import('@/lib/resend')

            const planName = priceInfo.monthlyRequestLimit === 150 ? 'Starter' : 'Growth'
            const result = await sendSubscriptionConfirmationEmail(
              profile.email,
              profile.business_name || 'there',
              planName
            )

            if (result.success) {
              console.log('✅ Upgrade confirmation email sent successfully')
            } else {
              console.error('❌ Upgrade confirmation email failed:', result.error)
            }
          } catch (error) {
            console.error('💥 Upgrade email sending failed:', error)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        logWebhookEvent(correlationId, 'info', 'Processing subscription deletion', {
          subscriptionId: subscription.id
        })

        // Update profile to cancelled status - this is final termination
        // Data is preserved, but access to new requests is cut off
        const { data: profile, error: updateError } = await (supabase as any)
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            monthly_request_limit: 0, // No more requests allowed
            cancelled_at_period_end: false, // No longer applies
            current_period_end: null, // Period has ended
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)
          .select('email, business_name')
          .single()

        if (updateError) {
          throw new Error(`Failed to update cancelled subscription: ${updateError.message}`)
        }

        logWebhookEvent(correlationId, 'info', 'Subscription cancelled successfully', {
          subscriptionId: subscription.id
        })

        // Send subscription cancellation confirmation email
        if (profile?.email) {
          try {
            await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/subscription-cancelled`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                email: profile.email,
                businessName: profile.business_name || 'there',
              }),
            })
          } catch (error) {
            logWebhookEvent(correlationId, 'error', 'Failed to send cancellation email', {
              subscriptionId: subscription.id,
              error: (error as any).message
            })
            // Don't throw - email failures shouldn't fail the webhook
          }
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        logWebhookEvent(correlationId, 'info', 'Processing payment failure', {
          invoiceId: invoice.id,
          subscriptionId
        })

        if (subscriptionId) {
          // Update subscription status to past_due
          const { data: profile, error: updateError } = await (supabase as any)
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)
            .select('email, business_name, monthly_request_limit')
            .single()

          if (updateError) {
            throw new Error(`Failed to update past_due subscription: ${updateError.message}`)
          }

          logWebhookEvent(correlationId, 'info', 'Payment failure processed', { subscriptionId })

          // Track trial failure in health metrics
          try {
            const { healthMetrics } = await import('@/lib/health-metrics')
            await healthMetrics.increment('trials_failed')
          } catch (healthError) {
            console.error('Failed to track trial failure:', healthError)
          }

          // Send payment failed email
          if (profile) {
            try {
              const retryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-GB')
              const planName = profile.monthly_request_limit === 150 ? 'Starter' : 'Growth'

              await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/payment-failed`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  email: profile.email,
                  businessName: profile.business_name,
                  planName: planName,
                  retryDate: retryDate,
                }),
              })
            } catch (error) {
              logWebhookEvent(correlationId, 'error', 'Failed to send payment failed email', {
                subscriptionId,
                error: (error as any).message
              })
              // Don't throw - email failures shouldn't fail the webhook
            }
          }
        }
        break
      }


      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice
        const subscriptionId = (invoice as any).subscription as string

        logWebhookEvent(correlationId, 'info', 'Processing payment success', {
          invoiceId: invoice.id,
          subscriptionId,
          billingReason: invoice.billing_reason
        })

        if (subscriptionId && invoice.billing_reason === 'subscription_cycle') {
          // Payment succeeded for recurring subscription
          const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (updateError) {
            throw new Error(`Failed to update paid subscription: ${updateError.message}`)
          }

          logWebhookEvent(correlationId, 'info', 'Payment success processed', { subscriptionId })

          // Track trial conversion if this was the first payment
          if (invoice.billing_reason === 'subscription_cycle') {
            try {
              const { healthMetrics } = await import('@/lib/health-metrics')
              await healthMetrics.increment('trials_converted')
            } catch (healthError) {
              console.error('Failed to track trial conversion:', healthError)
            }
          }
        }
        break
      }

      default:
        logWebhookEvent(correlationId, 'info', 'Unhandled webhook event type', {
          eventType: event.type
        })
    }
  }

// Handle other HTTP methods to prevent 405/307 errors
export async function GET(request: NextRequest) {
  console.log('Webhook GET request received:', {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  })

  return NextResponse.json({
    message: 'Stripe webhook endpoint is running',
    method: 'GET',
    timestamp: new Date().toISOString()
  }, { status: 200 })
}

export async function HEAD(request: NextRequest) {
  console.log('Webhook HEAD request received:', {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  })

  return new NextResponse(null, { status: 200 })
}

export async function OPTIONS(request: NextRequest) {
  console.log('Webhook OPTIONS request received:', {
    url: request.url,
    headers: Object.fromEntries(request.headers.entries())
  })

  return NextResponse.json({
    message: 'Stripe webhook endpoint supports POST',
    methods: ['POST', 'GET', 'HEAD', 'OPTIONS'],
    timestamp: new Date().toISOString()
  }, {
    status: 200,
    headers: {
      'Allow': 'POST, GET, HEAD, OPTIONS',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'stripe-signature, content-type'
    }
  })
}