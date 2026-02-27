'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Star, Menu, X } from 'lucide-react'
import { useState } from 'react'
import { getAppUrl } from '@/lib/utils'

export function MarketingHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center space-x-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600">
            <Star className="h-5 w-5 text-white fill-white" />
          </div>
          <span className="text-xl font-bold text-gray-900">Grow Our Reviews</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-8">
          <Link href="#how-it-works" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            How It Works
          </Link>
          <Link href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            Pricing
          </Link>
          <Link href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
            FAQ
          </Link>
        </nav>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center space-x-4">
          <Button variant="ghost" asChild>
            <a href={getAppUrl('/login')}>Log In</a>
          </Button>
          <Button asChild>
            <a href={getAppUrl('/signup')}>Start Free Trial</a>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? (
            <X className="h-6 w-6 text-gray-600" />
          ) : (
            <Menu className="h-6 w-6 text-gray-600" />
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="container mx-auto px-4 py-4 space-y-4">
            <nav className="flex flex-col space-y-3">
              <Link
                href="#how-it-works"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                How It Works
              </Link>
              <Link
                href="#features"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Features
              </Link>
              <Link
                href="#pricing"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                Pricing
              </Link>
              <Link
                href="#faq"
                className="text-sm font-medium text-gray-600 hover:text-gray-900 py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                FAQ
              </Link>
            </nav>

            <div className="flex flex-col space-y-2 pt-4 border-t">
              <Button variant="ghost" asChild className="justify-start">
                <a href={getAppUrl('/login')} onClick={() => setMobileMenuOpen(false)}>Log In</a>
              </Button>
              <Button asChild className="justify-start">
                <a href={getAppUrl('/signup')} onClick={() => setMobileMenuOpen(false)}>Start Free Trial</a>
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}