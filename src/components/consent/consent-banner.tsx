'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useConsent } from './consent-context'

export function ConsentBanner() {
  const { consent, setConsent, hydrated } = useConsent()

  // Don't render server-side or before we know whether the user has decided.
  // Avoids an SSR/CSR flash and prevents the banner appearing for users who
  // already chose.
  if (!hydrated || consent !== null) return null

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      aria-live="polite"
      className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="mx-auto max-w-3xl rounded-lg border border-gray-200 bg-white p-4 shadow-lg sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
          <p className="text-sm text-gray-700 sm:flex-1">
            We use cookies to understand how you use the site and to measure marketing performance.{' '}
            <Link href="/cookies" className="underline text-gray-900 hover:text-green-700">
              Learn more
            </Link>
            .
          </p>
          <div className="flex gap-2 sm:shrink-0">
            <Button
              variant="outline"
              onClick={() => setConsent('rejected')}
              className="flex-1 sm:flex-initial"
            >
              Reject
            </Button>
            <Button
              onClick={() => setConsent('accepted')}
              className="flex-1 sm:flex-initial !text-black"
            >
              Accept
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
