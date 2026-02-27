'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Menu, X, LogOut } from 'lucide-react'
import { DashboardNav } from './nav'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

interface DashboardHeaderProps {
  user: User
  profile: Database['public']['Tables']['profiles']['Row']
}

export function DashboardHeader({ user, profile }: DashboardHeaderProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile header */}
      <div className="sticky top-0 z-40 lg:hidden">
        <div className="flex h-16 items-center justify-between bg-white px-4 shadow-sm">
          <Link href="/dashboard" className="flex items-center">
            <div className="text-lg font-bold text-blue-600">
              Grow Our Reviews
            </div>
          </Link>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 hidden sm:block">
              {profile.business_name}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="lg:hidden"
            >
              {mobileNavOpen ? (
                <X className="h-4 w-4" />
              ) : (
                <Menu className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Desktop header - user info */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-50 lg:flex lg:w-96 lg:flex-col">
        <div className="flex h-16 items-center justify-between bg-white px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
              {profile.business_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900">
                {profile.business_name}
              </span>
              <span className="text-xs text-gray-500">
                {user.email}
              </span>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleSignOut}
            className="text-gray-500 hover:text-gray-700"
          >
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Mobile navigation overlay */}
      {mobileNavOpen && (
        <div className="lg:hidden">
          <div className="fixed inset-0 z-50">
            <div
              className="fixed inset-0 bg-gray-900/50"
              onClick={() => setMobileNavOpen(false)}
            />
            <DashboardNav className="relative" />

            {/* Mobile user info */}
            <div className="absolute bottom-0 left-0 right-0 w-64 bg-white border-t border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                    {profile.business_name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-gray-900">
                      {profile.business_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {user.email}
                    </span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSignOut}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}