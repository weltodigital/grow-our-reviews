import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { customers, pendingCustomers = [], savePendingCustomers = false } = await request.json()

    if (!customers || !Array.isArray(customers) || customers.length === 0) {
      return NextResponse.json(
        { error: 'No customers provided' },
        { status: 400 }
      )
    }

    // Get user's profile and current usage
    const { data: profile } = await supabase
      .from('profiles')
      .select('monthly_request_limit')
      .eq('id', user.id)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      )
    }

    // Check current month usage
    const now = new Date()
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

    const { data: requestsThisMonth } = await supabase
      .from('review_requests')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .gte('sent_at', startOfMonth.toISOString())
      .lte('sent_at', endOfMonth.toISOString())
      .not('sent_at', 'is', null)

    const requestsSent = requestsThisMonth?.length || 0
    const monthlyLimit = (profile as any)?.monthly_request_limit || 150
    const requestsRemaining = Math.max(0, monthlyLimit - requestsSent)

    // Process customers based on selection and remaining requests
    const customersToProcess = customers.slice(0, requestsRemaining)

    // Handle pending customers for future processing
    let pendingSavedCount = 0
    if (savePendingCustomers && pendingCustomers.length > 0) {
      try {
        // Save pending customers for next month's allocation
        const pendingInserts = pendingCustomers.map((customer: any) => ({
          user_id: user.id,
          name: customer.name,
          phone: customer.normalizedPhone,
          status: 'pending',
          created_at: new Date().toISOString()
        }))

        const { data: pendingData, error: pendingError } = await (supabase as any)
          .from('pending_customers')
          .insert(pendingInserts)
          .select('id')

        if (!pendingError && pendingData) {
          pendingSavedCount = pendingData.length
        }
      } catch (pendingErr) {
        console.error('Failed to save pending customers:', pendingErr)
        // Don't fail the whole upload if pending save fails
      }
    }

    if (customersToProcess.length === 0) {
      // Send plan limit reached email if user has hit their monthly limit
      if (requestsSent >= monthlyLimit) {
        try {
          await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/plan-limit-reached`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: user.email,
              businessName: (profile as any)?.business_name || 'there',
              currentLimit: monthlyLimit,
              requestsUsed: requestsSent
            }),
          })
        } catch (error) {
          console.error('Failed to send plan limit email:', error)
        }
      }

      return NextResponse.json(
        { error: 'No requests remaining in your plan this month' },
        { status: 400 }
      )
    }

    // First, insert all customers
    const customerInserts = customersToProcess.map((customer: any) => ({
      user_id: user.id,
      name: customer.name,
      phone: customer.normalizedPhone,
      email: null,
      created_at: new Date().toISOString()
    }))

    const { data: insertedCustomers, error: customerError } = await (supabase as any)
      .from('customers')
      .insert(customerInserts)
      .select('id, name, phone')

    if (customerError || !insertedCustomers) {
      console.error('Error inserting customers:', customerError)
      return NextResponse.json(
        { error: 'Failed to save customers' },
        { status: 500 }
      )
    }

    // Create review requests with staggered scheduling
    const batchSize = 20
    const batchDelayMinutes = 15
    const currentTime = new Date()

    const reviewRequestInserts = insertedCustomers.map((customer: any, index: number) => {
      // Calculate batch number and delay
      const batchNumber = Math.floor(index / batchSize)
      const scheduledFor = new Date(currentTime.getTime() + (batchNumber * batchDelayMinutes * 60 * 1000))

      return {
        id: crypto.randomUUID(),
        user_id: user.id,
        customer_id: customer.id,
        token: crypto.randomUUID().replace(/-/g, ''),
        status: 'scheduled' as const,
        scheduled_for: scheduledFor.toISOString(),
        created_at: new Date().toISOString(),
        nudge_sent: false
      }
    })

    const { data: insertedRequests, error: requestError } = await (supabase as any)
      .from('review_requests')
      .insert(reviewRequestInserts)
      .select('id, scheduled_for, token')

    if (requestError || !insertedRequests) {
      console.error('Error inserting review requests:', requestError)
      return NextResponse.json(
        { error: 'Failed to create review requests' },
        { status: 500 }
      )
    }

    // Calculate summary stats
    const batches = Math.ceil(customersToProcess.length / batchSize)
    const estimatedCompletionMinutes = (batches - 1) * batchDelayMinutes + 5 // +5 for processing time
    const estimatedCompletionTime = new Date(currentTime.getTime() + (estimatedCompletionMinutes * 60 * 1000))

    return NextResponse.json({
      success: true,
      processed: customersToProcess.length,
      pendingSaved: pendingSavedCount,
      batches,
      batchSize,
      batchDelayMinutes,
      estimatedCompletionTime: estimatedCompletionTime.toISOString(),
      estimatedCompletionMinutes,
      requests: insertedRequests.map((req: any) => ({
        id: req.id,
        scheduledFor: req.scheduled_for,
        token: req.token
      }))
    })

  } catch (error) {
    console.error('Bulk upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}