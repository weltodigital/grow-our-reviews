'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ShieldCheck, ShieldAlert, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

type EnrollData = {
  factorId: string
  qrCode: string
  secret: string
}

// Two-factor (TOTP) management. Mirrors Supabase's enroll → challenge → verify
// flow:
//   - List factors on mount to show current state.
//   - Enroll creates an UNVERIFIED factor and returns a QR + secret.
//   - The user scans it, enters a 6-digit code, and we challenge+verify to
//     promote the factor to "verified". Until that happens the factor doesn't
//     protect the account, so we clean up stray unverified factors before each
//     new enrollment.
export function TwoFactorSettings() {
  const [loading, setLoading] = useState(true)
  const [verifiedFactorId, setVerifiedFactorId] = useState<string | null>(null)
  const [enroll, setEnroll] = useState<EnrollData | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const refresh = useCallback(async () => {
    if (!supabase) {
      setError('Service temporarily unavailable')
      setLoading(false)
      return
    }
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }
    const verified = data.totp.find((f) => f.status === 'verified')
    setVerifiedFactorId(verified?.id ?? null)
    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const startEnrollment = async () => {
    if (!supabase) return
    setError('')
    setSuccess('')
    setBusy(true)
    try {
      // Remove any leftover unverified factors so a re-attempt doesn't collide
      // on the friendly name or pile up dead factors. listFactors().totp only
      // contains verified factors, so unverified ones must be found via .all.
      const { data: list } = await supabase.auth.mfa.listFactors()
      for (const f of list?.all ?? []) {
        if (f.factor_type === 'totp' && f.status === 'unverified') {
          await supabase.auth.mfa.unenroll({ factorId: f.id })
        }
      }

      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator app',
      })
      if (error) {
        setError(error.message)
        return
      }
      setEnroll({
        factorId: data.id,
        qrCode: data.totp.qr_code,
        secret: data.totp.secret,
      })
      setCode('')
    } finally {
      setBusy(false)
    }
  }

  const cancelEnrollment = async () => {
    if (supabase && enroll) {
      await supabase.auth.mfa.unenroll({ factorId: enroll.factorId })
    }
    setEnroll(null)
    setCode('')
    setError('')
  }

  const confirmEnrollment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase || !enroll) return
    setError('')
    setBusy(true)
    try {
      const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: enroll.factorId,
      })
      if (challengeError) {
        setError(challengeError.message)
        return
      }
      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: enroll.factorId,
        challengeId: challenge.id,
        code: code.trim(),
      })
      if (verifyError) {
        setError('That code didn\'t match. Check your authenticator app and try again.')
        return
      }
      setEnroll(null)
      setCode('')
      setSuccess('Two-factor authentication is now enabled.')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  const disable = async () => {
    if (!supabase || !verifiedFactorId) return
    if (!confirm('Turn off two-factor authentication? Your account will be less secure.')) return
    setError('')
    setBusy(true)
    try {
      const { error } = await supabase.auth.mfa.unenroll({ factorId: verifiedFactorId })
      if (error) {
        setError(error.message)
        return
      }
      setSuccess('Two-factor authentication has been turned off.')
      await refresh()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {verifiedFactorId ? (
            <ShieldCheck className="h-5 w-5 text-green-600" />
          ) : (
            <ShieldAlert className="h-5 w-5 text-orange-500" />
          )}
          Two-Factor Authentication
          {verifiedFactorId && (
            <Badge className="bg-green-100 text-green-800 border-green-200">Enabled</Badge>
          )}
        </CardTitle>
        <CardDescription>
          Add a one-time code from an authenticator app (Google Authenticator, Authy, 1Password)
          on top of your password.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <div className="text-sm text-red-600 bg-red-50 border border-red-200 p-3 rounded">
            {error}
          </div>
        )}
        {success && (
          <div className="text-sm text-green-700 bg-green-50 border border-green-200 p-3 rounded">
            {success}
          </div>
        )}

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        ) : enroll ? (
          // Enrollment in progress: show QR + secret + code entry.
          <form onSubmit={confirmEnrollment} className="space-y-4">
            <p className="text-sm text-gray-600">
              Scan this QR code with your authenticator app, then enter the 6-digit code it shows.
            </p>
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
              {/* Supabase returns the QR as a usable image source (data URI). */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={enroll.qrCode}
                alt="Two-factor QR code"
                className="h-44 w-44 border rounded bg-white p-2"
              />
              <div className="text-sm text-gray-600">
                <p className="mb-1">Can&apos;t scan it? Enter this key manually:</p>
                <code className="block break-all rounded bg-gray-100 px-2 py-1 text-xs">
                  {enroll.secret}
                </code>
              </div>
            </div>
            <div>
              <Label htmlFor="mfa-code">6-digit code</Label>
              <Input
                id="mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]*"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                disabled={busy}
                required
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || code.length !== 6} className="!text-black">
                {busy ? 'Verifying…' : 'Verify and enable'}
              </Button>
              <Button type="button" variant="outline" onClick={cancelEnrollment} disabled={busy}>
                Cancel
              </Button>
            </div>
          </form>
        ) : verifiedFactorId ? (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              You&apos;ll be asked for a code from your authenticator app each time you sign in.
            </p>
            <Button variant="outline" onClick={disable} disabled={busy}>
              {busy ? 'Working…' : 'Turn off'}
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Two-factor authentication is currently off.
            </p>
            <Button onClick={startEnrollment} disabled={busy} className="!text-black">
              {busy ? 'Starting…' : 'Enable 2FA'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
