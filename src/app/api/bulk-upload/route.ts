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

    const { customers } = await request.json()

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
    const monthlyLimit = (profile as any)?.monthly_request_limit || 50
    const requestsRemaining = Math.max(0, monthlyLimit - requestsSent)

    // Limit customers to remaining requests
    const customersToProcess = customers.slice(0, requestsRemaining)

    if (customersToProcess.length === 0) {
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