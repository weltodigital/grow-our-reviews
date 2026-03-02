'use client'

import { Button } from '@/components/ui/button'
import { LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export function LogoutButton() {
  const supabase = createClient()
  const router = useRouter()

  const handleSignOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleSignOut}
      className="text-gray-500 hover:text-gray-700"
    >
      <LogOut className="h-4 w-4 mr-2" />
      Sign out
    </Button>
  )
}