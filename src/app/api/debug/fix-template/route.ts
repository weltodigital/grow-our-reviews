import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
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

    // Fix the double "for" in the template
    const { data: updatedTemplate, error } = await (supabase as any)
      .from('sms_templates')
      .update({
        opening_line: 'thanks for choosing {business_name}!'
      })
      .eq('user_id', '51ebb8fb-3550-410b-9eed-555322c81b4b')
      .eq('type', 'initial')
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update template', details: error }, { status: 500 })
    }

    return NextResponse.json({
      message: 'Template fixed successfully',
      updatedTemplate,
      oldValue: 'thanks for choosing for {business_name}!',
      newValue: 'thanks for choosing {business_name}!'
    })

  } catch (error) {
    console.error('Error fixing template:', error)
    return NextResponse.json({
      error: 'Failed to fix template',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}