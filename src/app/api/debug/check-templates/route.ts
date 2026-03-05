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
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() { /* no-op */ },
        },
      }
    )

    // Get all SMS templates
    const { data: templates, error } = await (supabase as any)
      .from('sms_templates')
      .select('*')

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch templates', details: error }, { status: 500 })
    }

    return NextResponse.json({
      message: 'SMS templates analysis',
      templates: templates || [],
      templateCount: templates?.length || 0
    })

  } catch (error) {
    console.error('Error in template debug:', error)
    return NextResponse.json({
      error: 'Failed to analyze templates',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}