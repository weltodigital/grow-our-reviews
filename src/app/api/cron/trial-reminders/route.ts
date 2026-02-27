import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')

    // Verify cron job authentication (you can use Vercel cron secret or other method)
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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
            // No-op for server context
          },
        },
      }
    )

    // Find users whose trial ends in 2 days and haven't been notified
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

    const { data: profiles, error } = await (supabase as any)
      .from('profiles')
      .select('id, email, business_name, trial_ends_at, trial_reminder_sent')
      .eq('subscription_status', 'trialing')
      .lte('trial_ends_at', twoDaysFromNow.toISOString())
      .is('trial_reminder_sent', null)

    if (error) {
      console.error('Error fetching profiles for trial reminders:', error)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    const results = []

    for (const profile of profiles || []) {
      try {
        // Send trial ending email
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/trial-ending`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: profile.email,
            businessName: profile.business_name,
            trialEndsAt: profile.trial_ends_at,
          }),
        })

        if (emailResponse.ok) {
          // Mark reminder as sent
          await (supabase as any)
            .from('profiles')
            .update({
              trial_reminder_sent: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', profile.id)

          results.push({
            userId: profile.id,
            email: profile.email,
            status: 'sent'
          })
        } else {
          results.push({
            userId: profile.id,
            email: profile.email,
            status: 'failed'
          })
        }
      } catch (error) {
        console.error(`Failed to send trial reminder to ${profile.email}:`, error)
        results.push({
          userId: profile.id,
          email: profile.email,
          status: 'error'
        })
      }
    }

    return NextResponse.json({
      success: true,
      processed: results.length,
      results
    })
  } catch (error) {
    console.error('Trial reminder cron job error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}