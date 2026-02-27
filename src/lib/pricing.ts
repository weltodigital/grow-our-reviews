// Updated pricing configuration
export const PRICING_PLANS = {
  starter: {
    name: 'Starter',
    price: 49,
    currency: 'GBP',
    interval: 'month',
    monthlyRequestLimit: 20,
    features: [
      'Up to 20 review requests per month',
      'SMS review requests',
      'Sentiment gate (review filtering)',
      'Simple dashboard',
      'Email support'
    ],
    stripeProductId: process.env.STRIPE_STARTER_PRICE_ID,
    popular: false,
  },
  growth: {
    name: 'Growth',
    price: 129,
    currency: 'GBP',
    interval: 'month',
    monthlyRequestLimit: 100,
    features: [
      'Up to 100 review requests per month',
      'Everything in Starter',
      'Automatic 48-hour nudge follow-ups',
      'Priority support'
    ],
    stripeProductId: process.env.STRIPE_GROWTH_PRICE_ID,
    popular: true,
  }
} as const

export type PlanKey = keyof typeof PRICING_PLANS
export type Plan = typeof PRICING_PLANS[PlanKey]

// Trial configuration
export const TRIAL_CONFIG = {
  durationDays: 7,
  requiresCard: true,
  defaultPlan: 'starter' as PlanKey,
} as const

// Default monthly request limit for new users (trial period)
export const DEFAULT_TRIAL_LIMIT = PRICING_PLANS.starter.monthlyRequestLimit

// Get plan by monthly limit (for backwards compatibility)
export function getPlanByLimit(limit: number): PlanKey {
  if (limit >= PRICING_PLANS.growth.monthlyRequestLimit) {
    return 'growth'
  }
  return 'starter'
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

// Get plan recommendations based on usage
export function getRecommendedPlan(monthlyUsage: number): PlanKey {
  if (monthlyUsage > PRICING_PLANS.starter.monthlyRequestLimit * 0.8) {
    return 'growth'
  }
  return 'starter'
}