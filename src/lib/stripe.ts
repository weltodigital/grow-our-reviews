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
  lite: {
    priceId: process.env.STRIPE_LITE_PRICE_ID!,
    amount: 1900, // £19.00 in pence
    currency: 'gbp',
    interval: 'month',
    monthlyRequestLimit: 30,
  },
  starter: {
    priceId: process.env.STRIPE_STARTER_PRICE_ID!,
    amount: 4900, // £49.00 in pence
    currency: 'gbp',
    interval: 'month',
    monthlyRequestLimit: 150,
  },
  growth: {
    priceId: process.env.STRIPE_GROWTH_PRICE_ID!,
    amount: 7900, // £79.00 in pence
    currency: 'gbp',
    interval: 'month',
    monthlyRequestLimit: 300,
  },
} as const

export type StripePlanKey = keyof typeof STRIPE_CONFIG

// Reverse-lookup: get plan key from a Stripe price ID. Use this in webhooks
// instead of inferring plan from monthlyRequestLimit (brittle once Lite exists).
export function getStripePlanKeyByPriceId(priceId: string | null | undefined): StripePlanKey | null {
  if (!priceId) return null
  if (priceId === STRIPE_CONFIG.lite.priceId) return 'lite'
  if (priceId === STRIPE_CONFIG.starter.priceId) return 'starter'
  if (priceId === STRIPE_CONFIG.growth.priceId) return 'growth'
  return null
}

// Create checkout session with customizable trial. Pass `customerId` for
// returning customers (e.g. reactivation after a trial); only use
// `customerEmail` when we don't yet have a Stripe customer record — that
// way Stripe can correctly evaluate promo codes with first-time-customer
// restrictions and we don't fragment the customer history.
export async function createCheckoutSession({
  priceId,
  successUrl,
  cancelUrl,
  customerEmail,
  customerId,
  userId,
  trialDays = 7,
}: {
  priceId: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  customerId?: string
  userId: string
  trialDays?: number
}) {
  if (!stripe) {
    throw new Error('Stripe is not configured')
  }

  const baseParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    subscription_data: {
      ...(trialDays && trialDays > 0 ? { trial_period_days: trialDays } : {}),
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
  }

  // Stripe forbids passing both `customer` and `customer_email`.
  if (customerId) {
    baseParams.customer = customerId
  } else if (customerEmail) {
    baseParams.customer_email = customerEmail
  }

  const session = await stripe.checkout.sessions.create(baseParams)

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