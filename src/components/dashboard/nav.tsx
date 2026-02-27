'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  Home,
  Plus,
  List,
  MessageSquare,
  Settings,
  CreditCard
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: Home },
  { name: 'Send Request', href: '/dashboard/send', icon: Plus },
  { name: 'All Requests', href: '/dashboard/requests', icon: List },
  { name: 'Feedback', href: '/dashboard/feedback', icon: MessageSquare },
  { name: 'Settings', href: '/dashboard/settings', icon: Settings },
  { name: 'Billing', href: '/dashboard/billing', icon: CreditCard },
]

interface DashboardNavProps {
  className?: string
}

export function DashboardNav({ className }: DashboardNavProps) {
  const pathname = usePathname()

  return (
    <nav className={cn(
      'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 pt-20 lg:pt-0',
      className
    )}>
      <div className="flex h-16 items-center px-6 lg:h-20">
        <Link href="/dashboard" className="flex items-center">
          <div className="text-xl font-bold text-blue-600">
            Grow Our Reviews
          </div>
        </Link>
      </div>

      <div className="px-4 py-6">
        <ul className="space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}