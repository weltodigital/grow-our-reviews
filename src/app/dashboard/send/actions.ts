'use server'

import { createServerSupabase } from '@/lib/auth'
import { randomBytes } from 'crypto'
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

// Generate a secure random token
function generateToken(): string {
  return randomBytes(32).toString('hex')
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
  } = await supabase.auth.getUser()

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
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (profileError || !profile) {
    return { error: 'Could not load your profile settings' }
  }

  // Check subscription status
  if (!['active', 'trialing'].includes(profile.subscription_status)) {
    return { error: 'Your subscription is inactive. Please update your payment to send review requests.' }
  }

  // If trialing, check if trial has expired
  if (profile.subscription_status === 'trialing' && profile.trial_ends_at) {
    const trialEnd = new Date(profile.trial_ends_at)
    if (trialEnd < new Date()) {
      return { error: 'Your free trial has expired. Please upgrade your plan to continue sending review requests.' }
    }
  }

  // Check monthly limit
  const startOfMonth = new Date()
  startOfMonth.setDate(1)
  startOfMonth.setHours(0, 0, 0, 0)

  const { count: requestsThisMonth } = await supabase
    .from('review_requests')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .gte('created_at', startOfMonth.toISOString())

  if (requestsThisMonth && requestsThisMonth >= profile.monthly_request_limit) {
    return { error: `You've reached your monthly limit of ${profile.monthly_request_limit} requests. Upgrade your plan to send more.` }
  }

  try {
    // Normalize phone number
    const normalizedPhone = normalizePhoneNumber(data.customerPhone)

    // Find or create customer
    let customer
    const { data: existingCustomer } = await supabase
      .from('customers')
      .select('*')
      .eq('user_id', user.id)
      .eq('phone', normalizedPhone)
      .single()

    if (existingCustomer) {
      // Update existing customer's name in case it changed
      const { data: updatedCustomer, error: updateError } = await supabase
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
      const { data: newCustomer, error: createError } = await supabase
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
    const scheduledFor = calculateScheduledTime(profile.sms_delay_hours)

    // Create review request
    const { data: reviewRequest, error: createRequestError } = await supabase
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