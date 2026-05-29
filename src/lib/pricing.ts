// Pricing configuration — single source of truth for plan metadata.
export const PRICING_PLANS = {
  lite: {
    name: 'Lite',
    price: 9,
    currency: 'GBP',
    interval: 'month',
    monthlyRequestLimit: 20,
    features: [
      'Up to 20 message credits per month',
      'SMS review requests',
      'Automatic follow-up nudges (can enable/disable)',
      'Sentiment gate (review filtering)',
      'Analytics dashboard',
      'Email support',
    ],
    stripeProductId: process.env.STRIPE_LITE_PRICE_ID,
    popular: false,
  },
  starter: {
    name: 'Starter',
    price: 29,
    currency: 'GBP',
    interval: 'month',
    monthlyRequestLimit: 100,
    features: [
      'Up to 100 message credits per month',
      'SMS review requests',
      'Automatic follow-up nudges (can enable/disable)',
      'Sentiment gate (review filtering)',
      'Analytics dashboard',
      'Email support',
    ],
    stripeProductId: process.env.STRIPE_STARTER_PRICE_ID,
    popular: false,
  },
  growth: {
    name: 'Growth',
    price: 49,
    currency: 'GBP',
    interval: 'month',
    monthlyRequestLimit: 200,
    features: [
      'Up to 200 message credits per month',
      'Everything in Starter',
      'Priority support',
    ],
    stripeProductId: process.env.STRIPE_GROWTH_PRICE_ID,
    popular: true,
  },
  pro: {
    name: 'Pro',
    price: 99,
    currency: 'GBP',
    interval: 'month',
    monthlyRequestLimit: 500,
    features: [
      'Up to 500 message credits per month',
      'Everything in Growth',
      'Priority support',
    ],
    stripeProductId: process.env.STRIPE_PRO_PRICE_ID,
    popular: false,
  },
} as const

export type PlanKey = keyof typeof PRICING_PLANS
export type Plan = typeof PRICING_PLANS[PlanKey]

// Plans in display order (cheapest → most expensive).
export const PLAN_DISPLAY_ORDER: PlanKey[] = ['lite', 'starter', 'growth', 'pro']

// Trial configuration. The trial is 7 days, no card required: users sign up
// and are dropped straight into the dashboard with `creditLimit` credits for
// the duration. At trial end the auth guard pushes them to /billing/setup
// where they pick a plan and enter card details to continue.
//
// `defaultPlan` is the plan pre-selected on /billing/setup after the trial
// expires (and when the signup flow can't otherwise infer a choice).
export const TRIAL_CONFIG = {
  durationDays: 7,
  requiresCard: false,
  creditLimit: 30,
  defaultPlan: 'growth' as PlanKey,
} as const

// Default monthly request limit. Used as the trial limit at onboarding and
// as a safety fallback when a profile is missing `monthly_request_limit`.
// Capped at the trial credit limit so no buggy state ever exposes more
// credits than the smallest legitimate allocation.
export const DEFAULT_TRIAL_LIMIT = TRIAL_CONFIG.creditLimit

// Get the plan key matching a monthly request limit. Used to display the
// current plan when only `monthly_request_limit` is on the profile row.
export function getPlanByLimit(limit: number): PlanKey {
  // Exact-match the configured limit first — handles all plans cleanly.
  if (limit === PRICING_PLANS.lite.monthlyRequestLimit) return 'lite'
  if (limit === PRICING_PLANS.starter.monthlyRequestLimit) return 'starter'
  if (limit === PRICING_PLANS.growth.monthlyRequestLimit) return 'growth'
  if (limit === PRICING_PLANS.pro.monthlyRequestLimit) return 'pro'
  // Fallbacks for legacy or partial-limit rows.
  if (limit >= PRICING_PLANS.pro.monthlyRequestLimit) return 'pro'
  if (limit >= PRICING_PLANS.growth.monthlyRequestLimit) return 'growth'
  if (limit >= PRICING_PLANS.starter.monthlyRequestLimit) return 'starter'
  if (limit >= PRICING_PLANS.lite.monthlyRequestLimit) return 'lite'
  return 'lite'
}

// Get the plan key for a given Stripe price ID. Returns null if no match.
// Use this instead of inferring plan from monthlyRequestLimit in webhook code.
export function getPlanByPriceId(priceId: string | null | undefined): PlanKey | null {
  if (!priceId) return null
  if (priceId === PRICING_PLANS.lite.stripeProductId) return 'lite'
  if (priceId === PRICING_PLANS.starter.stripeProductId) return 'starter'
  if (priceId === PRICING_PLANS.growth.stripeProductId) return 'growth'
  if (priceId === PRICING_PLANS.pro.stripeProductId) return 'pro'
  return null
}

// Get plan configuration
export function getPlan(planKey: PlanKey): Plan {
  return PRICING_PLANS[planKey]
}

// Calculate trial end date
export function calculateTrialEndDate(startDate: Date = new Date()): Date {
  const endDate = new Date(startDate)
  endDate.setDate(endDate.getDate() + TRIAL_CONFIG.durationDays)
  return endDate
}

// Format price for display
export function formatPrice(price: number, currency: string = 'GBP'): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
  }).format(price)
}

// Calculate cost per request
export function getCostPerRequest(planKey: PlanKey): number {
  const plan = getPlan(planKey)
  return plan.price / plan.monthlyRequestLimit
}

// Get plan recommendations based on usage. Returns the smallest plan whose
// monthlyRequestLimit comfortably covers the observed usage.
export function getRecommendedPlan(monthlyUsage: number): PlanKey {
  if (monthlyUsage > PRICING_PLANS.growth.monthlyRequestLimit * 0.8) return 'pro'
  if (monthlyUsage > PRICING_PLANS.starter.monthlyRequestLimit * 0.8) return 'growth'
  if (monthlyUsage > PRICING_PLANS.lite.monthlyRequestLimit * 0.8) return 'starter'
  return 'lite'
}
