import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() { /* no-op */ },
        },
      }
    )

    const now = new Date().toISOString()

    // Get raw scheduled requests without JOINs
    const { data: rawScheduled, error: rawError } = await (supabase as any)
      .from('review_requests')
      .select('*')
      .eq('status', 'scheduled')

    // Get scheduled requests ready to send without JOINs
    const { data: readyRaw, error: readyRawError } = await (supabase as any)
      .from('review_requests')
      .select('*')
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)

    // Try the exact same query the cron job uses
    const { data: cronQuery, error: cronError } = await (supabase as any)
      .from('review_requests')
      .select(`
        *,
        profiles!inner(business_name, google_review_url, id),
        customers!inner(name, phone)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', now)
      .limit(50)

    return NextResponse.json({
      message: 'Raw request analysis',
      currentTime: now,
      rawScheduledCount: rawScheduled?.length || 0,
      readyRawCount: readyRaw?.length || 0,
      cronQueryCount: cronQuery?.length || 0,
      rawScheduled: rawScheduled?.map(req => ({
        id: req.id,
        status: req.status,
        customer_id: req.customer_id,
        user_id: req.user_id,
        scheduled_for: req.scheduled_for,
        created_at: req.created_at
      })) || [],
      readyRaw: readyRaw?.map(req => ({
        id: req.id,
        scheduled_for: req.scheduled_for,
        isPastDue: new Date(req.scheduled_for) <= new Date(now)
      })) || [],
      cronQueryError: cronError,
      errors: {
        rawError,
        readyRawError,
        cronError
      }
    })

  } catch (error) {
    console.error('Error in raw requests debug:', error)
    return NextResponse.json({
      error: 'Failed to analyze raw requests',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}