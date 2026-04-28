'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isResending, setIsResending] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [showResendOption, setShowResendOption] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccessMessage('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setIsLoading(true)

    if (!supabase) {
      setError('Service temporarily unavailable')
      setIsLoading(false)
      return
    }

    try {
      // Attempt signup and analyze the response carefully
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback?next=/onboarding`,
        }
      })

      if (error) {
        // Handle specific error cases for better UX
        if (error.message.includes('already registered') ||
            error.message.includes('already been registered') ||
            error.message.includes('email already in use')) {
          setError('This email is already registered. Please sign in instead, or use a different email address.')
        } else {
          setError(error.message)
        }
        return
      }

      if (data.user) {
        // Supabase obfuscates the response when the email is already registered
        // and confirmed: it returns a fake user with identities = []. Real new
        // signups (and re-signups of unconfirmed accounts) have a populated
        // identities array.
        const isAlreadyConfirmed = (data.user.identities?.length ?? 0) === 0

        if (isAlreadyConfirmed) {
          setError('This email is already registered. Please sign in instead, or use a different email address.')
          return
        }

        if (data.session) {
          // Email confirmation disabled at the project level — go straight in.
          router.push('/onboarding')
          return
        }

        // No session means confirmation is pending. We can't reliably tell from
        // the response alone whether this was a brand-new signup or a re-signup
        // of an unconfirmed account (Supabase refreshes created_at and may
        // silently rate-limit the auto-resend), so always offer the resend
        // button. New signups get it as a "didn't arrive?" fallback; re-signups
        // get a guaranteed way to recover an expired confirmation link.
        setSuccessMessage("Please check your email to confirm your account. Don't see it in your inbox or spam folder? Use the button below to resend.")
        setShowResendOption(true)
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
        setSuccessMessage('Confirmation email sent! Please check your inbox and spam folder.')
        setShowResendOption(false)
        setError('')
      }
    } catch (err) {
      setError('Failed to resend confirmation email')
      console.error(err)
    } finally {
      setIsResending(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>
          Start your 14-day free trial. Credit card required - cancel anytime.
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
              minLength={6}
              autoComplete="new-password"
              spellCheck="false"
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={isLoading}
              minLength={6}
              autoComplete="new-password"
              spellCheck="false"
            />
          </div>
          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
              {error}
              {error.includes('already registered') && (
                <div className="mt-2">
                  <Link href="/login" className="underline hover:no-underline" style={{ color: 'var(--accent)' }}>
                    Sign in here →
                  </Link>
                </div>
              )}
            </div>
          )}
          {successMessage && (
            <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded">
              {successMessage}
              {showResendOption && (
                <div className="mt-3 pt-3 border-t border-green-200">
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
          <Button type="submit" className="w-full !text-black" disabled={isLoading}>
            {isLoading ? 'Creating account...' : 'Start free trial'}
          </Button>
        </form>
        <div className="mt-4 text-center text-sm">
          Already have an account?{' '}
          <Link href="/login" className="hover:underline" style={{ color: 'var(--accent)' }}>
            Sign in
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}