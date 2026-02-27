import Stripe from 'stripe'

// Initialize Stripe only if the secret key is available
export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2026-01-28.clover',
      typescript: true,
    })
  : null

// Stripe configuration for our pricing
export const STRIPE_CONFIG = {
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    amount: 4900, // £49.00 in pence
    currency: 'gbp',
    interval: 'month',
    monthlyRequestLimit: 50,
  },
  growth: {
    priceId: process.env.STRIPE_GROWTH_PRICE_ID!,
    amount: 7900, // £79.00 in pence
    currency: 'gbp',
    interval: 'month',
    monthlyRequestLimit: 150,
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
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

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
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// Get subscription status
export async function getSubscriptionStatus(subscriptionId: string) {
  if (!stripe) {
    return null
  }

  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return {
      status: subscription.status,
      currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
      cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
      trialEnd: (subscription as any).trial_end ? new Date((subscription as any).trial_end * 1000) : null,
    }
  } catch (error) {
    console.error('Error retrieving subscription:', error)
    return null
  }
}

// Cancel subscription at period end
export async function cancelSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true,
  })
}

// Reactivate subscription
export async function reactivateSubscription(subscriptionId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  return await stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

// Get customer's payment methods
export async function getCustomerPaymentMethods(customerId: string) {
  if (!stripe) {
    return { data: [] }
  }

  return await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  })
}

// Create setup intent for adding payment method
export async function createSetupIntent(customerId: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  return await stripe.setupIntents.create({
    customer: customerId,
    usage: 'off_session',
  })
}

// Webhook event handling
export function constructWebhookEvent(body: Buffer, signature: string) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

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