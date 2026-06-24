'use client'

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { ShieldCheck, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'

// Per-session dismissal: the nudge reappears in a new session (until 2FA is
// actually enabled) but won't pester the user repeatedly within one session.
const DISMISS_KEY = 'gor_2fa_banner_dismissed'

// Prompts users who haven't enabled two-factor authentication to set it up.
// Self-contained: checks the user's MFA factors client-side and hides itself
// once a verified factor exists, so no server prop wiring is needed.
export default function TwoFactorBanner() {
  const [show, setShow] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    if (!supabase) return
    if (sessionStorage.getItem(DISMISS_KEY) === '1') return

    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (cancelled || error) return
      // listFactors().totp contains only verified factors, so a non-empty list
      // means 2FA is already on.
      const hasVerified = (data?.totp ?? []).length > 0
      if (!hasVerified) setShow(true)
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const dismiss = () => {
    try {
      sessionStorage.setItem(DISMISS_KEY, '1')
    } catch {
      // Ignore storage failures (e.g. private mode) — worst case it shows again.
    }
    setShow(false)
  }

  // Don't nag on the settings page itself — the 2FA control lives there.
  if (!show || pathname?.startsWith('/dashboard/settings')) {
    return null
  }

  return (
    <div className="bg-blue-50 border-b border-blue-200">
      <div className="px-4 py-3 sm:px-6 lg:px-8">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <ShieldCheck className="h-6 w-6 text-blue-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-blue-900">
              Add an extra layer of security
            </h3>
            <p className="mt-1 text-sm text-blue-700">
              Protect your account with two-factor authentication. It takes about a minute
              to set up with an authenticator app.
            </p>
            <div className="mt-3">
              <Button size="sm" asChild className="!text-black">
                <a href="/dashboard/settings#two-factor">Set up 2FA</a>
              </Button>
            </div>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="Dismiss"
            className="flex-shrink-0 text-blue-500 hover:text-blue-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  )
}
