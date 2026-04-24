'use server'

import { createServerSupabase } from '@/lib/auth'
import { randomBytes } from 'crypto'
import { getCurrentBillingPeriod, getNextBillingDate } from '@/lib/billing-cycle'
import { countNudgesSentInPeriod } from '@/lib/credit-usage'
import type { Database } from '@/types/database'

interface CreateReviewRequestData {
  customerName: string
  customerPhone: string
}

// Normalize phone number to E.164 format
function normalizePhoneNumber(phone: string): string {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '')

  // Handle UK numbers
  if (digits.startsWith('07') && digits.length === 11) {
    // Convert 07xxx to +447xxx
    return '+44' + digits.slice(1)
  } else if (digits.startsWith('447') && digits.length === 13) {
    // Already in international format, add +
    return '+' + digits
  } else if (digits.startsWith('44') && digits.length === 12) {
    // International without +
    return '+' + digits
  }

  // For other formats, assume they're correct
  return phone.startsWith('+') ? phone : '+' + digits
}

// Generate a secure random token (shorter to save SMS characters)
function generateToken(): string {
  return randomBytes(8).toString('hex') // 8 bytes = 16 character hex string for shorter URLs
}

// Calculate scheduled time based on user's delay settings
function calculateScheduledTime(delayHours: number): Date {
  const now = new Date()
  const scheduled = new Date(now.getTime() + delayHours * 60 * 60 * 1000)

  // Don't send between 9pm and 8am - delay until 8am next day if needed
  const hours = scheduled.getHours()
  if (hours >= 21 || hours < 8) {
    const nextMorning = new Date(scheduled)
    nextMorning.setHours(8, 0, 0, 0)

    // If it's already past 9pm, schedule for next day
    if (hours >= 21) {
      nextMorning.setDate(nextMorning.getDate() + 1)
    }

    return nextMorning
  }

  return scheduled
}

export async function createReviewRequest(data: CreateReviewRequestData) {
  const supabase = await createServerSupabase()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await (supabase as any).auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Validate the data
  if (!data.customerName.trim()) {
    return { error: 'Customer name is required' }
  }

  if (!data.customerPhone.trim()) {
    return { error: 'Phone number is required' }
  }

  // Get user's profile for settings and limits
  const { data: profile, error: profileError } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Could not load your profile settings' }
  }

  // Check subscription status
  if (!['active', 'trialing'].includes((profile as any).subscription_status)) {
    return { error: 'Your subscription is inactive. Please update your payment to send review requests.' }
  }

  // If trialing, check if trial has expired
  if ((profile as any).subscription_status === 'trialing' && (profile as any).trial_ends_at) {
    const trialEnd = new Date((profile as any).trial_ends_at)
    if (trialEnd < new Date()) {
      return { error: 'Your free trial has expired. Please upgrade your plan to continue sending review requests.' }
    }
  }

  // If subscription is cancelled but period hasn't ended, allow access
  if ((profile as any).subscription_status === 'active' &&
      (profile as any).cancelled_at_period_end &&
      (profile as any).current_period_end) {
    const periodEnd = new Date((profile as any).current_period_end)
    if (periodEnd < new Date()) {
      return { error: 'Your subscription has ended. Please resubscribe to continue sending review requests.' }
    }
    // Otherwise allow access until period end
  }

  // Check monthly limit using personalized billing cycle
  let billingStart: Date
  let billingEnd: Date
  let nextResetDate: Date

  if ((profile as any).billing_cycle_date) {
    const billingPeriod = getCurrentBillingPeriod((profile as any).billing_cycle_date)
    billingStart = billingPeriod.start
    billingEnd = billingPeriod.end
    nextResetDate = getNextBillingDate((profile as any).billing_cycle_date)
  } else {
    // Fallback to calendar month if billing_cycle_date is not set
    billingStart = new Date()
    billingStart.setDate(1)
    billingStart.setHours(0, 0, 0, 0)
    billingEnd = new Date(billingStart.getFullYear(), billingStart.getMonth() + 1, 0, 23, 59, 59)
    nextResetDate = new Date(billingStart.getFullYear(), billingStart.getMonth() + 1, 1)
  }

  // Credits consumed = originals created this period (reserves a credit on creation,
  // even for scheduled-future sends) + nudges actually sent this period.
  const [{ count: originalsThisMonth }, nudgesThisMonth] = await Promise.all([
    (supabase as any)
      .from('review_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', billingStart.toISOString())
      .lte('created_at', billingEnd.toISOString()),
    countNudgesSentInPeriod(supabase, user.id, billingStart, billingEnd),
  ])
  const requestsThisMonth = (originalsThisMonth || 0) + nudgesThisMonth

  if (requestsThisMonth && requestsThisMonth >= (profile as any).monthly_request_limit) {
    // Send plan limit reached email (don't wait for it to complete)
    try {
      await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/plan-limit-reached`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: profile.email,
          businessName: profile.business_name,
          currentLimit: profile.monthly_request_limit,
          requestsUsed: requestsThisMonth,
        }),
      })
    } catch (error) {
      console.error('Failed to send plan limit email:', error)
      // Don't fail the request if email fails
    }

    return { error: `You've reached your monthly limit of ${(profile as any).monthly_request_limit} requests. Your credits reset on ${nextResetDate.toLocaleDateString('en-GB')}. Upgrade your plan to send more now.` }
  }

  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(data.customerPhone)

    // SECURITY: Check if customer has opted out (STOP message protection)
    const { data: suppression } = await (supabase as any)
      .from('sms_suppressions')
      .select('id, suppressed_at, reason')
      .eq('phone_number', normalizedPhone)
      .eq('user_id', user.id)
      .limit(1)
      .single()

    if (suppression) {
      return {
        error: 'This customer has opted out of receiving SMS messages from your business. We cannot send them a review request.',
        type: 'suppressed'
      }
    }

    // Find or create customer
    let customer
    const { data: existingCustomer } = await (supabase as any)
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone', normalizedPhone)
      .single()

    if (existingCustomer) {
      // Update existing customer's name in case it changed
      const { data: updatedCustomer, error: updateError } = await (supabase as any)
        .from('customers')
        .update({
          name: data.customerName.trim()
        })
        .eq('id', existingCustomer.id)
        .select('*')
        .single()

      if (updateError) {
        console.error('Error updating customer:', updateError)
        return { error: 'Failed to update customer information' }
      }

      customer = updatedCustomer
    } else {
      // Create new customer
      const { data: newCustomer, error: createError } = await (supabase as any)
        .from('customers')
        .insert({
          user_id: user.id,
          name: data.customerName.trim(),
          phone: normalizedPhone,
        })
        .select('*')
        .single()

      if (createError) {
        console.error('Error creating customer:', createError)
        return { error: 'Failed to create customer record' }
      }

      customer = newCustomer
    }

    // Generate unique token
    const token = generateToken()

    // Calculate scheduled time
    const scheduledFor = calculateScheduledTime((profile as any).sms_delay_hours)

    // Create review request
    const { data: reviewRequest, error: createRequestError } = await (supabase as any)
      .from('review_requests')
      .insert({
        user_id: user.id,
        customer_id: customer.id,
        token,
        scheduled_for: scheduledFor.toISOString(),
        status: 'scheduled',
      })
      .select('*')
      .single()

    if (createRequestError) {
      console.error('Error creating review request:', createRequestError)
      return { error: 'Failed to create review request' }
    }

    return {
      success: true,
      token: reviewRequest.token,
      scheduledTime: reviewRequest.scheduled_for,
      customerId: customer.id,
    }

  } catch (error) {
    console.error('Unexpected error:', error)
    return { error: 'An unexpected error occurred. Please try again.' }
  }
}