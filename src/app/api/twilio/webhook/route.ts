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

    const {
      MessageSid: messageSid,
      MessageStatus: messageStatus,
      ErrorCode: errorCode,
      ErrorMessage: errorMessage,
    } = params

    if (!messageSid) {
      return NextResponse.json(
        { error: 'MessageSid required' },
        { status: 400 }
      )
    }

    let response = NextResponse.json({ message: 'Webhook processed successfully' })

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set({ name, value, ...options })
              response.cookies.set({ name, value, ...options })
            })
          },
        },
      }
    )

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

    switch (messageStatus) {
      case 'delivered':
        // Message was delivered successfully
        console.log(`SMS delivered for request ${(reviewRequest as any).id}`)
        break

      case 'failed':
      case 'undelivered':
        // Message failed to deliver
        newStatus = 'failed'
        console.error(`SMS failed for request ${(reviewRequest as any).id}: ${errorMessage} (Code: ${errorCode})`)
        break

      case 'sent':
        // Message was sent from Twilio (intermediate status)
        console.log(`SMS sent from Twilio for request ${(reviewRequest as any).id}`)
        break

      default:
        console.log(`SMS status update for request ${(reviewRequest as any).id}: ${messageStatus}`)
    }

    // Update the review request if status changed
    if (newStatus !== (reviewRequest as any).status) {
      const { error: updateError } = await (supabase as any)
        .from('review_requests')
        .update({ status: newStatus })
        .eq('id', (reviewRequest as any).id)

      if (updateError) {
        console.error(`Error updating review request ${(reviewRequest as any).id}:`, updateError)
      }
    }

    // Log delivery status for monitoring
    console.log(`Twilio webhook: MessageSid=${messageSid}, Status=${messageStatus}, RequestId=${(reviewRequest as any).id}`)

    return response

  } catch (error) {
    console.error('Error processing Twilio webhook:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Only allow POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  )
}