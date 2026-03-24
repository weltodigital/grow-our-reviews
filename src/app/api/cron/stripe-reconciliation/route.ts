import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import Stripe from 'stripe'

interface ReconciliationResult {
  orphanedCheckouts: Array<{
    sessionId: string
    customerId: string
    customerEmail: string
    amount: number
    created: string
    autoFixed?: boolean
  }>
  mismatched: Array<{
    profileId: string
    email: string
    dbStatus: string
    stripeStatus: string
    subscriptionId: string
  }>
  summary: {
    totalChecked: number
    orphanedCount: number
    orphanedFixed: number
    mismatchedCount: number
    checkedAt: string
  }
}

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = new Headers(request.headers).get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
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

    const { stripe } = await import('@/lib/stripe')
    if (!stripe) {
      throw new Error('Stripe is not configured')
    }

    const result: ReconciliationResult = {
      orphanedCheckouts: [],
      mismatched: [],
      summary: {
        totalChecked: 0,
        orphanedCount: 0,
        orphanedFixed: 0,
        mismatchedCount: 0,
        checkedAt: new Date().toISOString()
      }
    }

    // 1. Check for orphaned checkout sessions (most critical)
    console.log('🔍 Checking for orphaned checkout sessions...')
    await checkOrphanedCheckouts(stripe, supabase, result)

    // 2. Check for subscription status mismatches
    console.log('🔍 Checking subscription status mismatches...')
    await checkSubscriptionMismatches(stripe, supabase, result)

    // 3. Log results and alert if issues found
    console.log('📊 Reconciliation Summary:', result.summary)

    // Track health metrics
    try {
      const { healthMetrics } = await import('@/lib/health-metrics')
      await healthMetrics.increment('reconciliation_run')
      if (result.orphanedCount > 0 || result.mismatchedCount > 0) {
        await healthMetrics.increment('reconciliation_issues', result.orphanedCount + result.mismatchedCount)
      }
    } catch (error) {
      console.error('Failed to track reconciliation health metrics:', error)
    }

    if (result.orphanedCount > 0 || result.mismatchedCount > 0) {
      console.error('🚨 BILLING MISMATCHES DETECTED:', {
        orphaned: result.orphanedCount,
        mismatched: result.mismatchedCount
      })

      await sendAlert(result)
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ Stripe reconciliation failed:', error)
    return NextResponse.json(
      { error: 'Reconciliation failed', details: error.message },
      { status: 500 }
    )
  }
}

async function checkOrphanedCheckouts(stripe: Stripe, supabase: any, result: ReconciliationResult) {
  // Check checkout sessions from last 7 days
  const sevenDaysAgo = Math.floor((Date.now() - 7 * 24 * 60 * 60 * 1000) / 1000)

  const sessions = await stripe.checkout.sessions.list({
    created: { gte: sevenDaysAgo },
    status: 'complete',
    mode: 'subscription',
    limit: 100,
    expand: ['data.customer']
  })

  console.log(`📅 Checking ${sessions.data.length} completed checkout sessions from last 7 days`)

  for (const session of sessions.data) {
    if (!session.customer || !session.metadata?.userId) {
      continue
    }

    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer.id

    // Check if this customer exists in our profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, stripe_customer_id')
      .eq('id', session.metadata.userId)
      .single()

    if (!profile || !profile.stripe_customer_id) {
      // Orphaned checkout - customer paid but no profile record
      const customer = typeof session.customer === 'string'
        ? await stripe.customers.retrieve(session.customer)
        : session.customer

      const orphanedCheckout = {
        sessionId: session.id,
        customerId,
        customerEmail: (customer as any).email || 'Unknown',
        amount: session.amount_total || 0,
        created: new Date(session.created * 1000).toISOString()
      }

      console.log(`💸 Found orphaned checkout: ${session.id} for ${orphanedCheckout.customerEmail}`)

      // AUTO-FIX: Try to create the missing profile record
      try {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string)
        const priceId = subscription.items.data[0]?.price.id
        const { getPriceInfo } = await import('@/lib/stripe')
        const priceInfo = getPriceInfo(priceId)

        if (priceInfo) {
          const { calculateTrialEndDate } = await import('@/lib/pricing')
          const { calculateBillingCycleDate } = await import('@/lib/billing-cycle')

          const trialEnd = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : calculateTrialEndDate()

          const profileData = {
            id: session.metadata.userId,
            email: (customer as any).email || '',
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            subscription_status: subscription.status,
            monthly_request_limit: priceInfo.monthlyRequestLimit,
            trial_ends_at: trialEnd.toISOString(),
            billing_cycle_date: calculateBillingCycleDate(new Date()),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }

          const { error: createError } = await supabase
            .from('profiles')
            .insert(profileData)

          if (!createError) {
            orphanedCheckout.autoFixed = true
            result.summary.orphanedFixed++
            console.log(`✅ Auto-fixed orphaned checkout: ${session.id}`)
          } else {
            console.error(`❌ Failed to auto-fix orphaned checkout: ${createError.message}`)
          }
        }
      } catch (error) {
        console.error(`❌ Error auto-fixing orphaned checkout ${session.id}:`, error.message)
      }

      result.orphanedCheckouts.push(orphanedCheckout)
      result.summary.orphanedCount++
    }
  }
}

async function checkSubscriptionMismatches(stripe: Stripe, supabase: any, result: ReconciliationResult) {
  // Get all profiles with Stripe subscriptions
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, subscription_status, stripe_subscription_id, stripe_customer_id')
    .not('stripe_subscription_id', 'is', null)

  if (error) {
    throw new Error(`Failed to fetch profiles: ${error.message}`)
  }

  console.log(`👥 Checking ${profiles.length} profiles with Stripe subscriptions`)
  result.summary.totalChecked = profiles.length

  for (const profile of profiles) {
    try {
      // Get current subscription status from Stripe
      const subscription = await stripe.subscriptions.retrieve(profile.stripe_subscription_id)

      // Check for status mismatches
      const dbStatus = profile.subscription_status
      const stripeStatus = subscription.status

      // Define what we consider mismatched
      const isMismatch = (
        (dbStatus === 'active' && ['canceled', 'incomplete_expired', 'unpaid'].includes(stripeStatus)) ||
        (dbStatus === 'cancelled' && ['active', 'trialing'].includes(stripeStatus)) ||
        (dbStatus === 'past_due' && stripeStatus === 'active') ||
        (dbStatus === 'trialing' && stripeStatus === 'active')
      )

      if (isMismatch) {
        result.mismatched.push({
          profileId: profile.id,
          email: profile.email,
          dbStatus,
          stripeStatus,
          subscriptionId: profile.stripe_subscription_id
        })
        result.summary.mismatchedCount++

        console.warn(`⚠️ Status mismatch for ${profile.email}: DB=${dbStatus}, Stripe=${stripeStatus}`)
      }

    } catch (error) {
      console.error(`❌ Failed to check subscription ${profile.stripe_subscription_id}:`, error.message)
      // Continue checking other profiles
    }
  }
}

async function sendAlert(result: ReconciliationResult) {
  try {
    const { resend } = await import('@/lib/resend')

    const totalIssues = result.orphanedCount + result.mismatchedCount
    let emailBody = `Stripe reconciliation found ${totalIssues} billing issues:\n\n`

    if (result.orphanedCheckouts.length > 0) {
      const unfixed = result.orphanedCheckouts.filter(c => !c.autoFixed)
      const fixed = result.orphanedCheckouts.filter(c => c.autoFixed)

      if (unfixed.length > 0) {
        emailBody += `🚨 ORPHANED CHECKOUTS (${unfixed.length}) - REQUIRE MANUAL FIX:\n`
        unfixed.forEach(checkout => {
          emailBody += `- ${checkout.customerEmail} | Session: ${checkout.sessionId} | Amount: £${(checkout.amount / 100).toFixed(2)} | ${checkout.created}\n`
        })
        emailBody += '\n'
      }

      if (fixed.length > 0) {
        emailBody += `✅ AUTO-FIXED CHECKOUTS (${fixed.length}) - Profiles created automatically:\n`
        fixed.forEach(checkout => {
          emailBody += `- ${checkout.customerEmail} | Session: ${checkout.sessionId} | Amount: £${(checkout.amount / 100).toFixed(2)}\n`
        })
        emailBody += '\n'
      }
    }

    if (result.mismatched.length > 0) {
      emailBody += `⚠️ STATUS MISMATCHES (${result.mismatched.length}) - Database vs Stripe:\n`
      result.mismatched.forEach(mismatch => {
        emailBody += `- ${mismatch.email} | DB: ${mismatch.dbStatus} | Stripe: ${mismatch.stripeStatus} | Sub: ${mismatch.subscriptionId}\n`
      })
      emailBody += '\n'
    }

    emailBody += `Checked at: ${result.summary.checkedAt}\n`
    emailBody += `Total profiles checked: ${result.summary.totalChecked}\n`
    emailBody += `Auto-fixed orphaned checkouts: ${result.summary.orphanedFixed}\n\n`
    emailBody += '🔧 Status mismatches require manual investigation - use /api/admin/stripe-sync to fix.\n'
    emailBody += '✅ Orphaned checkouts are auto-fixed when possible.'

    await resend.emails.send({
      from: 'alerts@growourreviews.com',
      to: 'ed@growourreviews.com',
      subject: `Stripe Reconciliation Alert — ${totalIssues} issues found`,
      text: emailBody
    })

    console.log('✅ Alert email sent successfully')
  } catch (error) {
    console.error('❌ Failed to send alert email:', error)
    // Still log the issues even if email fails
    console.error('💸 Orphaned checkouts:', result.orphanedCheckouts)
    console.error('🔄 Status mismatches:', result.mismatched)
  }
}