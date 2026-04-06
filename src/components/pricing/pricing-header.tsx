'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getAppUrl } from '@/lib/utils'

export function PricingHeader() {
  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center">
          <Image
            src="/grow-our-reviews-logo.png"
            alt="Grow Our Reviews"
            width={640}
            height={128}
            className="h-16 w-auto"
            priority
          />
        </Link>

        <div className="flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <Link href="/" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
          <Button variant="ghost" asChild>
            <a href={getAppUrl('/login')}>Log In</a>
          </Button>
          <Button asChild>
            <a href={getAppUrl('/signup')}>Start Free Trial</a>
          </Button>
        </div>
      </div>
    </header>
  )
}