import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'

interface TrialWarning {
  userId: string
  email: string
  daysRemaining: number
  requestsSent: number
  hasPaymentMethod: boolean
  riskLevel: 'low' | 'medium' | 'high'
  actions: string[]
}

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = new Headers(request.headers).get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🔔 Running trial warning checks...')

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

    const { stripe } = await import('@/lib/stripe')
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }

    const now = new Date()
    const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)

    // Get trials ending in next 3 days. Require stripe_customer_id so
    // abandoned signups (no Stripe customer) never receive trial-warning
    // emails even if their subscription_status is somehow set.
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, trial_ends_at, stripe_customer_id, created_at')
      .eq('subscription_status', 'trialing')
      .not('stripe_customer_id', 'is', null)
      .not('trial_ends_at', 'is', null)
      .lte('trial_ends_at', threeDaysFromNow.toISOString())

    if (error) throw error

    if (!profiles || profiles.length === 0) {
      console.log('✅ No trials ending soon')
      return NextResponse.json({ message: 'No trials ending soon' })
    }

    console.log(`📊 Checking ${profiles.length} trials ending in next 3 days`)

    // Get usage data for these users
    const userIds = (profiles as any[]).map((p: any) => p.id)
    const { data: requests } = await supabase
      .from('review_requests')
      .select('user_id, created_at')
      .in('user_id', userIds)

    // Group requests by user
    const userRequests = (requests || []).reduce((acc: any, req: any) => {
      if (!acc[req.user_id]) acc[req.user_id] = []
      acc[req.user_id].push(req)
      return acc
    }, {})

    // Analyze each trial
    const warnings: TrialWarning[] = []

    for (const profile of profiles as any[]) {
      const trialEnd = new Date(profile.trial_ends_at)
      const daysRemaining = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      const userReqs = userRequests[profile.id] || []
      const hasPaymentMethod = !!profile.stripe_customer_id

      // Calculate risk level based on usage and timing
      let riskLevel: 'low' | 'medium' | 'high' = 'low'
      const actions: string[] = []

      if (daysRemaining === 0) {
        riskLevel = 'high'
        actions.push('Trial ends today - monitor payment carefully')
      } else if (daysRemaining === 1) {
        riskLevel = 'medium'
        actions.push('Trial ends tomorrow - consider outreach')
      }

      if (!hasPaymentMethod) {
        riskLevel = 'high'
        actions.push('No payment method on file')
      }

      if (userReqs.length === 0) {
        if (riskLevel === 'low') riskLevel = 'medium'
        actions.push('Zero usage - send engagement email')
      } else if (userReqs.length < 3) {
        if (riskLevel === 'low') riskLevel = 'medium'
        actions.push('Low usage - send success tips email')
      }

      warnings.push({
        userId: profile.id,
        email: profile.email,
        daysRemaining,
        requestsSent: userReqs.length,
        hasPaymentMethod,
        riskLevel,
        actions
      })
    }

    // Send alerts for high-risk trials
    const highRiskTrials = warnings.filter(w => w.riskLevel === 'high')
    if (highRiskTrials.length > 0) {
      await sendTrialWarningAlert(highRiskTrials)
    }

    console.log(`📋 Trial warning summary:`, {
      total: warnings.length,
      high_risk: warnings.filter(w => w.riskLevel === 'high').length,
      medium_risk: warnings.filter(w => w.riskLevel === 'medium').length,
      no_payment_method: warnings.filter(w => !w.hasPaymentMethod).length,
      zero_usage: warnings.filter(w => w.requestsSent === 0).length
    })

    return NextResponse.json({
      success: true,
      warnings: warnings.length,
      highRisk: highRiskTrials.length,
      mediumRisk: warnings.filter(w => w.riskLevel === 'medium').length
    })

  } catch (error) {
    console.error('❌ Trial warning check failed:', error)
    return NextResponse.json(
      { error: 'Trial warning check failed', details: (error as any).message },
      { status: 500 }
    )
  }
}

async function sendTrialWarningAlert(highRiskTrials: TrialWarning[]) {
  try {
    const { resend } = await import('@/lib/resend')

    if (!resend) {
      console.error('Resend not configured, cannot send trial warning alert')
      return
    }

    let emailBody = `🚨 HIGH-RISK TRIALS ALERT\n\n`
    emailBody += `${highRiskTrials.length} trials ending soon with high conversion risk:\n\n`

    highRiskTrials.forEach(trial => {
      emailBody += `📧 ${trial.email}\n`
      emailBody += `   • ${trial.daysRemaining} days remaining\n`
      emailBody += `   • ${trial.requestsSent} SMS sent\n`
      emailBody += `   • Payment method: ${trial.hasPaymentMethod ? 'On file' : 'Missing'}\n`
      emailBody += `   • Actions: ${trial.actions.join(', ')}\n\n`
    })

    await resend.emails.send({
      from: 'alerts@growourreviews.com',
      to: 'ed@growourreviews.com',
      subject: `🚨 Trial Alert: ${highRiskTrials.length} high-risk conversions`,
      text: emailBody
    })

    console.log('✅ Trial warning alert sent')
  } catch (error) {
    console.error('❌ Failed to send trial warning alert:', error)
  }
}