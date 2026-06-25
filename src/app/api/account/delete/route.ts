import { NextResponse } from 'next/server'
import { createServerSupabase, getUserProfile } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'
import { stripe } from '@/lib/stripe'

// Self-service account deletion (GDPR right to erasure).
//
// Irreversible: cancels any live subscription and erases ALL of the signed-in
// user's data. The UI gates this behind a type-to-confirm step; this route
// independently re-checks the session and only ever touches the authenticated
// user's own records.
export async function POST() {
  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const profile = (await getUserProfile(user.id)) as any

  // 1. Cancel any live Stripe subscription immediately so billing stops. A
  //    Stripe error must not block the data erasure the user asked for, so we
  //    log and continue.
  const subscriptionId = profile?.stripe_subscription_id
  if (subscriptionId && stripe) {
    try {
      await stripe.subscriptions.cancel(subscriptionId)
    } catch (err) {
      console.error(
        'Account deletion: failed to cancel Stripe subscription',
        (err as any)?.message,
      )
    }
  }

  const db = supabaseServer as any

  // 2. Remove rows whose FK to profiles has NO on-delete-cascade. Only
  //    sms_suppressions and auto_reply_log lack it; leaving them would block the
  //    profile (and therefore the auth user) from being deleted.
  await db.from('sms_suppressions').delete().eq('user_id', user.id)
  await db.from('auto_reply_log').delete().eq('user_id', user.id)

  // 3. Delete the auth user. profiles.id -> auth.users(id) is ON DELETE CASCADE,
  //    and every user-scoped table cascades from profiles, so this erases
  //    customers, review_requests, feedback, templates, pending customers, etc.
  //    in one transaction.
  const { error } = await supabaseServer.auth.admin.deleteUser(user.id)
  if (error) {
    console.error('Account deletion failed:', error.message)
    return NextResponse.json(
      { error: 'Failed to delete account. Please contact support.' },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
