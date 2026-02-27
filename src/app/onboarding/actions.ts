'use server'

import { createServerSupabase } from '@/lib/auth'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'

interface OnboardingData {
  businessName: string
  googleReviewUrl: string
}

export async function completeOnboarding(data: OnboardingData) {
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

  // Create or update the profile
  const { error: upsertError } = await supabase
    .from('profiles')
    .upsert(
      {
        id: user.id,
        email: user.email!,
        business_name: data.businessName.trim(),
        google_review_url: data.googleReviewUrl.trim(),
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'id',
      }
    )

  if (upsertError) {
    console.error('Error updating profile:', upsertError)
    return { error: 'Failed to save your business information. Please try again.' }
  }

  return { success: true }
}