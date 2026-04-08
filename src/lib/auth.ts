import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/database'
import type { NextRequest, NextResponse } from 'next/server'

export async function createServerSupabase() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

export async function createRouteSupabase(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          })
        },
      },
    }
  )
}

export async function getUser() {
  const supabase = await createServerSupabase()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  return user
}

export async function requireAuth() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  return user
}

export async function getUserProfile(userId: string) {
  const supabase = await createServerSupabase()

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return profile
}

export async function requireUserWithProfile(): Promise<{ user: any; profile: any }> {
  const user = await requireAuth()
  const profile = await getUserProfile(user.id)

  if (!profile) {
    redirect('/onboarding')
    throw new Error('Redirected to onboarding')
  }

  // Now TypeScript knows profile is not null, so we cast it to help with type inference
  const validProfile = profile as NonNullable<typeof profile>

  // Check if user has completed onboarding and billing setup
  if (!validProfile.business_name || !validProfile.google_review_url) {
    redirect('/onboarding')
    throw new Error('Redirected to onboarding')
  }

  if (!validProfile.stripe_customer_id || !validProfile.subscription_status || !['active', 'trialing'].includes(validProfile.subscription_status as string)) {
    redirect('/billing/setup')
    throw new Error('Redirected to billing setup')
  }

  return { user, profile: validProfile }
}