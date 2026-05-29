import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

// Protect the cron endpoint - Vercel automatically handles cron authentication
function validateCronRequest(request: NextRequest): boolean {
  // Check for Vercel cron header
  const cronHeader = request.headers.get('x-vercel-cron')

  // Also check for custom secret as fallback
  const authHeader = request.headers.get('authorization')
  const expectedSecret = process.env.CRON_SECRET

  // Allow if either Vercel cron header is present OR custom secret matches
  return !!(cronHeader || (expectedSecret && authHeader === `Bearer ${expectedSecret}`))
}

export async function GET(request: NextRequest) {
  // Validate cron request
  if (!validateCronRequest(request)) {
    return NextResponse.json(
      { error: 'Unauthorized - not a valid cron request' },
      { status: 401 }
    )
  }

  let response = NextResponse.json({
    message: 'Processing trial ending notifications'
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

  try {
    // Find users whose trial ends in 2 days
    const twoDaysFromNow = new Date()
    twoDaysFromNow.setDate(twoDaysFromNow.getDate() + 2)

    // Set time range for "2 days from now" (next 24 hours starting from 2 days out)
    const startTime = new Date(twoDaysFromNow)
    startTime.setHours(0, 0, 0, 0)

    const endTime = new Date(twoDaysFromNow)
    endTime.setHours(23, 59, 59, 999)

    // Include no-card trial users (no Stripe customer) — they're the ones
    // who most need this email since nothing auto-charges them at trial end.
    const { data: profiles, error: fetchError } = await (supabase as any)
      .from('profiles')
      .select('id, business_name, trial_ends_at, trial_ending_email_sent')
      .eq('subscription_status', 'trialing')
      .gte('trial_ends_at', startTime.toISOString())
      .lte('trial_ends_at', endTime.toISOString())
      .neq('trial_ending_email_sent', true)
      .limit(50) // Process in batches

    if (fetchError) {
      console.error('Error fetching trial users:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch trial users' },
        { status: 500 }
      )
    }

    if (!profiles || profiles.length === 0) {
      return NextResponse.json({
        message: 'No trial ending notifications to send',
        processed: 0
      })
    }

    // Get user emails from auth.users
    const userIds = profiles.map((profile: any) => profile.id)
    const { data: authUsers, error: authError } = await (supabase as any)
      .from('auth.users')
      .select('id, email')
      .in('id', userIds)

    if (authError) {
      console.error('Error fetching user emails:', authError)
      return NextResponse.json(
        { error: 'Failed to fetch user emails' },
        { status: 500 }
      )
    }

    // Create email map
    const emailMap = new Map()
    authUsers?.forEach((user: any) => {
      emailMap.set(user.id, user.email)
    })

    const results = []
    const sentCount = { success: 0, failed: 0 }

    // Process each user
    for (const profile of profiles) {
      try {
        const userEmail = emailMap.get(profile.id)

        if (!userEmail) {
          console.error(`No email found for user ${profile.id}`)
          sentCount.failed++
          results.push({
            id: profile.id,
            business_name: profile.business_name,
            status: 'failed',
            error: 'No email found for user'
          })
          continue
        }

        // Send trial ending email
        const emailResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/trial-ending`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: userEmail,
            businessName: profile.business_name || 'there',
            trialEndsAt: profile.trial_ends_at
          }),
        })

        if (emailResponse.ok) {
          // Mark trial ending email as sent
          const { error: updateError } = await (supabase as any)
            .from('profiles')
            .update({
              trial_ending_email_sent: true,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id)

          if (updateError) {
            console.error(`Error updating trial ending flag for ${profile.id}:`, updateError)
          }

          sentCount.success++
          results.push({
            id: profile.id,
            business_name: profile.business_name,
            email: userEmail,
            trial_ends_at: profile.trial_ends_at,
            status: 'success'
          })
        } else {
          sentCount.failed++
          results.push({
            id: profile.id,
            business_name: profile.business_name,
            status: 'failed',
            error: 'Email API request failed'
          })
        }

        // Add a small delay between emails
        await new Promise(resolve => setTimeout(resolve, 100))

      } catch (error) {
        console.error(`Unexpected error processing trial user ${profile.id}:`, error)
        sentCount.failed++
        results.push({
          id: profile.id,
          business_name: profile.business_name,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      }
    }

    // Log summary
    console.log(`Trial ending email cron summary: ${sentCount.success} sent, ${sentCount.failed} failed`)

    response = NextResponse.json({
      message: 'Trial ending email processing completed',
      processed: profiles.length,
      success: sentCount.success,
      failed: sentCount.failed,
      results,
    })
    return response

  } catch (error) {
    console.error('Unexpected error in trial ending email cron:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Only allow GET requests
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}