import { createServerSupabase } from '@/lib/auth'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's profile to check subscription status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 })
    }

    // If user has a Stripe subscription for Growth plan, set to 300
    // You can modify this to check specific price IDs if needed
    let newLimit = 150 // Default to Starter

    // If they have an active subscription and selected Growth, set to 300
    if ((profile as any).subscription_status === 'active' || (profile as any).subscription_status === 'trialing') {
      // Check if they have Growth plan subscription
      // This would need to be determined by checking Stripe subscription details
      // For now, let's check if they explicitly signed up for Growth
      if ((profile as any).stripe_subscription_id) {
        // You might need to check the actual Stripe subscription to determine the plan
        // For immediate fix, we can set to 300 if they have a subscription
        newLimit = 300
      }
    }

    // Update the profile
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        monthly_request_limit: newLimit,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Updated monthly limit to ${newLimit}`,
      profile: {
        ...profile,
        monthly_request_limit: newLimit
      }
    })

  } catch (error) {
    console.error('Fix growth plan error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}