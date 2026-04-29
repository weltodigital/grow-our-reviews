'use server'

import { createServerSupabase } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { calculateBillingCycleDate } from '@/lib/billing-cycle'
import type { Database } from '@/types/database'

interface OnboardingData {
  businessName: string
  googleReviewUrl: string | null
}

export async function completeOnboarding(data: OnboardingData) {
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

  // Check if profile already exists
  const { data: existingProfile } = await (supabase as any)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  let upsertError;

  if (existingProfile) {
    // Update existing profile - only update onboarding fields, preserve billing data
    const { error } = await (supabase as any)
      .from('profiles')
      .update({
        business_name: data.businessName.trim(),
        google_review_url: data.googleReviewUrl ? data.googleReviewUrl.trim() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', user.id)

    upsertError = error;
  } else {
    // Create new profile with all required fields
    const { error } = await (supabase as any)
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        business_name: data.businessName.trim(),
        google_review_url: data.googleReviewUrl ? data.googleReviewUrl.trim() : null,
        billing_cycle_date: calculateBillingCycleDate(new Date()),
        updated_at: new Date().toISOString(),
      })

    upsertError = error;
  }

  if (upsertError) {
    console.error('Error updating profile:', upsertError)
    return { error: 'Failed to save your business information. Please try again.' }
  }

  // Create default SMS templates for the user (optimized for 160 character limit with shorter tokens)
  const defaultTemplates = [
    {
      user_id: user.id,
      type: 'initial',
      greeting: 'Hi',
      opening_line: 'thanks for choosing {business_name}!',
      request_line: 'We\'d love your feedback',
      sign_off: null
    },
    {
      user_id: user.id,
      type: 'nudge',
      greeting: 'Hi',
      opening_line: '',
      request_line: 'just a quick reminder - would you mind leaving us a review',
      sign_off: null
    }
  ]

  const { error: templatesError } = await (supabase as any)
    .from('sms_templates')
    .upsert(defaultTemplates, {
      onConflict: 'user_id,type',
    })

  if (templatesError) {
    console.error('Error creating default SMS templates:', templatesError)
    // Don't fail onboarding if templates fail - they can be created later
  }

  // Welcome email will be sent after Stripe checkout completion via webhook

  return { success: true }
}