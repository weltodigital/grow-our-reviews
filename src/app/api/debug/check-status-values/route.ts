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

    // Get all distinct status values from review_requests
    const { data: statusCounts, error: statusError } = await (supabase as any)
      .from('review_requests')
      .select('status')

    if (statusError) {
      return NextResponse.json({
        error: 'Failed to fetch status values',
        details: statusError
      }, { status: 500 })
    }

    // Count occurrences of each status
    const statusMap = new Map()
    statusCounts?.forEach((row: any) => {
      const status = row.status
      statusMap.set(status, (statusMap.get(status) || 0) + 1)
    })

    // Get recent requests with their details
    const { data: recentRequests, error: recentError } = await (supabase as any)
      .from('review_requests')
      .select(`
        id,
        status,
        scheduled_for,
        created_at,
        customers!inner(name, phone)
      `)
      .order('created_at', { ascending: false })
      .limit(10)

    if (recentError) {
      return NextResponse.json({
        error: 'Failed to fetch recent requests',
        details: recentError
      }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Status analysis complete',
      currentTime: new Date().toISOString(),
      statusCounts: Object.fromEntries(statusMap),
      recentRequests: recentRequests?.map((req: any) => ({
        id: req.id,
        status: req.status,
        statusType: typeof req.status,
        statusLength: req.status?.length,
        customer: req.customers.name,
        phone: req.customers.phone,
        scheduled_for: req.scheduled_for,
        created_at: req.created_at
      })) || []
    })

  } catch (error) {
    console.error('Error in status debug endpoint:', error)
    return NextResponse.json({
      error: 'Failed to analyze status values',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}