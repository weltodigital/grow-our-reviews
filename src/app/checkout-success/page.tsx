'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CheckCircle, Clock, AlertCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase'

function CheckoutSuccessContent() {
  const [status, setStatus] = useState<'checking' | 'success' | 'timeout' | 'error'>('checking')
  const [profile, setProfile] = useState<any>(null)
  const [countdown, setCountdown] = useState(30) // 30 second timeout
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const supabase = createClient()

  // Fire the Meta Pixel StartTrial event exactly once, when the webhook has
  // confirmed the subscription is active. Any earlier (e.g. on signup form
  // submit) would attribute drop-off-prone users; firing on 'timeout' would
  // count partial successes that the webhook hasn't actually reconciled yet.
  // Pixel is gated on cookie consent (Trackers.tsx); fbq is undefined for
  // users who rejected, so the call silently no-ops — which is correct.
  useEffect(() => {
    if (status !== 'success') return
    const fbq = (window as any).fbq
    if (typeof fbq !== 'function') return
    fbq('track', 'StartTrial', {
      value: 49.00,
      currency: 'GBP',
      predicted_ltv: '294.00',
    })
  }, [status])

  useEffect(() => {
    if (!supabase) return

    let attempts = 0
    const maxAttempts = 30 // Check for 30 seconds

    const checkSubscriptionStatus = async () => {
      try {
        attempts++

        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          setStatus('error')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('stripe_customer_id, subscription_status, business_name, email')
          .eq('id', session.user.id)
          .single()

        if (profile && (profile as any).stripe_customer_id && (profile as any).subscription_status) {
          // Webhook has processed successfully!
          console.log('Subscription confirmed:', profile)
          setProfile(profile)
          setStatus('success')

          // Redirect to dashboard after a brief success message
          setTimeout(() => {
            router.push('/dashboard')
          }, 2000)

          return
        }

        // Keep checking if we haven't reached max attempts
        if (attempts < maxAttempts) {
          setTimeout(checkSubscriptionStatus, 1000) // Check every second
        } else {
          // Timeout - webhook might have failed, but let user proceed
          setStatus('timeout')
        }
      } catch (error) {
        console.error('Error checking subscription status:', error)
        if (attempts < maxAttempts) {
          setTimeout(checkSubscriptionStatus, 1000)
        } else {
          setStatus('error')
        }
      }
    }

    // Start checking immediately
    checkSubscriptionStatus()

    // Update countdown display
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      clearInterval(countdownInterval)
    }
  }, [supabase, router])

  const handleContinue = () => {
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full">
        <Card>
          <CardHeader className="text-center">
            {status === 'checking' && (
              <>
                <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600 animate-spin" />
                </div>
                <CardTitle>Processing Your Subscription</CardTitle>
                <CardDescription>
                  Please wait while we set up your account...
                </CardDescription>
              </>
            )}

            {status === 'success' && (
              <>
                <div className="mx-auto mb-4 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle className="text-green-900">Welcome to Grow Our Reviews!</CardTitle>
                <CardDescription>
                  Your subscription is active. Redirecting to your dashboard...
                </CardDescription>
              </>
            )}

            {(status === 'timeout' || status === 'error') && (
              <>
                <div className="mx-auto mb-4 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-yellow-600" />
                </div>
                <CardTitle className="text-yellow-900">Almost Ready!</CardTitle>
                <CardDescription>
                  Your payment was successful. We're finishing setting up your account.
                </CardDescription>
              </>
            )}
          </CardHeader>

          <CardContent className="text-center space-y-4">
            {status === 'checking' && (
              <p className="text-sm text-gray-600">
                This usually takes just a few seconds... ({countdown}s)
              </p>
            )}

            {status === 'success' && profile && (
              <div className="text-sm text-gray-600">
                <p><strong>Business:</strong> {(profile as any).business_name}</p>
                <p><strong>Plan:</strong> Active subscription</p>
                <p className="text-green-600 mt-2">✓ Welcome email sent to {(profile as any).email}</p>
              </div>
            )}

            {(status === 'timeout' || status === 'error') && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Your subscription is being processed in the background. You can continue to your dashboard.
                </p>
                <Button onClick={handleContinue} className="w-full !text-black">
                  Continue to Dashboard
                </Button>
              </>
            )}

            {sessionId && (
              <p className="text-xs text-gray-400 mt-4">
                Session: {sessionId.slice(0, 20)}...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-blue-600 animate-spin" />
              </div>
              <CardTitle>Loading...</CardTitle>
              <CardDescription>
                Please wait while we process your subscription
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    }>
      <CheckoutSuccessContent />
    </Suspense>
  )
}