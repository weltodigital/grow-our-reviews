// Pricing configuration — single source of truth for plan metadata.
export const PRICING_PLANS = {
  lite: {
    name: 'Lite',
    price: 19,
    currency: 'GBP',
    interval: 'month',
    monthlyRequestLimit: 30,
    features: [
      'Up to 30 message credits per month',
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
    price: 49,
    currency: 'GBP',
    interval: 'month',
    monthlyRequestLimit: 150,
    features: [
      'Up to 150 message credits per month',
      'SMS review requests',
      'Automatic follow-up nudges (can enable/disable)',
      'Sentiment gate (review filtering)',
      'Analytics dashboard',
      'Email support',
    ],
    stripeProductId: process.env.STRIPE_STARTER_PRICE_ID,
    popular: true,
  },
  growth: {
    name: 'Growth',
    price: 79,
    currency: 'GBP',
    interval: 'month',
    monthlyRequestLimit: 300,
    features: [
      'Up to 300 message credits per month',
      'Everything in Starter',
      'Priority support',
    ],
    stripeProductId: process.env.STRIPE_GROWTH_PRICE_ID,
    popular: false,
  },
} as const

export type PlanKey = keyof typeof PRICING_PLANS
export type Plan = typeof PRICING_PLANS[PlanKey]

// Plans in display order (cheapest → most expensive).
export const PLAN_DISPLAY_ORDER: PlanKey[] = ['lite', 'starter', 'growth']

// Trial configuration. There is no single trial default plan — each user
// selects a plan at signup and the trial gives them that plan's credits.
// `defaultPlan` is the fallback used when a plan can't be inferred from the
// signup flow (e.g. legacy routes), set to Starter to preserve prior behaviour.
export const TRIAL_CONFIG = {
  durationDays: 14,
  requiresCard: true,
  defaultPlan: 'starter' as PlanKey,
} as const

// Default monthly request limit (fallback only — most users get the limit of
// the plan they actually chose).
export const DEFAULT_TRIAL_LIMIT = PRICING_PLANS.starter.monthlyRequestLimit

// Get the plan key matching a monthly request limit. Used to display the
// current plan when only `monthly_request_limit` is on the profile row.
export function getPlanByLimit(limit: number): PlanKey {
  // Exact-match the configured limit first — handles all three plans cleanly.
  if (limit === PRICING_PLANS.lite.monthlyRequestLimit) return 'lite'
  if (limit === PRICING_PLANS.starter.monthlyRequestLimit) return 'starter'
  if (limit === PRICING_PLANS.growth.monthlyRequestLimit) return 'growth'
  // Fallbacks for legacy or partial-limit rows (e.g. 50-credit historical trials).
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
  if (monthlyUsage > PRICING_PLANS.starter.monthlyRequestLimit * 0.8) return 'growth'
  if (monthlyUsage > PRICING_PLANS.lite.monthlyRequestLimit * 0.8) return 'starter'
  return 'lite'
}
