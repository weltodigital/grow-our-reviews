import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { protectAdminEndpoint } from '@/lib/admin-auth'

// GET - List account restrictions
export async function GET(request: NextRequest) {
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

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

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const restrictionType = searchParams.get('type')
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query = (supabase as any)
      .from('account_restrictions')
      .select(`
        *,
        profiles!inner(business_name, email)
      `)
      .order('created_at', { ascending: false })

    if (userId) {
      query = query.eq('user_id', userId)
    }

    if (restrictionType) {
      query = query.eq('restriction_type', restrictionType)
    }

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data: restrictions, error } = await query

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch restrictions' }, { status: 500 })
    }

    return NextResponse.json({ restrictions: restrictions || [] })

  } catch (error) {
    console.error('Error fetching account restrictions:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create new account restriction
export async function POST(request: NextRequest) {
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

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

    const {
      userId,
      restrictionType,
      reason,
      severity = 'medium',
      expiresAt = null,
      adminUserId = null
    } = await request.json()

    if (!userId || !restrictionType || !reason) {
      return NextResponse.json(
        { error: 'userId, restrictionType, and reason are required' },
        { status: 400 }
      )
    }

    // Validate restriction type
    const validTypes = ['upload_suspended', 'sms_suspended', 'account_suspended']
    if (!validTypes.includes(restrictionType)) {
      return NextResponse.json(
        { error: 'Invalid restriction type' },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: profile } = await (supabase as any)
      .from('profiles')
      .select('id, business_name, email')
      .eq('id', userId)
      .single()

    if (!profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Create the restriction
    const { data: restriction, error } = await (supabase as any)
      .from('account_restrictions')
      .insert({
        user_id: userId,
        restriction_type: restrictionType,
        reason,
        severity,
        expires_at: expiresAt,
        created_by: adminUserId,
        is_active: true
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating restriction:', error)
      return NextResponse.json(
        { error: 'Failed to create restriction' },
        { status: 500 }
      )
    }

    // Send notification email to user
    if (restrictionType === 'account_suspended') {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/account-suspended`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: (profile as any).email,
            businessName: (profile as any).business_name,
            reason,
            expiresAt
          }),
        })
      } catch (emailError) {
        console.error('Failed to send suspension notification:', emailError)
        // Don't fail the restriction creation if email fails
      }
    }

    return NextResponse.json({
      success: true,
      restriction,
      message: `${restrictionType} applied to ${(profile as any).business_name}`
    })

  } catch (error) {
    console.error('Error creating account restriction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update/lift account restriction
export async function PATCH(request: NextRequest) {
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

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

    const {
      restrictionId,
      action, // 'lift' or 'extend'
      expiresAt = null,
      adminUserId = null,
      reason = null
    } = await request.json()

    if (!restrictionId || !action) {
      return NextResponse.json(
        { error: 'restrictionId and action are required' },
        { status: 400 }
      )
    }

    // Get the restriction
    const { data: restriction } = await (supabase as any)
      .from('account_restrictions')
      .select(`
        *,
        profiles!inner(business_name, email)
      `)
      .eq('id', restrictionId)
      .single()

    if (!restriction) {
      return NextResponse.json(
        { error: 'Restriction not found' },
        { status: 404 }
      )
    }

    let updateData: any = {}

    if (action === 'lift') {
      updateData = {
        is_active: false,
        lifted_at: new Date().toISOString(),
        lifted_by: adminUserId
      }
    } else if (action === 'extend' && expiresAt) {
      updateData = {
        expires_at: expiresAt
      }
    } else {
      return NextResponse.json(
        { error: 'Invalid action or missing parameters' },
        { status: 400 }
      )
    }

    const { data: updatedRestriction, error } = await (supabase as any)
      .from('account_restrictions')
      .update(updateData)
      .eq('id', restrictionId)
      .select()
      .single()

    if (error) {
      console.error('Error updating restriction:', error)
      return NextResponse.json(
        { error: 'Failed to update restriction' },
        { status: 500 }
      )
    }

    // Send notification email if restriction was lifted
    if (action === 'lift' && (restriction as any).restriction_type === 'account_suspended') {
      try {
        await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/emails/account-restored`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: (restriction as any).profiles.email,
            businessName: (restriction as any).profiles.business_name,
            liftReason: reason
          }),
        })
      } catch (emailError) {
        console.error('Failed to send restoration notification:', emailError)
      }
    }

    return NextResponse.json({
      success: true,
      restriction: updatedRestriction,
      message: action === 'lift'
        ? `Restriction lifted for ${(restriction as any).profiles.business_name}`
        : `Restriction extended for ${(restriction as any).profiles.business_name}`
    })

  } catch (error) {
    console.error('Error updating account restriction:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}