import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { constructWebhookEvent, getPriceInfo } from '@/lib/stripe'
import { PRICING_PLANS, getPlanByLimit, calculateTrialEndDate } from '@/lib/pricing'
import type { Database } from '@/types/database'
import Stripe from 'stripe'

export async function POST(request: NextRequest) {
  try {
    const body = Buffer.from(await request.arrayBuffer())
    const signature = request.headers.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    // Construct and verify webhook event
    const event = constructWebhookEvent(body, signature)

    let response = NextResponse.json({ received: true })

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

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription') {
          const { stripe } = await import('@/lib/stripe')
          if (!stripe) {
            console.error('Stripe is not configured')
            return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 })
          }

          const subscription = await stripe.subscriptions.retrieve(session.subscription as string)

          const userId = session.metadata?.userId
          if (!userId) {
            console.error('No userId in session metadata')
            break
          }

          // Get price info to determine plan
          const priceId = subscription.items.data[0]?.price.id
          const priceInfo = getPriceInfo(priceId)

          if (!priceInfo) {
            console.error('Unknown price ID:', priceId)
            break
          }

          // Calculate trial end date
          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : calculateTrialEndDate()

          // Update profile with subscription info
          const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: subscription.id,
              subscription_status: subscription.status,
              monthly_request_limit: priceInfo.monthlyRequestLimit,
              trial_ends_at: trialEnd.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', userId)

          if (updateError) {
            console.error('Error updating profile after checkout:', updateError)
          } else {
            console.log(`Subscription created for user ${userId}:`, {
              subscriptionId: subscription.id,
              status: subscription.status,
              limit: priceInfo.monthlyRequestLimit,
              trialEnd: trialEnd.toISOString(),
            })

            // Send subscription confirmation email
            try {
              const { data: profile } = await (supabase as any)
                .from('profiles')
                .select('email, business_name')
                .eq('id', userId)
                .single()

              if (profile?.email) {
                await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/subscription-confirmation`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    email: profile.email,
                    businessName: profile.business_name,
                    planName: priceInfo.monthlyRequestLimit === 50 ? 'Starter' : 'Growth',
                  }),
                })
              }
            } catch (error) {
              console.error('Failed to send subscription confirmation email:', error)
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const userId = subscription.metadata?.userId

        if (!userId) {
          // Try to find user by subscription ID
          const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('id')
            .eq('stripe_subscription_id', subscription.id)
            .single()

          if (!profile) {
            console.error('No user found for subscription:', subscription.id)
            break
          }
        }

        // Get price info to determine plan limits
        const priceId = subscription.items.data[0]?.price.id
        const priceInfo = getPriceInfo(priceId)

        const updateData: any = {
          subscription_status: subscription.status,
          updated_at: new Date().toISOString(),
        }

        if (priceInfo) {
          updateData.monthly_request_limit = priceInfo.monthlyRequestLimit
        }

        if (subscription.trial_end) {
          updateData.trial_ends_at = new Date(subscription.trial_end * 1000).toISOString()
        }

        // Update profile
        const { error: updateError } = await (supabase as any)
          .from('profiles')
          .update(updateData)
          .eq(userId ? 'id' : 'stripe_subscription_id', userId || subscription.id)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
        } else {
          console.log(`Subscription updated:`, {
            subscriptionId: subscription.id,
            status: subscription.status,
            limit: priceInfo?.monthlyRequestLimit,
          })
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription

        // Update profile to cancelled status
        const { error: updateError } = await (supabase as any)
          .from('profiles')
          .update({
            subscription_status: 'cancelled',
            monthly_request_limit: 0, // No more requests allowed
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error updating cancelled subscription:', updateError)
        } else {
          console.log(`Subscription cancelled: ${subscription.id}`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice

        if ((invoice as any).subscription) {
          // Update subscription status to past_due
          const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({
              subscription_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', (invoice as any).subscription as string)

          if (updateError) {
            console.error('Error updating past_due subscription:', updateError)
          } else {
            console.log(`Payment failed for subscription: ${(invoice as any).subscription}`)
          }
        }
        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice

        if ((invoice as any).subscription && invoice.billing_reason === 'subscription_cycle') {
          // Payment succeeded for recurring subscription
          const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({
              subscription_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_subscription_id', (invoice as any).subscription as string)

          if (updateError) {
            console.error('Error updating paid subscription:', updateError)
          } else {
            console.log(`Payment succeeded for subscription: ${(invoice as any).subscription}`)
          }
        }
        break
      }

      default:
        console.log(`Unhandled webhook event: ${event.type}`)
    }

    return response

  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 400 }
    )
  }
}