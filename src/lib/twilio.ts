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

export interface CustomSMSTemplate {
  greeting: string
  opening_line: string
  request_line: string
  sign_off: string | null
}

export interface MessageData {
  customerName: string
  businessName: string
  sentimentGateUrl: string
  template?: CustomSMSTemplate
}

export function createInitialReviewMessage({ customerName, businessName, sentimentGateUrl }: SMSTemplate): string {
  return `Hi ${customerName}, thanks for choosing ${businessName}! If you were happy with our work, we'd really appreciate a quick review — it only takes 30 seconds 👇

${sentimentGateUrl}`
}

export function createNudgeMessage({ customerName, businessName, sentimentGateUrl }: SMSTemplate): string {
  return `Hi ${customerName}, just a quick reminder — would you mind leaving us a review:

${sentimentGateUrl}`
}

export function createCustomInitialMessage({ customerName, businessName, sentimentGateUrl, template }: MessageData): string {
  // Use custom template if provided, otherwise fall back to default
  if (!template) {
    return createInitialReviewMessage({ customerName, businessName, sentimentGateUrl })
  }

  // Replace {business_name} placeholder in opening line
  const processedOpeningLine = template.opening_line.replace(/\{business_name\}/g, businessName)

  // Build message components
  const messageParts = []

  // Format: {greeting} {customer_name}, {opening_line}
  messageParts.push(`${template.greeting} ${customerName}, ${processedOpeningLine}`)
  messageParts.push('')
  messageParts.push(`${template.request_line} 👇`)
  messageParts.push('')
  messageParts.push(sentimentGateUrl)

  // Add sign-off if provided
  if (template.sign_off && template.sign_off.trim()) {
    messageParts.push('')
    messageParts.push(template.sign_off)
  }

  return messageParts.join('\n')
}

export function createCustomNudgeMessage({ customerName, businessName, sentimentGateUrl, template }: MessageData): string {
  // Use custom template if provided, otherwise fall back to default
  if (!template) {
    return createNudgeMessage({ customerName, businessName, sentimentGateUrl })
  }

  // Build nudge message
  const messageParts = []

  // Format: {greeting} {customer_name}, just a quick reminder — would you mind leaving us a review:
  messageParts.push(`${template.greeting} ${customerName}, just a quick reminder — would you mind leaving us a review:`)
  messageParts.push('')
  messageParts.push(sentimentGateUrl)

  // Add sign-off if provided
  if (template.sign_off && template.sign_off.trim()) {
    messageParts.push('')
    messageParts.push(template.sign_off)
  }

  return messageParts.join('\n')
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