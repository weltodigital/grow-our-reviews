import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/auth'
import { sendSMS, createInitialReviewMessage } from '@/lib/twilio'

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

    // Get the failed request with customer and profile data
    const { data: reviewRequest, error: fetchError } = await (supabase as any)
      .from('review_requests')
      .select(`
        *,
        profiles!inner(business_name, google_review_url),
        customers!inner(name, phone)
      `)
      .eq('id', requestId)
      .eq('user_id', user.id)
      .eq('status', 'failed')
      .single()

    if (fetchError || !reviewRequest) {
      return NextResponse.json(
        { error: 'Request not found or not in failed status' },
        { status: 404 }
      )
    }

    // Create the sentiment gate URL
    const sentimentGateUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/${(reviewRequest as any).token}`

    // Create the SMS message
    const message = createInitialReviewMessage({
      customerName: (reviewRequest as any).customers.name,
      businessName: (reviewRequest as any).profiles.business_name,
      sentimentGateUrl,
    })

    // Attempt to send SMS
    const smsResult = await sendSMS((reviewRequest as any).customers.phone, message)

    if (smsResult.success) {
      // Update request status to 'sent'
      const { error: updateError } = await (supabase as any)
        .from('review_requests')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString(),
          sms_message_sid: smsResult.messageSid,
        })
        .eq('id', requestId)

      if (updateError) {
        console.error('Error updating request after successful SMS:', updateError)
        return NextResponse.json(
          { error: 'SMS sent but failed to update database' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        success: true,
        message: 'SMS sent successfully',
        messageSid: smsResult.messageSid,
      })
    } else {
      // SMS failed again - log the error but don't change status
      console.error('SMS retry failed:', smsResult.error)
      return NextResponse.json(
        { error: `SMS failed: ${smsResult.error}` },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('Retry request error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}