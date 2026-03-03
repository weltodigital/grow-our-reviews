'use server'

import { createServerSupabase } from '@/lib/auth'
import type { Database } from '@/types/database'

interface BusinessInfoData {
  businessName: string
  googleReviewUrl: string | null
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

interface SmsTemplateData {
  type: 'initial' | 'nudge'
  greeting: string
  opening_line: string
  request_line: string
  sign_off: string | null
}

export async function updateBusinessInfo(data: BusinessInfoData) {
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
  if (!data.businessName.trim()) {
    return { error: 'Business name is required' }
  }

  // Basic URL validation (only if provided)
  if (data.googleReviewUrl) {
    try {
      new URL(data.googleReviewUrl)
    } catch {
      return { error: 'Please enter a valid URL for your Google Reviews page' }
    }
  }

  // Update the profile
  const { error: updateError } = await (supabase as any)
    .from('profiles')
    .update({
      business_name: data.businessName.trim(),
      google_review_url: data.googleReviewUrl ? data.googleReviewUrl.trim() : null,
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
  } = await (supabase as any).auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Validate the data
  if (data.smsDelayHours < 0 || data.smsDelayHours > 72) {
    return { error: 'SMS delay must be between 0 and 72 hours' }
  }

  // Update the profile
  const { error: updateError } = await (supabase as any)
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
  } = await (supabase as any).auth.getUser()

  if (authError || !user) {
    return { error: 'Not authenticated' }
  }

  // Validate the data
  if (data.nudge_delay_hours < 1 || data.nudge_delay_hours > 168) {
    return { error: 'Nudge delay must be between 1 and 168 hours (1 week)' }
  }

  // Update the profile
  const { error: updateError } = await (supabase as any)
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
  } = await (supabase as any).auth.getUser()

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
  const { error: updateError } = await (supabase as any).auth.updateUser({
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
  const { error: profileUpdateError } = await (supabase as any)
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

export async function updateSmsTemplate(data: SmsTemplateData) {
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
  if (!data.greeting.trim()) {
    return { error: 'Greeting is required' }
  }

  if (data.greeting.length > 20) {
    return { error: 'Greeting must be 20 characters or less' }
  }

  if (!data.opening_line.trim()) {
    return { error: 'Opening line is required' }
  }

  if (data.opening_line.length > 150) {
    return { error: 'Opening line must be 150 characters or less' }
  }

  if (!data.request_line.trim()) {
    return { error: 'Request line is required' }
  }

  if (data.request_line.length > 200) {
    return { error: 'Request line must be 200 characters or less' }
  }

  if (data.sign_off && data.sign_off.length > 50) {
    return { error: 'Sign-off must be 50 characters or less' }
  }

  // Strip any URLs from user input
  const stripUrls = (text: string) => {
    return text.replace(/https?:\/\/[^\s]+/gi, '')
  }

  const cleanedData = {
    greeting: stripUrls(data.greeting.trim()),
    opening_line: stripUrls(data.opening_line.trim()),
    request_line: stripUrls(data.request_line.trim()),
    sign_off: data.sign_off ? stripUrls(data.sign_off.trim()) || null : null
  }

  // Update the template
  const { error: updateError } = await (supabase as any)
    .from('sms_templates')
    .upsert({
      user_id: user.id,
      type: data.type,
      ...cleanedData,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id,type',
    })

  if (updateError) {
    console.error('Error updating SMS template:', updateError)
    return { error: 'Failed to save your SMS template. Please try again.' }
  }

  return { success: true }
}