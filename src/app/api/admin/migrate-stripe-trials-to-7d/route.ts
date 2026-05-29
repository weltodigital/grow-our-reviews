import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { TRIAL_CONFIG } from '@/lib/pricing'
import type { Database } from '@/types/database'

// One-shot migration endpoint. Shortens any existing Stripe-managed 14-day
// trial to a 7-day trial measured from the user's signup date.
//
// Safe rules:
//   - Only acts on profiles with subscription_status='trialing' AND a
//     stripe_subscription_id.
//   - Computes new trial_end = created_at + TRIAL_CONFIG.durationDays.
//   - If that new trial_end is in the past, skips the row — we never
//     surprise-charge a user who signed up under the old 14-day terms by
//     ending their trial retroactively. They keep the 14-day deal.
//   - Updates both the Stripe subscription (so the actual charge date moves)
//     and the profiles row (so our DB matches).
//
// Auth: requires either Vercel cron header or CRON_SECRET bearer. Trigger
// manually with:
//   curl -H "Authorization: Bearer $CRON_SECRET" \
//        https://app.growourreviews.com/api/admin/migrate-stripe-trials-to-7d
function validateRequest(request: NextRequest): boolean {
  const cronHeader = request.headers.get('x-vercel-cron')
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  return !!(cronHeader || (expectedSecret && authHeader === `Bearer ${expectedSecret}`))
}

export async function POST(request: NextRequest) {
  if (!validateRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 })
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2026-01-28.clover',
  })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    }
  )

  const { data: profiles, error: fetchError } = await (supabase as any)
    .from('profiles')
    .select('id, email, created_at, trial_ends_at, stripe_subscription_id')
    .eq('subscription_status', 'trialing')
    .not('stripe_subscription_id', 'is', null)

  if (fetchError) {
    return NextResponse.json({ error: 'Failed to fetch trialers', details: fetchError.message }, { status: 500 })
  }

  const results: Array<{ id: string; email: string; action: string; detail?: string }> = []

  for (const p of (profiles || []) as Array<{ id: string; email: string; created_at: string; trial_ends_at: string | null; stripe_subscription_id: string }>) {
    try {
      const createdAt = new Date(p.created_at)
      const newTrialEnd = new Date(createdAt.getTime() + TRIAL_CONFIG.durationDays * 24 * 60 * 60 * 1000)

      if (newTrialEnd <= new Date()) {
        results.push({ id: p.id, email: p.email, action: 'skipped', detail: 'New trial_end is in the past — keeping original 14-day terms' })
        continue
      }

      // Stripe wants Unix seconds.
      const newTrialEndUnix = Math.floor(newTrialEnd.getTime() / 1000)

      await stripe.subscriptions.update(p.stripe_subscription_id, {
        trial_end: newTrialEndUnix,
        proration_behavior: 'none',
      })

      await (supabase as any)
        .from('profiles')
        .update({
          trial_ends_at: newTrialEnd.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', p.id)

      results.push({
        id: p.id,
        email: p.email,
        action: 'shortened',
        detail: `trial_end now ${newTrialEnd.toISOString()}`,
      })
    } catch (error: any) {
      results.push({ id: p.id, email: p.email, action: 'failed', detail: error?.message || 'Unknown error' })
    }
  }

  const summary = {
    total: results.length,
    shortened: results.filter(r => r.action === 'shortened').length,
    skipped: results.filter(r => r.action === 'skipped').length,
    failed: results.filter(r => r.action === 'failed').length,
  }

  return NextResponse.json({ summary, results })
}

export async function GET() {
  return NextResponse.json(
    {
      message: 'Use POST with Authorization: Bearer $CRON_SECRET to run the migration.',
    },
    { status: 405 }
  )
}
