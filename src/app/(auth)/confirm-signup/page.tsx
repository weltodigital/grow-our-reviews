'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

function ConfirmSignupForm() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const handleSignupConfirmation = async () => {
      if (!supabase) {
        setStatus('error')
        setError('Service temporarily unavailable')
        return
      }

      // Get the code and next URL from search params
      const code = searchParams.get('code')
      const next = searchParams.get('next') || '/dashboard'

      if (!code) {
        setStatus('error')
        setError('Invalid confirmation link. Please try signing up again.')
        return
      }

      console.log('Client-side signup confirmation - attempting code exchange')

      try {
        // Try client-side code exchange (this handles PKCE properly for cross-device)
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.error('Client-side code exchange error:', error)
          setStatus('error')
          setError('Failed to confirm your signup. Please try signing up again or contact support.')
          return
        }

        if (data.session) {
          console.log('Signup confirmation successful for:', data.session.user?.email)
          setStatus('success')

          // Check the user's profile to determine where to redirect
          const { data: profile } = await supabase
            .from('profiles')
            .select('business_name, google_review_url, stripe_customer_id, subscription_status')
            .eq('id', data.session.user.id)
            .single() as { data: { business_name: string | null; google_review_url: string | null; stripe_customer_id: string | null; subscription_status: string | null } | null }

          // Determine redirect destination based on completion status
          let redirectPath = next
          if (!profile) {
            redirectPath = '/onboarding'
          } else if (!profile.business_name || !profile.google_review_url) {
            redirectPath = '/onboarding'
          } else if (!profile.stripe_customer_id || !profile.subscription_status || !['active', 'trialing'].includes(profile.subscription_status)) {
            redirectPath = '/billing/setup'
          }

          console.log('Redirecting to:', redirectPath)

          // Small delay to show success state
          setTimeout(() => {
            router.push(redirectPath)
          }, 1500)
        } else {
          setStatus('error')
          setError('Failed to create session. Please try signing up again.')
        }
      } catch (err) {
        console.error('Unexpected signup confirmation error:', err)
        setStatus('error')
        setError('An unexpected error occurred. Please try again.')
      }
    }

    handleSignupConfirmation()
  }, [searchParams, router])

  if (status === 'loading') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Confirming your account...</CardTitle>
          <CardDescription>
            Please wait while we verify your email address.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (status === 'success') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Welcome to Grow Our Reviews!</CardTitle>
          <CardDescription>
            Your account has been successfully confirmed.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-green-600 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-gray-600">Redirecting you to complete your setup...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Confirmation Failed</CardTitle>
        <CardDescription>
          We couldn't confirm your account
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8">
          <div className="text-red-600 mb-4">
            <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600">
            You can try{' '}
            <a href="/signup" className="underline hover:no-underline" style={{ color: 'var(--accent)' }}>
              signing up again
            </a>
            {' '}or{' '}
            <a href="/login" className="underline hover:no-underline" style={{ color: 'var(--accent)' }}>
              sign in
            </a>
            {' '}if you already have an account.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}

export default function ConfirmSignupPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmSignupForm />
    </Suspense>
  )
}