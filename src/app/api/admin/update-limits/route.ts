import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: Request) {
  try {
    // Update profiles with 50 limit to new Starter limit (150)
    const { error: error1 } = await supabase
      .from('profiles')
      .update({ monthly_request_limit: 150 })
      .eq('monthly_request_limit', 50)

    if (error1) throw error1

    // Update profiles with old Growth limit (150) to new Growth limit (300)
    const { error: error2 } = await supabase
      .from('profiles')
      .update({ monthly_request_limit: 300 })
      .eq('monthly_request_limit', 150)
      .in('subscription_status', ['active', 'trialing'])

    if (error2) throw error2

    // Get updated counts
    const { data: counts, error: error3 } = await supabase
      .from('profiles')
      .select('monthly_request_limit, subscription_status')

    if (error3) throw error3

    const summary = counts.reduce((acc, profile) => {
      const key = `${profile.monthly_request_limit}_${profile.subscription_status}`
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      success: true,
      message: 'Monthly limits updated successfully',
      summary
    })

  } catch (error) {
    console.error('Error updating limits:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update limits' },
      { status: 500 }
    )
  }
}