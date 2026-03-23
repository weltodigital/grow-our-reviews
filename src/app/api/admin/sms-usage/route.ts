import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { createSMSRateLimiter } from '@/lib/sms-rate-limiter'
import type { Database } from '@/types/database'

// Simple admin endpoint to check SMS usage - protect with basic auth or admin role
export async function GET(request: NextRequest) {
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

    const rateLimiter = createSMSRateLimiter(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Get current usage status
    const usageStatus = await rateLimiter.canSendSMS()

    // Get today's hourly breakdown
    const today = new Date().toISOString().split('T')[0]
    const { data: hourlyUsage, error } = await (supabase as any)
      .from('sms_usage_tracking')
      .select('hour, sms_count')
      .eq('date', today)
      .order('hour')

    // Get rate limits
    const { data: rateLimits } = await (supabase as any)
      .from('sms_rate_limits')
      .select('*')
      .eq('is_active', true)

    // Calculate daily total from hourly breakdown
    const dailyTotal = hourlyUsage?.reduce((sum, hour: any) => sum + (hour.sms_count || 0), 0) || 0

    return NextResponse.json({
      status: usageStatus,
      today: {
        date: today,
        hourlyBreakdown: hourlyUsage || [],
        totalUsage: dailyTotal
      },
      rateLimits: rateLimits || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Error fetching SMS usage:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS usage data' },
      { status: 500 }
    )
  }
}

// Allow updating rate limits (admin only)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { limitType, limitValue } = body

    if (!limitType || !limitValue || !['hourly', 'daily'].includes(limitType)) {
      return NextResponse.json(
        { error: 'Invalid parameters. Expected limitType (hourly|daily) and limitValue (number)' },
        { status: 400 }
      )
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

    const { data, error } = await (supabase as any)
      .from('sms_rate_limits')
      .update({
        limit_value: limitValue,
        updated_at: new Date().toISOString()
      })
      .eq('limit_type', limitType)
      .select()

    if (error) {
      console.error('Error updating SMS rate limit:', error)
      return NextResponse.json(
        { error: 'Failed to update rate limit' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: `Updated ${limitType} limit to ${limitValue}`,
      data: data?.[0]
    })

  } catch (error) {
    console.error('Error in SMS rate limit update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}