import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function GET(request: NextRequest) {
  try {
    // Check if user is authenticated and is admin
    const { searchParams } = new URL(request.url)
    const secret = searchParams.get('secret')

    if (secret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return []
          },
          setAll() {
            // No-op for server-side
          },
        },
      }
    )

    const now = new Date()
    const nowISO = now.toISOString()

    // Check all scheduled requests
    const { data: allScheduled, error: allError } = await (supabase as any)
      .from('review_requests')
      .select(`
        *,
        profiles!inner(business_name, google_review_url, id),
        customers!inner(name, phone)
      `)
      .eq('status', 'scheduled')

    if (allError) {
      return NextResponse.json({
        error: 'Failed to fetch scheduled requests',
        details: allError
      }, { status: 500 })
    }

    // Check which ones should be sent now
    const { data: readyToSend, error: readyError } = await (supabase as any)
      .from('review_requests')
      .select(`
        *,
        profiles!inner(business_name, google_review_url, id),
        customers!inner(name, phone)
      `)
      .eq('status', 'scheduled')
      .lte('scheduled_for', nowISO)

    if (readyError) {
      return NextResponse.json({
        error: 'Failed to fetch ready requests',
        details: readyError
      }, { status: 500 })
    }

    // Get environment info (without exposing sensitive data)
    const envCheck = {
      hasTwilioSid: !!process.env.TWILIO_ACCOUNT_SID,
      hasTwilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasTwilioPhone: !!process.env.TWILIO_PHONE_NUMBER,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
      currentTime: nowISO
    }

    return NextResponse.json({
      message: 'Scheduled requests debug info',
      currentTime: nowISO,
      environment: envCheck,
      allScheduledCount: allScheduled?.length || 0,
      readyToSendCount: readyToSend?.length || 0,
      allScheduled: allScheduled?.map((req: any) => ({
        id: req.id,
        customer: req.customers.name,
        phone: req.customers.phone,
        scheduled_for: req.scheduled_for,
        created_at: req.created_at,
        business: req.profiles.business_name,
        isReady: new Date(req.scheduled_for) <= now
      })) || [],
      readyToSend: readyToSend?.map((req: any) => ({
        id: req.id,
        customer: req.customers.name,
        phone: req.customers.phone,
        scheduled_for: req.scheduled_for,
        timeDiff: now.getTime() - new Date(req.scheduled_for).getTime()
      })) || []
    })

  } catch (error) {
    console.error('Error in debug endpoint:', error)
    return NextResponse.json(
      {
        error: 'Failed to check scheduled requests',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}