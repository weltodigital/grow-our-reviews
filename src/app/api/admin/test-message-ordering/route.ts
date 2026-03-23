import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'

// Test endpoint to create sample queued messages and verify ordering
export async function POST(request: NextRequest) {
  try {
    const { action, testUserId } = await request.json()

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

    if (action === 'create_test_data') {
      // Create test customers first
      const testCustomers = [
        { name: 'Test Customer A1', phone: '+441234567001' },
        { name: 'Test Customer A2', phone: '+441234567002' },
        { name: 'Test Customer B1', phone: '+441234567003' },
        { name: 'Test Customer B2', phone: '+441234567004' },
      ]

      const { data: customers, error: customerError } = await supabase
        .from('customers')
        .insert(testCustomers.map(c => ({ ...c, user_id: testUserId })))
        .select()

      if (customerError) throw customerError

      // Create test review requests with different statuses and queued reasons
      const now = new Date()
      const testRequests = [
        {
          customer_id: customers[0].id,
          status: 'queued',
          queued_reason: 'platform_daily_limit',
          scheduled_for: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
          queued_at: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString() // 2 hours ago
        },
        {
          customer_id: customers[1].id,
          status: 'queued',
          queued_reason: 'per_user_hourly_limit',
          scheduled_for: new Date(now.getTime() - 1 * 60 * 60 * 1000).toISOString(), // 1 hour ago
          queued_at: new Date(now.getTime() - 30 * 60 * 1000).toISOString() // 30 min ago
        },
        {
          customer_id: customers[2].id,
          status: 'scheduled',
          scheduled_for: new Date(now.getTime() - 10 * 60 * 1000).toISOString() // 10 min ago
        },
        {
          customer_id: customers[3].id,
          status: 'queued',
          queued_reason: 'platform_hourly_limit',
          scheduled_for: new Date(now.getTime() - 5 * 60 * 1000).toISOString(), // 5 min ago
          queued_at: new Date(now.getTime() - 2 * 60 * 1000).toISOString() // 2 min ago
        }
      ]

      const { error: requestError } = await supabase
        .from('review_requests')
        .insert(testRequests.map(r => ({
          ...r,
          user_id: testUserId,
          token: `test-${Math.random().toString(36).substr(2, 9)}`
        })))

      if (requestError) throw requestError

      return NextResponse.json({
        message: 'Test data created successfully',
        customers: customers.length,
        requests: testRequests.length
      })
    }

    if (action === 'test_ordering') {
      // Simulate the cron job ordering logic
      const now = new Date().toISOString()

      const { data: reviewRequests, error: fetchError } = await supabase
        .from('review_requests')
        .select(`
          *,
          customers!inner(name, phone)
        `)
        .eq('user_id', testUserId)
        .in('status', ['scheduled', 'queued'])
        .lte('scheduled_for', now)
        .order('scheduled_for', { ascending: true })
        .order('created_at', { ascending: true })

      if (fetchError) throw fetchError

      // Get unique queued reasons for dashboard display logic test
      const queuedReasons = [...new Set(
        reviewRequests
          ?.filter((req: any) => req.status === 'queued' && req.queued_reason)
          ?.map((req: any) => req.queued_reason) || []
      )]

      // Test the "worst case" logic
      const getWorstCaseReason = (reasons: string[]) => {
        const priorityOrder = ['platform_daily_limit', 'platform_hourly_limit', 'per_user_hourly_limit']
        for (const priority of priorityOrder) {
          if (reasons.includes(priority)) {
            return priority
          }
        }
        return reasons[0] || undefined
      }

      const worstReason = getWorstCaseReason(queuedReasons)

      return NextResponse.json({
        message: 'Message ordering test results',
        totalMessages: reviewRequests?.length || 0,
        processingOrder: reviewRequests?.map((req: any, index: number) => ({
          position: index + 1,
          customerName: req.customers.name,
          status: req.status,
          queuedReason: req.queued_reason,
          scheduledFor: req.scheduled_for,
          queuedAt: req.queued_at
        })) || [],
        dashboardDisplay: {
          queuedReasons,
          worstCaseReason: worstReason,
          estimatedResume: worstReason === 'platform_daily_limit' ? 'tomorrow' :
                          worstReason === 'platform_hourly_limit' ? 'next hour' :
                          worstReason === 'per_user_hourly_limit' ? 'next hour' : 'shortly'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Get current test data status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const testUserId = searchParams.get('userId')

    if (!testUserId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 })
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

    const { data, error } = await supabase
      .from('review_requests')
      .select(`
        *,
        customers!inner(name, phone)
      `)
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error

    return NextResponse.json({
      testMessages: data?.map((req: any) => ({
        id: req.id,
        customerName: req.customers.name,
        status: req.status,
        queuedReason: req.queued_reason,
        scheduledFor: req.scheduled_for,
        queuedAt: req.queued_at,
        createdAt: req.created_at
      })) || []
    })

  } catch (error) {
    console.error('Test endpoint error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}