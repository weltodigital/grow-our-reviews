import { requireUserWithProfile } from '@/lib/auth'
import { DashboardNav } from '@/components/dashboard/nav'
import { DashboardHeader } from '@/components/dashboard/header'
import { LogoutButton } from '@/components/dashboard/logout-button'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, profile } = await requireUserWithProfile()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Desktop sidebar */}
        <DashboardNav className="hidden lg:flex" />

        {/* Main content area */}
        <div className="flex-1 lg:ml-64">
          {/* Desktop header */}
          <div className="hidden lg:block">
            <div className="flex h-16 items-center justify-between bg-white px-6 shadow-sm border-b border-gray-200">
              <h1 className="text-lg font-semibold text-gray-900">
                Welcome back, {profile.business_name}
              </h1>
              <div className="flex items-center gap-4">
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
                <LogoutButton />
              </div>
            </div>
          </div>

          {/* Mobile header */}
          <DashboardHeader user={user} profile={profile} />

          {/* Page content */}
          <main>
            <div className="px-4 py-6 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}