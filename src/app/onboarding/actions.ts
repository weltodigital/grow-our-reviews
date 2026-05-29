'use server'

import { createServerSupabase } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { calculateBillingCycleDate } from '@/lib/billing-cycle'
import { TRIAL_CONFIG } from '@/lib/pricing'

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

  // Grant the no-card 7-day trial here. Pre-existing profiles that already
  // have a stripe_customer_id keep their Stripe-driven values; only profiles
  // that don't have a real subscription yet get stamped.
  const now = new Date()
  const trialEndsAt = new Date(now.getTime() + TRIAL_CONFIG.durationDays * 24 * 60 * 60 * 1000)

  if (existingProfile) {
    // Update existing profile. Preserve billing data if Stripe has already
    // taken over — but if this profile is still pre-Stripe (no customer ID),
    // top up the trial so a returning unfinished user gets a fresh window.
    const updateData: any = {
      business_name: data.businessName.trim(),
      google_review_url: data.googleReviewUrl ? data.googleReviewUrl.trim() : null,
      updated_at: now.toISOString(),
    }

    if (!(existingProfile as any).stripe_customer_id) {
      updateData.subscription_status = 'trialing'
      updateData.trial_ends_at = trialEndsAt.toISOString()
      updateData.monthly_request_limit = TRIAL_CONFIG.creditLimit
    }

    const { error } = await (supabase as any)
      .from('profiles')
      .update(updateData)
      .eq('id', user.id)

    upsertError = error;
  } else {
    // Create new profile with trial state already populated. The auth guard
    // checks subscription_status and trial_ends_at — if either is missing
    // the user is bounced to /billing/setup, so set both explicitly here.
    const { error } = await (supabase as any)
      .from('profiles')
      .insert({
        id: user.id,
        email: user.email!,
        business_name: data.businessName.trim(),
        google_review_url: data.googleReviewUrl ? data.googleReviewUrl.trim() : null,
        billing_cycle_date: calculateBillingCycleDate(now),
        subscription_status: 'trialing',
        trial_ends_at: trialEndsAt.toISOString(),
        monthly_request_limit: TRIAL_CONFIG.creditLimit,
        updated_at: now.toISOString(),
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

  // Notify ed@ of new signups only on first-time onboarding — re-running
  // onboarding on an existing profile (e.g. updating google_review_url)
  // shouldn't generate a duplicate notification.
  if (!existingProfile) {
    try {
      const { sendNewSignupNotification } = await import('@/lib/resend')
      await sendNewSignupNotification({
        email: user.email!,
        businessName: data.businessName.trim(),
        googleReviewUrl: data.googleReviewUrl ? data.googleReviewUrl.trim() : null,
      })
    } catch (error) {
      console.error('Failed to send new signup notification:', error)
      // Don't fail onboarding if the notification fails
    }
  }

  // Drop the user straight into the dashboard. Their no-card trial is now
  // active in our DB; billing only happens at trial end via the auth guard
  // bouncing them to /billing/setup once `trial_ends_at` is in the past.
  redirect('/dashboard')
}