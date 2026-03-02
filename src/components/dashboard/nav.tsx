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
      'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 pt-20 lg:pt-0 flex flex-col',
      className
    )}>
      <div className="flex h-16 items-center px-6 lg:h-20 border-b border-gray-100">
        <Link href="/dashboard" className="flex items-center">
          <div className="text-xl font-bold text-blue-600">
            Grow Our Reviews
          </div>
        </Link>
      </div>

      <div className="flex-1 px-4 py-6">
        <ul className="space-y-2">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border-l-4 border-blue-600 shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 hover:translate-x-1'
                  )}
                >
                  <item.icon className={cn(
                    'h-5 w-5',
                    isActive ? 'text-blue-600' : 'text-gray-400'
                  )} />
                  {item.name}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Sidebar footer */}
      <div className="p-4 border-t border-gray-100">
        <div className="text-xs text-gray-500 text-center">
          Grow Our Reviews
        </div>
      </div>
    </nav>
  )
}