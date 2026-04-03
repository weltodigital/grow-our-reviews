import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/database'
import { protectAdminEndpoint } from '@/lib/admin-auth'

// View suppressions for a specific business
export async function GET(request: NextRequest) {
  // SECURITY: Protect admin endpoint
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('user_id')

    if (!userId) {
      return NextResponse.json(
        { error: 'user_id parameter required' },
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

    // Get suppressions for the specified business
    const { data: suppressions, error } = await supabase
      .from('sms_suppressions')
      .select(`
        id,
        phone_number,
        reason,
        source_message,
        suppressed_at,
        profiles!inner(business_name, email)
      `)
      .eq('user_id', userId)
      .order('suppressed_at', { ascending: false })

    if (error) {
      console.error('Error fetching suppressions:', error)
      return NextResponse.json(
        { error: 'Failed to fetch suppressions' },
        { status: 500 }
      )
    }

    // Get business info separately to avoid type issues
    const { data: businessInfo } = await supabase
      .from('profiles')
      .select('business_name, email')
      .eq('id', userId)
      .single()

    // Mask phone numbers for privacy (show last 3 digits only)
    const maskedSuppressions = (suppressions as any[])?.map((suppression: any) => ({
      ...suppression,
      phone_number_masked: suppression.phone_number.replace(/(\+\d{2})\d+(\d{3})/, '$1***xxx$2'),
      phone_number: undefined // Remove full number from response
    }))

    return NextResponse.json({
      suppressions: maskedSuppressions || [],
      total: suppressions?.length || 0,
      business: businessInfo || null
    })

  } catch (error) {
    console.error('Error in suppressions admin endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Remove a suppression (for re-consent cases)
export async function DELETE(request: NextRequest) {
  // SECURITY: Protect admin endpoint
  const authResult = protectAdminEndpoint(request)
  if (authResult !== true) return authResult

  try {
    const { phone_number, user_id, reason } = await request.json()

    if (!phone_number || !user_id) {
      return NextResponse.json(
        { error: 'phone_number and user_id required' },
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

    // Verify the suppression exists before deleting
    const { data: existing, error: findError } = await supabase
      .from('sms_suppressions')
      .select('id, phone_number, suppressed_at')
      .eq('phone_number', phone_number)
      .eq('user_id', user_id)
      .single()

    if (findError || !existing) {
      return NextResponse.json(
        { error: 'Suppression not found' },
        { status: 404 }
      )
    }

    // Get business info separately
    const { data: businessInfo } = await supabase
      .from('profiles')
      .select('business_name')
      .eq('id', user_id)
      .single()

    // Delete the suppression
    const { error: deleteError } = await supabase
      .from('sms_suppressions')
      .delete()
      .eq('phone_number', phone_number)
      .eq('user_id', user_id)

    if (deleteError) {
      console.error('Error deleting suppression:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete suppression' },
        { status: 500 }
      )
    }

    // Log the removal for audit purposes
    console.log('Admin suppression removal:', {
      phone_number: phone_number.replace(/(\+\d{2})\d+(\d{3})/, '$1***xxx$2'),
      user_id,
      business_name: (businessInfo as any)?.business_name,
      suppressed_at: (existing as any).suppressed_at,
      removed_at: new Date().toISOString(),
      reason: reason || 'Admin removal - re-consent'
    })

    return NextResponse.json({
      success: true,
      message: 'Suppression removed successfully',
      phone_number_masked: phone_number.replace(/(\+\d{2})\d+(\d{3})/, '$1***xxx$2'),
      business: (businessInfo as any)?.business_name || 'Unknown'
    })

  } catch (error) {
    console.error('Error removing suppression:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}