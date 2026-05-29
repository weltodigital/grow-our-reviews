import { Resend } from 'resend'
import { PRICING_PLANS, getPlanByLimit, type PlanKey } from './pricing'

const resendApiKey = process.env.RESEND_API_KEY

export const resend = resendApiKey ? new Resend(resendApiKey) : null

// Returns the next tier up from the given plan (Lite → Starter → Growth → Pro → null)
function nextPlanUp(planKey: PlanKey): PlanKey | null {
  if (planKey === 'lite') return 'starter'
  if (planKey === 'starter') return 'growth'
  if (planKey === 'growth') return 'pro'
  return null
}

export async function sendWelcomeEmail(to: string, businessName: string) {
  if (!resend) {
    console.warn('Resend not configured - skipping welcome email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Grow Our Reviews <ed@growourreviews.com>',
      to: [to],
      subject: 'Welcome to Grow Our Reviews! 🌟',
      html: `
        <h1>Welcome to Grow Our Reviews, ${businessName}!</h1>

        <p>Thanks for joining us! You're now ready to start getting more Google reviews automatically.</p>

        <h2>What's next?</h2>
        <ul>
          <li><strong>Complete your setup</strong> - Add your Google Reviews URL in your dashboard</li>
          <li><strong>Send your first request</strong> - Try it with a recent customer</li>
          <li><strong>Watch the reviews roll in</strong> - Happy customers get sent to Google, unhappy ones give private feedback</li>
        </ul>

        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard →</a></p>

        <p>Need help getting started? Just reply to this email - I'm here to help!</p>

        <p>Best regards,<br>
        Ed at Grow Our Reviews</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          You're receiving this because you signed up for Grow Our Reviews.
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/settings">Manage your email preferences</a>
        </p>
      `
    })

    if (error) {
      console.error('Failed to send welcome email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendTrialEndingEmail(to: string, businessName: string, trialEndsAt: string) {
  if (!resend) {
    console.warn('Resend not configured - skipping trial ending email')
    return { success: false, error: 'Email service not configured' }
  }

  const trialEndDate = new Date(trialEndsAt).toLocaleDateString('en-GB')

  try {
    const { data, error } = await resend.emails.send({
      from: 'Grow Our Reviews <ed@growourreviews.com>',
      to: [to],
      subject: `Your free trial ends on ${trialEndDate}`,
      html: `
        <h1>Your free trial is ending soon</h1>

        <p>Hi ${businessName},</p>

        <p>Just a friendly reminder that your free trial ends on <strong>${trialEndDate}</strong>.</p>

        <p>To continue getting more Google reviews after your trial ends, you'll need to choose a plan.</p>

        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/billing" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Choose Your Plan →</a></p>

        <p>Questions? Just reply to this email and I'll help you out.</p>

        <p>Best regards,<br>
        Ed at Grow Our Reviews</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/settings">Manage your email preferences</a>
        </p>
      `
    })

    if (error) {
      console.error('Failed to send trial ending email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending trial ending email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendSubscriptionConfirmationEmail(to: string, businessName: string, planName: string) {
  if (!resend) {
    console.warn('Resend not configured - skipping subscription confirmation email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Grow Our Reviews <ed@growourreviews.com>',
      to: [to],
      subject: `Welcome to the ${planName} plan! 🎉`,
      html: `
        <h1>Thanks for subscribing!</h1>

        <p>Hi ${businessName},</p>

        <p>Great news! You're now on the <strong>${planName}</strong> plan and ready to grow your reviews.</p>

        <h2>What you get:</h2>
        <ul>
          <li>Review requests up to your plan's monthly limit</li>
          <li>Automatic sentiment filtering</li>
          <li>Private feedback collection</li>
          <li>Automatic follow-up nudges</li>
          <li>Dashboard analytics</li>
          ${planName === 'Growth' || planName === 'Pro' ? '<li>Priority support</li>' : '<li>Email support</li>'}
        </ul>

        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard →</a></p>

        <p>Need help? I'm here for you - just reply to this email.</p>

        <p>Best regards,<br>
        Ed at Grow Our Reviews</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/billing">Manage your subscription</a> |
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/settings">Email preferences</a>
        </p>
      `
    })

    if (error) {
      console.error('Failed to send subscription confirmation email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending subscription confirmation email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendPlanLimitReachedEmail(to: string, businessName: string, currentLimit: number, requestsUsed: number) {
  if (!resend) {
    console.warn('Resend not configured - skipping plan limit email')
    return { success: false, error: 'Email service not configured' }
  }

  const currentPlanKey = getPlanByLimit(currentLimit)
  const planName = PRICING_PLANS[currentPlanKey].name
  const nextPlanKey = nextPlanUp(currentPlanKey)
  const nextPlanName = nextPlanKey ? PRICING_PLANS[nextPlanKey].name : null
  const nextPlanLimit = nextPlanKey ? String(PRICING_PLANS[nextPlanKey].monthlyRequestLimit) : null

  try {
    const { data, error } = await resend.emails.send({
      from: 'Grow Our Reviews <ed@growourreviews.com>',
      to: [to],
      subject: `You've reached your ${planName} plan limit`,
      html: `
        <h1>You've reached your monthly limit</h1>

        <p>Hi ${businessName},</p>

        <p>You've used all <strong>${requestsUsed}/${currentLimit}</strong> review requests in your ${planName} plan for this month.</p>

        ${nextPlanKey ? `
        <p>To continue sending review requests, you can upgrade to the <strong>${nextPlanName}</strong> plan and get ${nextPlanLimit} requests per month.</p>

        <h2>Why upgrade?</h2>
        <ul>
          <li>Keep the momentum going with your reviews</li>
          <li>Don't miss out on potential 5-star reviews</li>
          <li>Higher limits = more reviews = more customers</li>
          <li>Get automatic follow-up nudges</li>
          <li>Priority support access</li>
        </ul>

        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/billing" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Upgrade to ${nextPlanName} →</a></p>
        ` : `
        <p>You're already on our highest plan! If you need more requests per month, please get in touch and we can discuss custom plan options.</p>

        <h2>What you can do:</h2>
        <ul>
          <li>Your plan will reset next month with a fresh ${currentLimit} requests</li>
          <li>Contact us about increasing your monthly limit</li>
          <li>We can discuss custom pricing for higher volumes</li>
        </ul>

        <p><a href="mailto:ed@growourreviews.com" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Contact Support →</a></p>
        `}

        <p>Your plan will reset next month${nextPlanKey ? ', or you can upgrade anytime to continue sending requests immediately' : ' with a fresh allocation of requests'}.</p>

        <p>Questions about upgrading? Just reply to this email and I'll help you choose the right plan.</p>

        <p>Best regards,<br>
        Ed at Grow Our Reviews</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/billing">Manage your subscription</a> |
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/settings">Email preferences</a>
        </p>
      `
    })

    if (error) {
      console.error('Failed to send plan limit email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending plan limit email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendPaymentFailedEmail(to: string, businessName: string, planName: string, retryDate: string) {
  if (!resend) {
    console.warn('Resend not configured - skipping payment failed email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Grow Our Reviews <ed@growourreviews.com>',
      to: [to],
      subject: 'Payment failed - Update your payment method',
      html: `
        <h1>Payment issue with your ${planName} plan</h1>

        <p>Hi ${businessName},</p>

        <p>We had trouble processing the payment for your ${planName} plan subscription.</p>

        <p>To keep your account active and continue getting reviews, please update your payment method by <strong>${retryDate}</strong>.</p>

        <h2>What happens next?</h2>
        <ul>
          <li>Your account remains active for a few more days</li>
          <li>Please update your payment method to avoid service interruption</li>
          <li>All your data and settings are safe</li>
          <li>Once payment is fixed, everything continues as normal</li>
        </ul>

        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/billing" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Update Payment Method →</a></p>

        <p><strong>Common causes:</strong></p>
        <ul>
          <li>Expired credit/debit card</li>
          <li>Insufficient funds</li>
          <li>Bank blocking the transaction</li>
          <li>Changed billing address</li>
        </ul>

        <p>Having trouble updating your payment? Just reply to this email and I'll help you sort it out.</p>

        <p>Best regards,<br>
        Ed at Grow Our Reviews</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/billing">Manage your subscription</a> |
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/settings">Email preferences</a>
        </p>
      `
    })

    if (error) {
      console.error('Failed to send payment failed email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending payment failed email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

// Send internal alerts for critical system issues
export async function sendInternalAlert(type: string, subject: string, message: string) {
  if (!resend) {
    console.warn('Resend not configured - skipping internal alert')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'System Alerts <alerts@growourreviews.com>',
      to: ['ed@growourreviews.com'], // Admin email
      subject: subject,
      html: `
        <h1>System Alert: ${type}</h1>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 16px 0;">
          <h2 style="color: #dc2626; margin-top: 0;">Alert Details</h2>
          <pre style="white-space: pre-wrap; font-family: monospace; background: #f9fafb; padding: 12px; border-radius: 4px;">${message}</pre>
        </div>

        <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
        <p><strong>Environment:</strong> ${process.env.NODE_ENV || 'unknown'}</p>

        <p>This alert was automatically generated by the Grow Our Reviews system monitoring.</p>
      `
    })

    if (error) {
      console.error('Failed to send internal alert:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Error sending internal alert:', error)
    return { success: false, error: 'Failed to send alert' }
  }
}

export async function sendSubscriptionCancelledEmail(to: string, businessName: string) {
  if (!resend) {
    console.warn('Resend not configured - skipping subscription cancelled email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Grow Our Reviews <ed@growourreviews.com>',
      to: [to],
      subject: 'Subscription cancelled - Your data remains safe',
      html: `
        <h1>Your Grow Our Reviews subscription has been cancelled</h1>

        <p>Hi ${businessName},</p>

        <p>Your Grow Our Reviews subscription has been successfully cancelled. I wanted to personally reach out to confirm this and let you know what happens next.</p>

        <div style="background: #f0f9ff; border: 1px solid #0284c7; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h2 style="color: #0284c7; margin-top: 0;">What this means:</h2>
          <ul style="margin-bottom: 0;">
            <li><strong>Your data is safe:</strong> All your review requests, responses, and analytics remain accessible in your dashboard</li>
            <li><strong>No further charges:</strong> Your card will not be charged for future billing periods</li>
            <li><strong>Account remains active:</strong> You can still log in to view your historical data anytime</li>
          </ul>
        </div>

        <p>If you cancelled because something wasn't working as expected, or if you have feedback on how we could improve, I'd love to hear from you. Just reply to this email.</p>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">Changed your mind?</h3>
          <p style="margin-bottom: 0;">You can reactivate your subscription at any time by logging into your dashboard and visiting the billing section. Your data and settings will be exactly as you left them.</p>
        </div>

        <p>Thank you for giving Grow Our Reviews a try. If you decide to come back in the future, we'll be here to help you grow your online reputation.</p>

        <p>Best regards,<br>
        Ed at Grow Our Reviews</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard">Access your dashboard</a> |
          <a href="mailto:ed@growourreviews.com">Reply with feedback</a>
        </p>
      `
    })

    if (error) {
      console.error('Failed to send subscription cancelled email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data, messageId: data?.id }
  } catch (error) {
    console.error('Error sending subscription cancelled email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

export async function sendPaymentSuspendedEmail(to: string, businessName: string, cancellationReason: string) {
  if (!resend) {
    console.warn('Resend not configured - skipping payment suspended email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Grow Our Reviews <ed@growourreviews.com>',
      to: [to],
      subject: 'Payment failed - Subscription suspended',
      html: `
        <h1>Payment Issue - Your Subscription Has Been Suspended</h1>

        <p>Hi ${businessName},</p>

        <p>I'm reaching out because there was an issue with your payment method, and your Grow Our Reviews subscription has been temporarily suspended.</p>

        <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h2 style="color: #dc2626; margin-top: 0;">What happened:</h2>
          <ul style="margin-bottom: 0; color: #dc2626;">
            <li>Your payment method was declined multiple times over the past week</li>
            <li>Stripe automatically suspended your subscription after several retry attempts</li>
            <li><strong>Your data is completely safe</strong> - all your customers, reviews, and analytics are preserved</li>
          </ul>
        </div>

        <div style="background: #f0f9ff; border: 1px solid #0284c7; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h2 style="color: #0284c7; margin-top: 0;">How to fix this:</h2>
          <ol style="margin-bottom: 0; color: #0284c7;">
            <li><strong>Update your payment method</strong> in your billing portal</li>
            <li>Once your payment succeeds, your subscription will reactivate immediately</li>
            <li>You'll regain full access to sending review requests right away</li>
          </ol>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/billing"
             style="background: #2563eb; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block;">
            Update Payment Method →
          </a>
        </div>

        <p>In the meantime, you can still access your dashboard to view all your historical data and analytics. Nothing has been lost!</p>

        <div style="background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <h3 style="color: #92400e; margin-top: 0;">Common causes:</h3>
          <ul style="margin-bottom: 0; color: #92400e; font-size: 14px;">
            <li>Expired or cancelled credit/debit card</li>
            <li>Insufficient funds in the account</li>
            <li>Bank blocking the transaction (try calling your bank)</li>
            <li>Card details changed (new card number, expiry, etc.)</li>
          </ul>
        </div>

        <p>If you're having trouble updating your payment method or have any questions, just reply to this email and I'll personally help you get this sorted.</p>

        <p>Thanks for being a valued customer, and I look forward to getting you back up and running!</p>

        <p>Best regards,<br>
        Ed at Grow Our Reviews</p>

        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px;">
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard">Access your dashboard</a> |
          <a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/billing">Update payment method</a> |
          <a href="mailto:ed@growourreviews.com">Get help</a>
        </p>
      `
    })

    if (error) {
      console.error('Failed to send payment suspended email:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data, messageId: data?.id }
  } catch (error) {
    console.error('Error sending payment suspended email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}