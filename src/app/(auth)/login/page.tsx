'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [showResendOption, setShowResendOption] = useState(false)
  const [resendMessage, setResendMessage] = useState('')
  // Two-factor challenge state. When the signed-in user has a verified TOTP
  // factor we hold them on a code-entry step instead of redirecting.
  const [mfaRequired, setMfaRequired] = useState(false)
  const [mfaCode, setMfaCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [mfaChallengeId, setMfaChallengeId] = useState('')
  const router = useRouter()

  // If we arrive with an existing aal1 session that still needs aal2 (e.g. the
  // server bounced a partially-authenticated user back here), skip the password
  // form and go straight to the code prompt.
  useEffect(() => {
    if (!supabase) return
    let cancelled = false
    ;(async () => {
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (cancelled || !aal || aal.nextLevel !== 'aal2' || aal.nextLevel === aal.currentLevel) {
        return
      }
      const { data: factors } = await supabase.auth.mfa.listFactors()
      const totp = factors?.totp?.find((f) => f.status === 'verified')
      if (!totp) return
      const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: totp.id })
      if (cancelled || !challenge) return
      setMfaFactorId(totp.id)
      setMfaChallengeId(challenge.id)
      setMfaRequired(true)
    })()
    return () => {
      cancelled = true
    }
  }, [])

  // Profile-aware redirect, shared by the password path and the post-2FA path.
  // Under the no-card trial flow, trialing users with no Stripe customer are
  // allowed into the dashboard as long as their trial_ends_at hasn't passed.
  const completeLogin = async (userId: string) => {
    if (!supabase) {
      setError('Service temporarily unavailable')
      return
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('business_name, google_review_url, stripe_customer_id, subscription_status, trial_ends_at')
      .eq('id', userId)
      .single() as { data: { business_name: string | null, google_review_url: string | null, stripe_customer_id: string | null, subscription_status: string | null, trial_ends_at: string | null } | null }

    const now = new Date()
    const trialIsActive =
      profile?.subscription_status === 'trialing' &&
      profile.trial_ends_at !== null &&
      new Date(profile.trial_ends_at) > now
    const subscriptionIsActive =
      (profile?.subscription_status === 'active' ||
        profile?.subscription_status === 'cancelled') &&
      !!profile?.stripe_customer_id

    if (!profile?.business_name) {
      router.push('/onboarding')
    } else if (!trialIsActive && !subscriptionIsActive) {
      router.push('/billing/setup')
    } else {
      router.push('/dashboard')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShowResendOption(false)
    setResendMessage('')
    setIsLoading(true)

    if (!supabase) {
      setError('Service temporarily unavailable')
      setIsLoading(false)
      return
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Check for specific unconfirmed email error patterns
        if (error.message.includes('Email not confirmed') ||
            error.message.includes('email not confirmed') ||
            error.message.includes('User not confirmed') ||
            error.message.includes('Please confirm your email') ||
            error.message.includes('not confirmed')) {
          setError('Please confirm your email address before signing in. Check your inbox for the confirmation email.')
          setShowResendOption(true)
        } else if (error.message.includes('Invalid login credentials')) {
          // Could be wrong password OR unconfirmed account
          setError('Invalid email or password. If you haven\'t confirmed your email yet, please check your inbox.')
          setShowResendOption(true)
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // If the account has a verified second factor, password alone only gets
        // us to aal1 — we must challenge for a TOTP code before proceeding.
        const { data: aal, error: aalError } =
          await supabase.auth.mfa.getAuthenticatorAssuranceLevel()

        if (!aalError && aal?.nextLevel === 'aal2' && aal.nextLevel !== aal.currentLevel) {
          const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
          const totp = factors?.totp?.find((f) => f.status === 'verified')

          if (factorError || !totp) {
            setError('Could not start two-factor verification. Please try again.')
            return
          }

          const { data: challenge, error: challengeError } =
            await supabase.auth.mfa.challenge({ factorId: totp.id })
          if (challengeError) {
            setError(challengeError.message)
            return
          }

          setMfaFactorId(totp.id)
          setMfaChallengeId(challenge.id)
          setMfaCode('')
          setMfaRequired(true)
          return
        }

        await completeLogin(data.user.id)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyMfa = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    if (!supabase) {
      setError('Service temporarily unavailable')
      setIsLoading(false)
      return
    }

    try {
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: mfaCode.trim(),
      })

      if (verifyError) {
        // A challenge is single-use, so mint a fresh one for the retry.
        const { data: challenge } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
        if (challenge) setMfaChallengeId(challenge.id)
        setMfaCode('')
        setError('That code didn\'t match. Please try again.')
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await completeLogin(user.id)
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setError('Please enter your email address first')
      return
    }

    setIsResending(true)
    setResendMessage('')

    if (!supabase) {
      setError('Service temporarily unavailable')
      setIsResending(false)
      return
    }

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        }
      })

      if (error) {
        setError(`Failed to resend confirmation email: ${error.message}`)
      } else {
        setResendMessage('Confirmation email sent! Please check your inbox and spam folder.')
        setShowResendOption(false)
      }
    } catch (err) {
      setError('Failed to resend confirmation email')
      console.error(err)
    } finally {
      setIsResending(false)
    }
  }

  // Two-factor challenge step — shown after a correct password when the account
  // has a verified authenticator factor.
  if (mfaRequired) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Two-step verification</CardTitle>
          <CardDescription>
            Enter the 6-digit code from your authenticator app to finish signing in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleVerifyMfa} className="space-y-4">
            <div>
              <Label htmlFor="mfa-code">Authentication code</Label>
              <Input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                disabled={isLoading}
                autoFocus
                required
              />
            </div>
            {error && (
              <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
                {error}
              </div>
            )}
            <Button
              type="submit"
              className="w-full !text-black"
              disabled={isLoading || mfaCode.length !== 6}
            >
              {isLoading ? 'Verifying...' : 'Verify'}
            </Button>
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in to your account</CardTitle>
        <CardDescription>
          Enter your email and password to access your dashboard
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </div>
          <div>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={isLoading}
              autoComplete="current-password"
              spellCheck="false"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
              {showResendOption && (
                <div className="mt-3 pt-3 border-t border-red-200">
                  <p className="text-sm text-gray-600 mb-2">
                    Need a new confirmation email?
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleResendConfirmation}
                    disabled={isResending || !email}
                    className="text-sm"
                  >
                    {isResending ? 'Sending...' : 'Resend confirmation email'}
                  </Button>
                </div>
              )}
            </div>
          )}
          {resendMessage && (
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded">
              {resendMessage}
            </div>
          )}
          <Button type="submit" className="w-full !text-black" disabled={isLoading}>
            {isLoading ? 'Signing in...' : 'Sign in'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm space-y-2">
          <div>
            <Link href="/reset-password" className="hover:underline" style={{ color: 'var(--accent)' }}>
              Forgot your password?
            </Link>
          </div>
          <div>
            Don't have an account?{' '}
            <Link href="/signup" className="hover:underline" style={{ color: 'var(--accent)' }}>
              Sign up
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
