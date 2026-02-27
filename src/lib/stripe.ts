import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is required')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-06-20',
  typescript: true,
})

// Stripe configuration for our pricing
export const STRIPE_CONFIG = {
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    amount: 4900, // £49.00 in pence
    currency: 'gbp',
    interval: 'month',
    monthlyRequestLimit: 20,
  },
  growth: {
    priceId: process.env.STRIPE_GROWTH_PRICE_ID!,
    amount: 12900, // £129.00 in pence
    currency: 'gbp',
    interval: 'month',
    monthlyRequestLimit: 100,
  },
} as const

export type StripePlanKey = keyof typeof STRIPE_CONFIG

// Create checkout session with 7-day trial
export async function createCheckoutSession({
  priceId,
  successUrl,
  cancelUrl,
  customerEmail,
  userId,
}: {
  priceId: string
  successUrl: string
  cancelUrl: string
  customerEmail: string
  userId: string
}) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: customerEmail,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      trial_period_days: 7, // 7-day trial
      metadata: {
        userId,
      },
    },
    metadata: {
      userId,
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    allow_promotion_codes: true,
  })

  return session
}

// Create customer portal session
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string
  returnUrl: string
}) {
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// Get subscription status
export async function getSubscriptionStatus(subscriptionId: string) {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return {
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
    }
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    return null
  }
}

// Cancel subscription at period end
export async function cancelSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

// Reactivate subscription
export async function reactivateSubscription(subscriptionId: string) {
  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

// Get customer's payment methods
export async function getCustomerPaymentMethods(customerId: string) {
  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  })
}

// Create setup intent for adding payment method
export async function createSetupIntent(customerId: string) {
  return await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
  })
}

// Webhook event handling
export function constructWebhookEvent(body: Buffer, signature: string) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (!webhookSecret) {
    throw new Error('STRIPE_WEBHOOK_SECRET is required')
  }

  return stripe.webhooks.constructEvent(body, signature, webhookSecret)
}

// Get price information
export function getPriceInfo(priceId: string) {
  const configs = Object.values(STRIPE_CONFIG)
  return configs.find(config => config.priceId === priceId) || null
}

// Format amount for display
export function formatAmount(amount: number, currency: string = 'gbp'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(amount / 100) // Convert from pence to pounds
}