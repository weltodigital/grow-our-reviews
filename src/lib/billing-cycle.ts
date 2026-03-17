/**
 * Utility functions for handling billing cycle-based credit resets
 */

export interface BillingPeriod {
  start: Date
  end: Date
}

/**
 * Calculate the current billing period for a user based on their billing cycle date
 * @param billingCycleDate Day of month (1-28) when billing cycle resets
 * @returns Object with start and end dates for current billing period
 */
export function getCurrentBillingPeriod(billingCycleDate: number): BillingPeriod {
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let periodStartMonth = currentMonth
  let periodStartYear = currentYear

  // If we're before the billing cycle date this month,
  // the current period started last month
  if (currentDay < billingCycleDate) {
    if (currentMonth === 0) {
      // January -> December of previous year
      periodStartMonth = 11
      periodStartYear = currentYear - 1
    } else {
      periodStartMonth = currentMonth - 1
    }
  }

  // Calculate start date
  const periodStart = new Date(periodStartYear, periodStartMonth, billingCycleDate, 0, 0, 0, 0)

  // Calculate end date (day before next billing cycle date)
  let periodEndMonth = periodStartMonth + 1
  let periodEndYear = periodStartYear

  if (periodEndMonth > 11) {
    // December -> January of next year
    periodEndMonth = 0
    periodEndYear = periodStartYear + 1
  }

  // Handle edge case: if billing cycle date doesn't exist in next month (e.g., billing on 31st but next month only has 30 days)
  const daysInEndMonth = new Date(periodEndYear, periodEndMonth + 1, 0).getDate()
  const endDay = Math.min(billingCycleDate, daysInEndMonth)

  const periodEnd = new Date(periodEndYear, periodEndMonth, endDay, 0, 0, 0, 0)
  // Set to 23:59:59.999 of the day before
  periodEnd.setMilliseconds(-1)

  return {
    start: periodStart,
    end: periodEnd
  }
}

/**
 * Get the next billing cycle date for a user
 * @param billingCycleDate Day of month (1-28) when billing cycle resets
 * @returns Date of next billing cycle reset
 */
export function getNextBillingDate(billingCycleDate: number): Date {
  const now = new Date()
  const currentDay = now.getDate()
  const currentMonth = now.getMonth()
  const currentYear = now.getFullYear()

  let nextBillingMonth = currentMonth
  let nextBillingYear = currentYear

  // If we've already passed the billing date this month, next reset is next month
  if (currentDay >= billingCycleDate) {
    if (currentMonth === 11) {
      // December -> January of next year
      nextBillingMonth = 0
      nextBillingYear = currentYear + 1
    } else {
      nextBillingMonth = currentMonth + 1
    }
  }

  // Handle edge case: if billing cycle date doesn't exist in next month
  const daysInNextMonth = new Date(nextBillingYear, nextBillingMonth + 1, 0).getDate()
  const nextDay = Math.min(billingCycleDate, daysInNextMonth)

  return new Date(nextBillingYear, nextBillingMonth, nextDay, 0, 0, 0, 0)
}

/**
 * Calculate how many days until the next billing cycle reset
 * @param billingCycleDate Day of month (1-28) when billing cycle resets
 * @returns Number of days until next reset
 */
export function getDaysUntilReset(billingCycleDate: number): number {
  const now = new Date()
  const nextBilling = getNextBillingDate(billingCycleDate)
  const diffTime = nextBilling.getTime() - now.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

/**
 * Determine billing cycle date for a new user
 * Uses day of signup, but caps at 28 to avoid issues with February
 * @param signupDate Date when user signed up
 * @returns Billing cycle date (1-28)
 */
export function calculateBillingCycleDate(signupDate: Date): number {
  const day = signupDate.getDate()
  // Cap at 28 to ensure the date exists in all months (February has 28 days)
  return Math.min(day, 28)
}