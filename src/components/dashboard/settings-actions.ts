'use server'

import { createServerSupabase } from '@/lib/auth'
import type { Database } from '@/types/database'

interface BusinessInfoData {
  businessName: string
  googleReviewUrl: string
  phone: string | null
}

interface SmsTimingData {
  smsDelayHours: number
}

interface AccountInfoData {
  email: string
}

interface NudgeSettingsData {
  nudge_enabled: boolean
  nudge_delay_hours: number
}

export async function updateBusinessInfo(data: BusinessInfoData) {
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
  if (!data.businessName.trim()) {
    return { error: 'Business name is required' }
  }

  if (!data.googleReviewUrl.trim()) {
    return { error: 'Google Reviews URL is required' }
  }

  // Basic URL validation
  try {
    new URL(data.googleReviewUrl)
  } catch {
    return { error: 'Please enter a valid URL for your Google Reviews page' }
  }

  // Update the profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      business_name: data.businessName.trim(),
      google_review_url: data.googleReviewUrl.trim(),
      phone: data.phone?.trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating business info:', updateError)
    return { error: 'Failed to save your business information. Please try again.' }
  }

  return { success: true }
}

export async function updateSmsTimingSettings(data: SmsTimingData) {
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
  if (data.smsDelayHours < 0 || data.smsDelayHours > 72) {
    return { error: 'SMS delay must be between 0 and 72 hours' }
  }

  // Update the profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      sms_delay_hours: data.smsDelayHours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating SMS timing settings:', updateError)
    return { error: 'Failed to save your SMS timing settings. Please try again.' }
  }

  return { success: true }
}

export async function updateNudgeSettings(data: NudgeSettingsData) {
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
  if (data.nudge_delay_hours < 1 || data.nudge_delay_hours > 168) {
    return { error: 'Nudge delay must be between 1 and 168 hours (1 week)' }
  }

  // Update the profile
  const { error: updateError } = await supabase
    .from('profiles')
    .update({
      nudge_enabled: data.nudge_enabled,
      nudge_delay_hours: data.nudge_delay_hours,
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (updateError) {
    console.error('Error updating nudge settings:', updateError)
    return { error: 'Failed to save your nudge settings. Please try again.' }
  }

  return { success: true }
}

export async function updateAccountInfo(data: AccountInfoData) {
  const supabase = await createServerSupabase()

  // Get the current user
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Validate the email
  if (!data.email.trim()) {
    return { error: 'Email address is required' }
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(data.email)) {
    return { error: 'Please enter a valid email address' }
  }

  // Update the user's email (this will send a confirmation email)
  const { error: updateError } = await supabase.auth.updateUser({
    email: data.email.trim(),
  })

  if (updateError) {
    console.error('Error updating email:', updateError)

    // Handle specific error cases
    if (updateError.message.includes('already registered')) {
      return { error: 'This email address is already in use by another account' }
    }

    return { error: 'Failed to update email address. Please try again.' }
  }

  // Also update the profile email for consistency
  const { error: profileUpdateError } = await supabase
    .from('profiles')
    .update({
      email: data.email.trim(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (profileUpdateError) {
    console.error('Error updating profile email:', profileUpdateError)
    // Don't return error here since the auth update succeeded
  }

  return { success: true }
}