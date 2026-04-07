'use client'

import { useState } from 'react'
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
  const router = useRouter()

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
        console.log('Login error details:', {
          message: error.message,
          code: error.code || 'no_code',
          status: error.status || 'no_status'
        })

        // Check for specific unconfirmed email error patterns
        if (error.message.includes('Email not confirmed') ||
            error.message.includes('email not confirmed') ||
            error.message.includes('User not confirmed') ||
            error.message.includes('Please confirm your email') ||
            error.message.includes('not confirmed')) {
          setError('Please confirm your email address before signing in. Check your inbox for the confirmation email.')
          setShowResendOption(true)
          console.log('Showing resend option for unconfirmed email')
        } else if (error.message.includes('Invalid login credentials')) {
          // Could be wrong password OR unconfirmed account
          setError('Invalid email or password. If you haven\'t confirmed your email yet, please check your inbox.')
          setShowResendOption(true)
          console.log('Showing resend option for invalid credentials (might be unconfirmed)')
        } else {
          setError(error.message)
          console.log('Not showing resend option, error was:', error.message)
        }
        return
      }

      if (data.user) {
        // Check if user has completed onboarding
        const { data: profile } = await supabase
          .from('profiles')
          .select('business_name, google_review_url')
          .eq('id', data.user.id)
          .single() as { data: { business_name: string | null, google_review_url: string | null } | null }

        if (profile?.business_name && profile?.google_review_url) {
          router.push('/dashboard')
        } else {
          router.push('/onboarding')
        }
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
          <Button type="submit" className="w-full" disabled={isLoading}>
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