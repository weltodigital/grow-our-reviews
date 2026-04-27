'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'

export type ConsentState = 'accepted' | 'rejected' | null

interface ConsentContextValue {
  consent: ConsentState
  setConsent: (value: 'accepted' | 'rejected') => void
  /** Re-open the banner so the user can change their decision. */
  resetConsent: () => void
  /** True until we've read localStorage on the client; lets components avoid an SSR/CSR flash. */
  hydrated: boolean
}

const STORAGE_KEY = 'consent-v1'
const CONSENT_CHANGE_EVENT = 'consent-change'

const ConsentContext = createContext<ConsentContextValue | null>(null)

export function ConsentProvider({ children }: { children: React.ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState>(null)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY)
      if (stored === 'accepted' || stored === 'rejected') {
        setConsentState(stored)
      }
    } catch {
      // localStorage unavailable (private mode in some browsers); default to null.
    }
    setHydrated(true)

    // Allow other tabs to update consent in real time.
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        if (e.newValue === 'accepted' || e.newValue === 'rejected') {
          setConsentState(e.newValue)
        } else {
          setConsentState(null)
        }
      }
    }
    const onCustom = () => {
      try {
        const stored = window.localStorage.getItem(STORAGE_KEY)
        setConsentState(stored === 'accepted' || stored === 'rejected' ? stored : null)
      } catch {
        // ignore
      }
    }
    window.addEventListener('storage', onStorage)
    window.addEventListener(CONSENT_CHANGE_EVENT, onCustom)
    return () => {
      window.removeEventListener('storage', onStorage)
      window.removeEventListener(CONSENT_CHANGE_EVENT, onCustom)
    }
  }, [])

  const setConsent = useCallback((value: 'accepted' | 'rejected') => {
    try {
      window.localStorage.setItem(STORAGE_KEY, value)
    } catch {
      // ignore
    }
    setConsentState(value)
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
  }, [])

  const resetConsent = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY)
    } catch {
      // ignore
    }
    setConsentState(null)
    window.dispatchEvent(new Event(CONSENT_CHANGE_EVENT))
  }, [])

  return (
    <ConsentContext.Provider value={{ consent, setConsent, resetConsent, hydrated }}>
      {children}
    </ConsentContext.Provider>
  )
}

export function useConsent(): ConsentContextValue {
  const ctx = useContext(ConsentContext)
  if (!ctx) {
    throw new Error('useConsent must be used inside <ConsentProvider>')
  }
  return ctx
}
