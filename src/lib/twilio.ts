import { Twilio } from 'twilio'

// Initialize Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

export interface SMSTemplate {
  customerName: string
  businessName: string
  sentimentGateUrl: string
}

export function createInitialReviewMessage({ customerName, businessName, sentimentGateUrl }: SMSTemplate): string {
  return `Hi ${customerName}, thanks for choosing ${businessName}! If you were happy with our work, we'd really appreciate a quick review — it only takes 30 seconds 👇

${sentimentGateUrl}`
}

export function createNudgeMessage({ customerName, businessName, sentimentGateUrl }: SMSTemplate): string {
  return `Hi ${customerName}, just a gentle reminder — if you have 30 seconds, ${businessName} would love a quick review:

${sentimentGateUrl}

No pressure at all — thanks!`
}

export async function sendSMS(to: string, message: string): Promise<{
  success: boolean
  messageSid?: string
  error?: string
}> {
  try {
    const twilioResponse = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: to,
    })

    return {
      success: true,
      messageSid: twilioResponse.sid,
    }
  } catch (error: any) {
    console.error('Twilio SMS error:', error)

    // Handle common Twilio errors
    let errorMessage = 'Failed to send SMS'

    if (error.code === 21211) {
      errorMessage = 'Invalid phone number'
    } else if (error.code === 21614) {
      errorMessage = 'Phone number is not a valid mobile number'
    } else if (error.code === 21408) {
      errorMessage = 'Phone number opted out of receiving SMS'
    } else if (error.code === 20003) {
      errorMessage = 'Authentication failed - check Twilio credentials'
    } else if (error.code === 20429) {
      errorMessage = 'Rate limit exceeded'
    } else if (error.message) {
      errorMessage = error.message
    }

    return {
      success: false,
      error: errorMessage,
    }
  }
}

export { twilioClient }