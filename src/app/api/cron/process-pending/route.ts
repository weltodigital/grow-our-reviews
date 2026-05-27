import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentBillingPeriod } from '@/lib/billing-cycle'
import { generateToken } from '@/lib/generate-token'
import { DEFAULT_TRIAL_LIMIT } from '@/lib/pricing'
import type { Database } from '@/types/database'

// Cron job to process pending customers at the start of each billing cycle
// Runs daily to check for users whose billing cycle reset date is today

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

  console.log('🔄 Processing pending customers for users with billing cycle reset today...')

  try {
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

    // Get today's date to check for billing cycle resets
    const today = new Date()
    const todayDayOfMonth = today.getDate()

    // Get pending customers for users whose billing cycle resets today
    const { data: pendingCustomers, error: fetchError } = await (supabase as any)
      .from('pending_customers')
      .select(`
        id,
        user_id,
        name,
        phone,
        created_at,
        profiles!inner(
          id,
          monthly_request_limit,
          business_name,
          email,
          billing_cycle_date
        )
      `)
      .eq('status', 'pending')
      .eq('profiles.billing_cycle_date', todayDayOfMonth)
      .order('created_at', { ascending: true })

    if (fetchError) {
      console.error('Error fetching pending customers:', fetchError)
      return NextResponse.json({ error: 'Failed to fetch pending customers' }, { status: 500 })
    }

    if (!pendingCustomers || pendingCustomers.length === 0) {
      console.log(`✅ No pending customers to process for billing cycle reset on day ${todayDayOfMonth}`)
      return NextResponse.json({
        message: `No pending customers to process for billing cycle reset on day ${todayDayOfMonth}`,
        processed: 0
      })
    }

    console.log(`📋 Found ${pendingCustomers.length} pending customers for users with billing cycle reset on day ${todayDayOfMonth}`)

    // Group pending customers by user_id
    const customersByUser = pendingCustomers.reduce((acc: any, customer: any) => {
      if (!acc[customer.user_id]) {
        acc[customer.user_id] = {
          profile: customer.profiles,
          customers: []
        }
      }
      acc[customer.user_id].customers.push(customer)
      return acc
    }, {})

    let totalProcessed = 0
    let totalRemaining = 0
    const userResults = []

    for (const [userId, userData] of Object.entries(customersByUser) as any[]) {
      try {
        // Check user's current usage for their personalized billing period
        const billingCycleDate = userData.profile.billing_cycle_date
        const billingPeriod = getCurrentBillingPeriod(billingCycleDate)

        const { data: requestsThisMonth } = await supabase
          .from('review_requests')
          .select('id', { count: 'exact' })
          .eq('user_id', userId)
          .gte('sent_at', billingPeriod.start.toISOString())
          .lte('sent_at', billingPeriod.end.toISOString())
          .not('sent_at', 'is', null)
          .not('status', 'eq', 'failed')

        const requestsSent = requestsThisMonth?.length || 0
        const monthlyLimit = userData.profile.monthly_request_limit || DEFAULT_TRIAL_LIMIT
        const requestsRemaining = Math.max(0, monthlyLimit - requestsSent)

        const customersToProcess = userData.customers.slice(0, requestsRemaining)

        if (customersToProcess.length === 0) {
          console.log(`⚠️ User ${userData.profile.business_name} (${userData.profile.email}) has no remaining credits`)
          userResults.push({
            userId,
            email: userData.profile.email,
            businessName: userData.profile.business_name,
            processed: 0,
            remaining: userData.customers.length,
            reason: 'No credits remaining'
          })
          totalRemaining += userData.customers.length
          continue
        }

        // Create customers first
        const customerInserts = customersToProcess.map((customer: any) => ({
          user_id: userId,
          name: customer.name,
          phone: customer.phone,
          email: null,
          created_at: new Date().toISOString()
        }))

        const { data: insertedCustomers, error: customerError } = await (supabase as any)
          .from('customers')
          .insert(customerInserts)
          .select('id, name, phone')

        if (customerError || !insertedCustomers) {
          console.error(`Failed to insert customers for user ${userId}:`, customerError)
          continue
        }

        // Create review requests with staggered scheduling
        const batchSize = 20
        const batchDelayMinutes = 15
        const currentTime = new Date()

        const reviewRequestInserts = insertedCustomers.map((customer: any, index: number) => {
          const batchNumber = Math.floor(index / batchSize)
          const scheduledFor = new Date(currentTime.getTime() + (batchNumber * batchDelayMinutes * 60 * 1000))

          return {
            id: crypto.randomUUID(),
            user_id: userId,
            customer_id: customer.id,
            token: generateToken(),
            status: 'scheduled' as const,
            scheduled_for: scheduledFor.toISOString(),
            created_at: new Date().toISOString(),
            nudge_sent: false
          }
        })

        const { data: insertedRequests, error: requestError } = await (supabase as any)
          .from('review_requests')
          .insert(reviewRequestInserts)

        if (requestError) {
          console.error(`Failed to create review requests for user ${userId}:`, requestError)
          continue
        }

        // Mark processed pending customers as processed
        const processedIds = customersToProcess.map((c: any) => c.id)
        const { error: updateError } = await (supabase as any)
          .from('pending_customers')
          .update({
            status: 'processed',
            processed_at: new Date().toISOString()
          })
          .in('id', processedIds)

        if (updateError) {
          console.error(`Failed to update pending customer status for user ${userId}:`, updateError)
        }

        const processed = customersToProcess.length
        const remaining = userData.customers.length - processed

        totalProcessed += processed
        totalRemaining += remaining

        userResults.push({
          userId,
          email: userData.profile.email,
          businessName: userData.profile.business_name,
          processed,
          remaining,
          reason: remaining > 0 ? 'Partial processing - credit limit reached' : 'Fully processed'
        })

        console.log(`✅ User ${userData.profile.business_name}: processed ${processed}, remaining ${remaining}`)

      } catch (userError) {
        console.error(`Error processing user ${userId}:`, userError)
        userResults.push({
          userId,
          email: userData.profile?.email || 'unknown',
          businessName: userData.profile?.business_name || 'unknown',
          processed: 0,
          remaining: userData.customers.length,
          reason: 'Processing error'
        })
      }
    }

    // Send summary notification if there were significant results
    if (totalProcessed > 0 || totalRemaining > 0) {
      try {
        const { sendInternalAlert } = await import('@/lib/resend')

        const subject = `📊 Daily Pending Customer Processing Complete (Day ${todayDayOfMonth})`
        const message = `
Daily billing cycle reset check - pending customer processing results:

PROCESSING DATE: Day ${todayDayOfMonth} of month (users with billing cycle reset today)

SUMMARY:
- Total processed: ${totalProcessed} customers
- Total remaining: ${totalRemaining} customers
- Users affected: ${Object.keys(customersByUser).length}

USER BREAKDOWN:
${userResults.map(user =>
  `• ${user.businessName} (${user.email}): ${user.processed} processed, ${user.remaining} remaining - ${user.reason}`
).join('\n')}

${totalRemaining > 0 ? `
REMAINING CUSTOMERS:
${totalRemaining} customers could not be processed due to credit limits.
They will remain pending for their next personalized billing cycle reset.
` : ''}

Next processing: Tomorrow (checking for users with billing cycle reset on day ${todayDayOfMonth + 1})
        `

        await sendInternalAlert('Pending Customer Processing', subject, message)
        console.log('📧 Summary notification sent')
      } catch (alertError) {
        console.error('Failed to send summary alert:', alertError)
      }
    }

    console.log(`✅ Pending customer processing complete for day ${todayDayOfMonth}: ${totalProcessed} processed, ${totalRemaining} remaining`)

    return NextResponse.json({
      success: true,
      message: 'Pending customer processing completed',
      totalProcessed,
      totalRemaining,
      usersAffected: Object.keys(customersByUser).length,
      userResults
    })

  } catch (error) {
    console.error('Pending customer processing error:', error)

    // Send error alert
    try {
      const { sendInternalAlert } = await import('@/lib/resend')
      await sendInternalAlert(
        'Pending Customer Processing Error',
        '🔥 CRITICAL: Monthly pending customer processing failed',
        `
The monthly pending customer processing cron job failed with error:

${error instanceof Error ? error.message : 'Unknown error'}

This means customers who were scheduled to be automatically processed at the start of the billing cycle were not converted to review requests.

IMMEDIATE ACTION REQUIRED:
1. Check cron job configuration
2. Verify database connectivity
3. Manually process pending customers if needed
4. Monitor for duplicate processing when system recovers

Error details:
${error instanceof Error ? error.stack : 'No stack trace available'}
        `
      )
    } catch (alertError) {
      console.error('Failed to send error alert:', alertError)
    }

    return NextResponse.json({ error: 'Pending customer processing failed' }, { status: 500 })
  }
}