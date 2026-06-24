import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabase-server'

// Data-retention purge (GDPR data minimisation / storage limitation).
//
// Deletes personal data from short-lived operational logs once it's no longer
// needed. These tables exist for rate limiting / abuse detection over a window
// of hours-to-days, so a 90-day retention is well beyond any functional need:
//   - feedback_rate_limit_log : holds visitor IP + user-agent
//   - auto_reply_log          : holds phone numbers (only used for a 24h window)
//
// Backend-only and non-destructive to anything user-facing — it never touches
// customers, review_requests, feedback, or profiles.
const RETENTION_DAYS = 90

function isAuthorized(request: NextRequest): boolean {
  // Same pattern as the other cron routes: allow Vercel's cron invocation or an
  // explicit bearer CRON_SECRET.
  const cronHeader = request.headers.get('x-vercel-cron')
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET
  return !!(cronHeader || (expectedSecret && authHeader === `Bearer ${expectedSecret}`))
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const cutoff = new Date(Date.now() - RETENTION_DAYS * 24 * 60 * 60 * 1000).toISOString()
  const db = supabaseServer as any
  const results: Record<string, number | string> = {}

  // feedback_rate_limit_log — purge by created_at
  const fb = await db
    .from('feedback_rate_limit_log')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff)
  results.feedback_rate_limit_log = fb.error ? `error: ${fb.error.message}` : (fb.count ?? 0)

  // auto_reply_log — purge by replied_at
  const ar = await db
    .from('auto_reply_log')
    .delete({ count: 'exact' })
    .lt('replied_at', cutoff)
  results.auto_reply_log = ar.error ? `error: ${ar.error.message}` : (ar.count ?? 0)

  console.log(`Retention purge (cutoff ${cutoff}):`, results)

  return NextResponse.json({
    success: true,
    retentionDays: RETENTION_DAYS,
    cutoff,
    deleted: results,
  })
}
