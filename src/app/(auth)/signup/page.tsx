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
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
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
        console.log('Signup response data:', {
          user: data.user,
          session: data.session,
          userCreatedAt: data.user.created_at,
          currentTime: new Date().toISOString(),
          timeDiff: data.user.created_at ? new Date().getTime() - new Date(data.user.created_at).getTime() : 'N/A',
          emailConfirmedAt: data.user.email_confirmed_at,
          lastSignInAt: data.user.last_sign_in_at
        })

        // Key insight: Supabase updates created_at on duplicate signups, making timestamp unreliable
        // Instead, check for patterns that indicate an existing user:

        // Pattern 1: User has no session AND no email confirmation (likely existing unconfirmed user)
        // Pattern 2: User has email_confirmed_at set (definitely existing confirmed user)
        // Pattern 3: User has last_sign_in_at set (definitely existing user who signed in before)

        const hasEmailConfirmation = data.user.email_confirmed_at !== null
        const hasSignInHistory = data.user.last_sign_in_at !== null
        const hasNoSession = !data.session

        // If user has confirmation or sign-in history, they're definitely existing
        if (hasEmailConfirmation || hasSignInHistory) {
          setError('This email is already registered. Please sign in instead, or use a different email address.')
          return
        }

        // If no session and no confirmation, this is likely a duplicate of unconfirmed account
        // But we can't be 100% sure, so we'll let it proceed but track this case
        if (hasNoSession && !hasEmailConfirmation) {
          console.log('Potential duplicate unconfirmed account - allowing to proceed but suspicious')
        }

        // Check if user needs to confirm email (legitimate new signup or re-send confirmation)
        if (data.session) {
          // User is immediately logged in, redirect to onboarding
          router.push('/onboarding')
        } else {
          // User needs to confirm email first
          setSuccessMessage('Please check your email to confirm your account, then you\'ll be redirected to complete your subscription setup. Don\'t forget to check your spam or junk folder if you don\'t see it in your inbox.')
        }
      }
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setIsLoading(false)
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
            <div className="text-sm text-green-600 bg-green-50 border border-green-200 p-3 rounded">
              {successMessage}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
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