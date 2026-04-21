import { Twilio } from 'twilio'
import { createSMSRateLimiter } from './sms-rate-limiter'

// Initialize Twilio client
const twilioClient = new Twilio(
  process.env.TWILIO_ACCOUNT_SID!,
  process.env.TWILIO_AUTH_TOKEN!
)

// Initialize SMS rate limiter
const smsRateLimiter = createSMSRateLimiter(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
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
  return `Hi ${customerName}, thanks for choosing ${businessName}! If you were happy with our work, we'd really appreciate a quick review — it only takes 30 seconds:

${sentimentGateUrl}`
}

export function createNudgeMessage({ customerName, businessName, sentimentGateUrl }: SMSTemplate): string {
  return `Hi ${customerName}, just a quick reminder - would you mind leaving us a review: ${sentimentGateUrl}`
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
  messageParts.push(`${template.request_line}:`)
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

  // Replace {business_name} placeholder in request line
  const processedRequestLine = template.request_line.replace(/\{business_name\}/g, businessName)

  // Build nudge message using user's custom request line
  const messageParts = []

  // Format: {greeting} {customer_name}, {request_line}
  messageParts.push(`${template.greeting} ${customerName}, ${processedRequestLine}`)
  messageParts.push('')
  messageParts.push(sentimentGateUrl)

  // Add sign-off if provided
  if (template.sign_off && template.sign_off.trim()) {
    messageParts.push('')
    messageParts.push(template.sign_off)
  }

  return messageParts.join('\n')
}

export async function sendSMS(to: string, message: string, userId?: string, force: boolean = false): Promise<{
  success: boolean
  messageSid?: string
  error?: string
  rateLimited?: boolean
  queuedReason?: string
}> {
  try {
    // Check SMS rate limits before sending (skip if force is true)
    if (!force) {
      const rateLimitCheck = await smsRateLimiter.canSendSMS(userId)

      if (!rateLimitCheck.allowed) {
        console.warn(`SMS rate limit exceeded: ${rateLimitCheck.message}`)

        // Send alert if we haven't already
        await smsRateLimiter.checkAndAlert()

        return {
          success: false,
          rateLimited: true,
          queuedReason: rateLimitCheck.queuedReason,
          error: `Rate limit exceeded: ${rateLimitCheck.message}`,
        }
      }

      // Log usage info for monitoring
      console.log(`SMS rate limiter: ${rateLimitCheck.message} (${Math.round(rateLimitCheck.percentage)}%)`)
    }

    const twilioResponse = await twilioClient.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER!,
      to: to,
    })

    // Increment usage counter after successful send (include userId for per-user tracking)
    await smsRateLimiter.incrementUsage(userId)

    // Check if we need to send usage alerts
    await smsRateLimiter.checkAndAlert()

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

// Export rate limiter for use in cron jobs if needed
export { smsRateLimiter }

export { twilioClient }