'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

function ConfirmResetPasswordForm() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Handle password reset callback
    const handlePasswordReset = async () => {
      if (!supabase) {
        setError('Service temporarily unavailable')
        return
      }

      // Check for auth code in URL params (legacy format from existing reset links)
      const urlParams = new URLSearchParams(window.location.search)
      const code = urlParams.get('code')

      if (code) {
        console.log('Auth code detected in confirm page, attempting exchange')
        try {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error('Code exchange error on confirm page:', error)
            setError(`Authentication failed: ${error.message}`)
            return
          }

          if (data.session) {
            console.log('Code exchange successful, session established for:', data.session.user?.email)
            // Clear the URL params
            window.history.replaceState(null, '', window.location.pathname)
            return
          }
        } catch (err) {
          console.error('Code exchange error:', err)
          setError('Failed to authenticate. Please try requesting a new reset link.')
          return
        }
      }

      // Check for auth tokens in URL hash (Supabase password reset format)
      const hashParams = new URLSearchParams(window.location.hash.substring(1))
      const accessToken = hashParams.get('access_token')
      const refreshToken = hashParams.get('refresh_token')
      const type = hashParams.get('type')

      console.log('Password reset confirmation - type:', type)
      console.log('Has access token:', !!accessToken)

      if (type === 'recovery' && accessToken && refreshToken) {
        try {
          // Set the session using the tokens from URL
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken
          })

          if (error) {
            console.error('Session setup error:', error)
            setError('Failed to verify reset link. Please request a new one.')
            return
          }

          if (data.session) {
            console.log('Password reset session established for:', data.session.user?.email)
            // Clear the URL hash
            window.history.replaceState(null, '', window.location.pathname)
            return
          }
        } catch (err) {
          console.error('Password reset session error:', err)
          setError('Failed to establish reset session.')
          return
        }
      }

      // If no recovery tokens or codes, check for regular session
      const { data, error } = await supabase.auth.getSession()
      if (error || !data.session) {
        setError('Invalid reset link. Please request a new one.')
      }
    }

    handlePasswordReset()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

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
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) {
        setError(error.message)
        return
      }

      router.push('/dashboard')
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
        <CardTitle>Set new password</CardTitle>
        <CardDescription>
          Enter your new password below
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="password">New Password</Label>
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
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
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
            <div className="text-sm text-red-600 bg-red-50 p-3 rounded">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Updating password...' : 'Update password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

export default function ConfirmResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmResetPasswordForm />
    </Suspense>
  )
}