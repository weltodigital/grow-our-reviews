import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { sendAbandonedSignupRecoveryEmail } from '@/lib/resend'
import type { Database } from '@/types/database'

// Vercel cron auth header check, matching the rest of the cron routes.
function validateCronRequest(request: NextRequest): boolean {
  const cronHeader = request.headers.get('x-vercel-cron')
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  return !!(cronHeader || (expectedSecret && authHeader === `Bearer ${expectedSecret}`))
}

// Send the abandoned-signup recovery email to users who completed onboarding
// but never reached Stripe Checkout. Window: 24h-30d after signup. Each user
// receives this exactly once, gated by profiles.recovery_email_sent_at.
export async function GET(request: NextRequest) {
  if (!validateCronRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

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

  const now = Date.now()
  const oneDayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString()
  const thirtyDaysAgo = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString()

  try {
    // Abandoned signup = completed onboarding (has business_name) but never
    // reached Stripe (no stripe_customer_id) and we haven't already emailed
    // them. Lower bound (24h) gives users a chance to come back on their own
    // before nudging. Upper bound (30d) keeps the email feeling timely; older
    // signups are unlikely to convert from a recovery nudge.
    const { data: profiles, error: fetchError } = await (supabase as any)
      .from('profiles')
      .select('id, email, business_name')
      .is('stripe_customer_id', null)
      .not('business_name', 'is', null)
      .is('recovery_email_sent_at', null)
      .lte('created_at', oneDayAgo)
      .gte('created_at', thirtyDaysAgo)
      .limit(50)

    if (fetchError) {
      console.error('Error fetching abandoned signups:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch abandoned signups' },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        message: 'No abandoned signups to recover',
        processed: 0,
      })
    }

    const sentCount = { success: 0, failed: 0 }
    const results: Array<{ id: string; email: string; status: 'success' | 'failed'; error?: string }> = []

    for (const profile of profiles as Array<{ id: string; email: string; business_name: string }>) {
      try {
        const result = await sendAbandonedSignupRecoveryEmail(
          profile.email,
          profile.business_name || 'there'
        )

        if (!result.success) {
          sentCount.failed++
          results.push({ id: profile.id, email: profile.email, status: 'failed', error: result.error })
          continue
        }

        // Stamp the column so we never send this user a second recovery
        // email. If the stamp UPDATE fails we still count it as failed and
        // skip — better to re-email on the next run than silently double-send.
        const { error: updateError } = await (supabase as any)
          .from('profiles')
          .update({
            recovery_email_sent_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', profile.id)

        if (updateError) {
          console.error(`Failed to stamp recovery_email_sent_at for ${profile.id}:`, updateError)
          sentCount.failed++
          results.push({ id: profile.id, email: profile.email, status: 'failed', error: 'Stamp update failed' })
          continue
        }

        sentCount.success++
        results.push({ id: profile.id, email: profile.email, status: 'success' })
      } catch (error) {
        console.error(`Error processing abandoned signup ${profile.id}:`, error)
        sentCount.failed++
        results.push({
          id: profile.id,
          email: profile.email,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }

      // Small spacing between sends so we don't burst against Resend's rate limit.
      await new Promise(resolve => setTimeout(resolve, 100))
    }

    console.log(`Abandoned signup recovery: ${sentCount.success} sent, ${sentCount.failed} failed`)

    return NextResponse.json({
      message: 'Abandoned signup recovery completed',
      processed: profiles.length,
      success: sentCount.success,
      failed: sentCount.failed,
      results,
    })
  } catch (error) {
    console.error('Unexpected error in abandoned signup recovery cron:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
