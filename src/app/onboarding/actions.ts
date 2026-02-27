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
  } = await (supabase as any).auth.getUser()

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
  const { error: upsertError } = await (supabase as any)
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

  // Send welcome email
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/welcome`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        businessName: data.businessName.trim(),
      }),
    })
  } catch (error) {
    // Don't fail onboarding if email fails
    console.error('Failed to send welcome email:', error)
  }

  return { success: true }
}