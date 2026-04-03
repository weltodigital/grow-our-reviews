import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/database'
import { calculateBillingCycleDate } from '@/lib/billing-cycle'
import { calculateTrialEndDate } from '@/lib/pricing'
import { protectAdminEndpoint } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  // SECURITY: Protect admin endpoint
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for admin operations
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          // Readonly for admin operations
        },
      },
    }
  )

  try {
    // Get all users with potential issues
    const { data: problematicUsers, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .or('monthly_request_limit.lt.150,trial_ends_at.is.null,billing_cycle_date.is.null')

    if (fetchError) {
      throw fetchError
    }

    console.log('Found problematic users:', problematicUsers?.length)

    const fixes = []

    for (const user of problematicUsers || []) {
      const updateData: any = {
        updated_at: new Date().toISOString()
      }

      let needsUpdate = false

      // Fix monthly_request_limit if it's less than 150 and user is trialing
      if ((user as any).monthly_request_limit < 150 &&
          ((user as any).subscription_status === 'trialing' || !(user as any).stripe_subscription_id)) {
        updateData.monthly_request_limit = 150
        needsUpdate = true
      }

      // Fix trial_ends_at if missing and user is trialing
      if (!(user as any).trial_ends_at && (user as any).subscription_status === 'trialing') {
        updateData.trial_ends_at = calculateTrialEndDate(new Date((user as any).created_at || Date.now())).toISOString()
        needsUpdate = true
      }

      // Fix billing_cycle_date if missing
      if (!(user as any).billing_cycle_date) {
        updateData.billing_cycle_date = calculateBillingCycleDate(new Date((user as any).created_at || Date.now()))
        needsUpdate = true
      }

      if (needsUpdate) {
        const { error: updateError } = await (supabase as any)
          .from('profiles')
          .update(updateData)
          .eq('id', (user as any).id)

        if (updateError) {
          console.error(`Error updating user ${(user as any).id}:`, updateError)
          fixes.push({
            userId: (user as any).id,
            email: (user as any).email,
            status: 'error',
            error: updateError.message
          })
        } else {
          fixes.push({
            userId: (user as any).id,
            email: (user as any).email,
            status: 'fixed',
            changes: updateData
          })
        }
      } else {
        fixes.push({
          userId: (user as any).id,
          email: (user as any).email,
          status: 'no_changes_needed'
        })
      }
    }

    return NextResponse.json({
      success: true,
      usersProcessed: problematicUsers?.length || 0,
      fixes
    })

  } catch (error: any) {
    console.error('Error fixing trial users:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fix trial users' },
      { status: 500 }
    )
  }
}