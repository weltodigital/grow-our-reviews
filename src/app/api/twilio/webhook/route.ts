import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { twilioClient } from '@/lib/twilio'
import type { Database } from '@/types/database'

// Validate Twilio webhook signature
function validateTwilioSignature(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  try {
    const authToken = process.env.TWILIO_AUTH_TOKEN!
    return (twilioClient as any).validateRequest(authToken, signature, url, params)
  } catch (error) {
    console.error('Error validating Twilio signature:', error)
    return false
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const params: Record<string, string> = {}

    // Convert FormData to object
    formData.forEach((value, key) => {
      params[key] = value.toString()
    })

    // Validate webhook signature (optional but recommended for production)
    const signature = request.headers.get('x-twilio-signature')
    const url = request.url

    if (signature && !validateTwilioSignature(signature, url, params)) {
      console.error('Invalid Twilio webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Create supabase client for webhook operations
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
      MessageSid: messageSid,
      MessageStatus: messageStatus,
      ErrorCode: errorCode,
      ErrorMessage: errorMessage,
      Body: messageBody,
      From: fromNumber,
      To: toNumber,
    } = params

    // Determine if this is an inbound SMS or a delivery status update
    if (messageBody && fromNumber) {
      // This is an inbound SMS from a customer
      await handleInboundSMS(fromNumber, messageBody, supabase)
      return NextResponse.json({ message: 'Inbound SMS processed' })
    } else if (messageStatus && messageSid) {
      // This is a delivery status update - handle as before
      return await handleDeliveryStatus(messageSid, messageStatus, errorCode, errorMessage, supabase, request)
    }

    return NextResponse.json(
      { error: 'Invalid webhook data' },
      { status: 400 }
    )

  } catch (error) {
    console.error('Error processing Twilio webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Handle inbound SMS messages (STOP requests, general replies)
async function handleInboundSMS(fromNumber: string, messageBody: string, supabase: any) {
  const trimmedBody = messageBody.trim().toUpperCase();

  // Check for opt-out keywords
  const optOutKeywords = ['STOP', 'UNSUBSCRIBE', 'CANCEL', 'END', 'QUIT', 'OPTOUT', 'OPT OUT'];
  const isOptOut = optOutKeywords.some(keyword => trimmedBody === keyword);

  if (isOptOut) {
    await handleOptOut(fromNumber, messageBody, supabase);
  } else {
    await handleGeneralReply(fromNumber, messageBody, supabase);
  }
}

// Handle opt-out requests (STOP messages)
async function handleOptOut(phoneNumber: string, originalMessage: string, supabase: any) {
  // Find which business last sent an SMS to this phone number
  const { data: recentRequest } = await supabase
    .from('review_requests')
    .select('user_id, customer_id, customers!inner(phone)')
    .eq('customers.phone', phoneNumber)
    .in('status', ['sent', 'clicked', 'reviewed', 'feedback_given'])
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (recentRequest) {
    // Create suppression record for this phone + business combination
    const { error } = await supabase
      .from('sms_suppressions')
      .upsert({
        phone_number: phoneNumber,
        user_id: recentRequest.user_id,
        reason: 'customer_opt_out',
        source_message: originalMessage,
        suppressed_at: new Date().toISOString()
      }, {
        onConflict: 'phone_number,user_id'
      });

    if (error) {
      console.error('Failed to create suppression:', error);
    }

    // Cancel any pending/scheduled requests to this number from this business
    await supabase
      .from('review_requests')
      .update({ status: 'suppressed' })
      .eq('user_id', recentRequest.user_id)
      .eq('customer_id', recentRequest.customer_id)
      .in('status', ['scheduled', 'queued']);

    console.log(`Opt-out processed: ${phoneNumber} for business ${recentRequest.user_id}`);
  } else {
    // Can't determine which business — suppress globally
    const { data: allRequests } = await supabase
      .from('review_requests')
      .select('user_id, customers!inner(phone)')
      .eq('customers.phone', phoneNumber)
      .in('status', ['sent', 'clicked', 'reviewed', 'feedback_given']);

    if (allRequests) {
      const uniqueUserIds = [...new Set(allRequests.map((r: any) => r.user_id))];
      for (const userId of uniqueUserIds) {
        await supabase
          .from('sms_suppressions')
          .upsert({
            phone_number: phoneNumber,
            user_id: userId,
            reason: 'customer_opt_out',
            source_message: originalMessage
          }, {
            onConflict: 'phone_number,user_id'
          });
      }
    }

    console.log(`Global opt-out processed: ${phoneNumber} (no specific business identified)`);
  }
}

// Handle general replies (non-STOP messages)
async function handleGeneralReply(phoneNumber: string, messageBody: string, supabase: any) {
  // Check if we've already auto-replied to this number in the last 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: recentReply } = await supabase
    .from('auto_reply_log')
    .select('id')
    .eq('phone_number', phoneNumber)
    .gte('replied_at', oneDayAgo)
    .limit(1)
    .single();

  if (recentReply) {
    // Already replied within 24 hours, don't send another auto-reply
    console.log(`Skipping auto-reply to ${phoneNumber} - already replied within 24 hours`);
    return;
  }

  // Find which business last sent them a message
  const { data: recentRequest } = await supabase
    .from('review_requests')
    .select('user_id, profiles!inner(business_name, phone)')
    .eq('customers.phone', phoneNumber)
    .in('status', ['sent', 'clicked', 'reviewed', 'feedback_given'])
    .order('sent_at', { ascending: false })
    .limit(1)
    .single();

  if (recentRequest) {
    const businessName = recentRequest.profiles.business_name;
    const businessPhone = recentRequest.profiles.phone;

    // Send auto-reply with business contact info
    const replyMessage = businessPhone
      ? `Thanks for your message. This is an automated number - please contact ${businessName} directly on ${businessPhone} for any enquiries.`
      : `Thanks for your message. This is an automated number - please contact ${businessName} directly for any enquiries.`;

    try {
      await twilioClient.messages.create({
        body: replyMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber
      });

      // Log the auto-reply
      await supabase
        .from('auto_reply_log')
        .insert({
          phone_number: phoneNumber,
          user_id: recentRequest.user_id,
          replied_at: new Date().toISOString()
        });

      console.log(`Auto-reply sent to ${phoneNumber} for business ${businessName}`);
    } catch (error) {
      console.error(`Failed to send auto-reply to ${phoneNumber}:`, error);
    }
  }

  // Log the inbound message for reference (but don't store message content - GDPR)
  console.log(`Inbound SMS from ${phoneNumber}: [message received but content not stored]`);
}

// Handle delivery status updates (existing functionality)
async function handleDeliveryStatus(messageSid: string, messageStatus: string, errorCode: string, errorMessage: string, supabase: any, request: NextRequest) {
  // Find the review request by message SID
  const { data: reviewRequest, error: findError } = await supabase
    .from('review_requests')
    .select('*')
    .eq('sms_message_sid', messageSid)
    .single()

  if (findError || !reviewRequest) {
    console.error(`Review request not found for MessageSid: ${messageSid}`)
    // Return 200 to prevent Twilio retries
    return NextResponse.json({ message: 'Review request not found' })
  }

  // Update status based on Twilio message status
  let newStatus = (reviewRequest as any).status
  let updateData: any = {}

  switch (messageStatus) {
    case 'delivered':
      // Message was delivered successfully
      console.log(`SMS delivered for request ${(reviewRequest as any).id}`)
      // Clear any previous failure data if message is now delivered
      if ((reviewRequest as any).sms_error_code) {
        updateData = {
          sms_error_code: null,
          sms_error_message: null,
          sms_failed_at: null
        }
      }
      break

    case 'failed':
    case 'undelivered':
      // Message failed to deliver - store failure details
      newStatus = 'failed'
      updateData = {
        status: newStatus,
        sms_error_code: errorCode || null,
        sms_error_message: errorMessage || null,
        sms_failed_at: new Date().toISOString(),
        retry_count: ((reviewRequest as any).retry_count || 0) + 1
      }
      console.error(`SMS failed for request ${(reviewRequest as any).id}: ${errorMessage} (Code: ${errorCode})`)

      // Track health metrics
      try {
        const { healthMetrics } = await import('@/lib/health-metrics')
        await healthMetrics.increment('sms_failed')
      } catch (healthError) {
        console.error('Failed to track SMS failure metrics:', healthError)
      }
      break

    case 'sent':
      // Message was sent from Twilio (intermediate status)
      console.log(`SMS sent from Twilio for request ${(reviewRequest as any).id}`)
      break

    default:
      console.log(`SMS status update for request ${(reviewRequest as any).id}: ${messageStatus}`)
  }

  // Update the review request if status changed or we have failure data to store
  if (newStatus !== (reviewRequest as any).status || Object.keys(updateData).length > 0) {
    if (newStatus !== (reviewRequest as any).status && !updateData.status) {
      updateData.status = newStatus
    }

    const { error: updateError } = await (supabase as any)
      .from('review_requests')
      .update(updateData)
      .eq('id', (reviewRequest as any).id)

    if (updateError) {
      console.error(`Error updating review request ${(reviewRequest as any).id}:`, updateError)
    } else {
      console.log(`Updated request ${(reviewRequest as any).id} with data:`, updateData)
    }
  }

  // Log delivery status for monitoring
  console.log(`Twilio webhook: MessageSid=${messageSid}, Status=${messageStatus}, RequestId=${(reviewRequest as any).id}`)

  return NextResponse.json({ message: 'Delivery status processed successfully' })
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}