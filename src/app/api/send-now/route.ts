import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/auth'
import { sendSMS, createInitialReviewMessage, createCustomInitialMessage } from '@/lib/twilio'
import { buildReviewUrl } from '@/lib/review-url'

export async function POST(request: NextRequest) {
  try {
    const { requestId } = await request.json()

    if (!requestId) {
      return NextResponse.json(
        { error: 'Request ID is required' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Get the current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }

    // Get the scheduled/queued request with customer and profile data
    const { data: reviewRequest, error: fetchError } = await (supabase as any)
      .from('review_requests')
      .select(`
        *,
        profiles!inner(business_name, google_review_url),
        customers!inner(name, phone)
      `)
      .eq('id', requestId)
      .eq('user_id', user.id)
      .in('status', ['scheduled', 'queued'])
      .single()

    if (fetchError || !reviewRequest) {
      return NextResponse.json(
        { error: 'Request not found or not in scheduled/queued status' },
        { status: 404 }
      )
    }

    // Get user's SMS template if available
    const { data: smsTemplate } = await (supabase as any)
      .from('sms_templates')
      .select('*')
      .eq('user_id', user.id)
      .eq('type', 'initial')
      .eq('is_active', true)
      .single()

    // Create the sentiment gate URL with a slug for trust signal
    const sentimentGateUrl = buildReviewUrl(
      (reviewRequest as any).token,
      (reviewRequest as any).profiles.business_name
    )

    // Create the SMS message using custom template if available
    const message = createCustomInitialMessage({
      customerName: (reviewRequest as any).customers.name,
      businessName: (reviewRequest as any).profiles.business_name,
      sentimentGateUrl,
      template: smsTemplate ? {
        greeting: smsTemplate.greeting,
        opening_line: smsTemplate.opening_line,
        request_line: smsTemplate.request_line,
        sign_off: smsTemplate.sign_off
      } : undefined
    })

    // Attempt to send SMS (force send, bypassing rate limits)
    const smsResult = await sendSMS((reviewRequest as any).customers.phone, message, user.id, true) // true = force send

    if (smsResult.success) {
      // Update request status to 'sent'
      const { error: updateError } = await (supabase as any)
        .from('review_requests')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sms_message_sid: smsResult.messageSid,
          queued_reason: null, // Clear queued reason
        })
        .eq('id', requestId)

      if (updateError) {
        console.error('Error updating request after manual send:', updateError)
        return NextResponse.json(
          { error: 'SMS sent but failed to update database' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'SMS sent immediately',
        messageSid: smsResult.messageSid,
      })
    } else {
      // SMS failed - log the error but don't change status
      console.error('Manual SMS send failed:', smsResult.error)
      return NextResponse.json(
        { error: `SMS failed: ${smsResult.error}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Send now error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}