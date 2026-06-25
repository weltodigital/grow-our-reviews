import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/auth'
import { supabaseServer } from '@/lib/supabase-server'

// Erase a single customer's personal data (GDPR right to erasure, for the
// business's own end-customers). Deleting the customers row cascades to their
// review_requests and feedback, so one call removes everything identifiable.
//
// Intentionally KEEPS sms_suppressions: if the customer opted out, that opt-out
// must still be honoured, and the suppression record stands on its own basis.
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  const supabase = await createServerSupabase()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  const db = supabaseServer as any

  // Confirm the customer belongs to THIS user (a business can only erase its
  // own customers) and grab the phone to clear matching pre-processing rows.
  const { data: customer, error: fetchError } = await db
    .from('customers')
    .select('id, phone')
    .eq('id', id)
    .eq('user_id', user.id)
    .single()

  if (fetchError || !customer) {
    return NextResponse.json({ error: 'Customer not found' }, { status: 404 })
  }

  // Remove any not-yet-processed uploads for the same number so the customer
  // can't be silently re-created on the next billing cycle.
  await db
    .from('pending_customers')
    .delete()
    .eq('user_id', user.id)
    .eq('phone', customer.phone)

  // Delete the customer — review_requests and feedback cascade from here.
  const { error: deleteError } = await db
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (deleteError) {
    console.error('Customer deletion failed:', deleteError.message)
    return NextResponse.json({ error: 'Failed to delete customer' }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
