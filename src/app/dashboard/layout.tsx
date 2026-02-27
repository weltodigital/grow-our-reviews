import { requireUserWithProfile } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard/nav'
import { DashboardHeader } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await requireUserWithProfile()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <DashboardHeader user={user} profile={profile} />

      <div className="flex">
        {/* Desktop sidebar */}
        <DashboardNav className="hidden lg:flex" />

        {/* Main content */}
        <main className="flex-1 lg:ml-64">
          <div className="px-4 py-6 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}