'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Star, ArrowLeft } from 'lucide-react'
import { getAppUrl } from '@/lib/utils'

export function PricingHeader() {
  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Star className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Grow Our Reviews</span>
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