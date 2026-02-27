import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

export const resend = resendApiKey ? new Resend(resendApiKey) : null

export async function sendWelcomeEmail(to: string, businessName: string) {
  if (!resend) {
    console.warn('Resend not configured - skipping welcome email')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: 'Grow Our Reviews <ed@weltodigital.com>',
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

        <p>Need help getting started? Just reply to this email - we're here to help!</p>

        <p>Best regards,<br>
        The Grow Our Reviews Team</p>

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
      from: 'Grow Our Reviews <ed@weltodigital.com>',
      to: [to],
      subject: `Your free trial ends on ${trialEndDate}`,
      html: `
        <h1>Your free trial is ending soon</h1>

        <p>Hi ${businessName},</p>

        <p>Just a friendly reminder that your 7-day free trial ends on <strong>${trialEndDate}</strong>.</p>

        <p>To continue getting more Google reviews after your trial ends, you'll need to choose a plan.</p>

        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard/billing" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Choose Your Plan →</a></p>

        <p>Questions? Just reply to this email and we'll help you out.</p>

        <p>Best regards,<br>
        The Grow Our Reviews Team</p>

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
      from: 'Grow Our Reviews <ed@weltodigital.com>',
      to: [to],
      subject: `Welcome to the ${planName} plan! 🎉`,
      html: `
        <h1>Thanks for subscribing!</h1>

        <p>Hi ${businessName},</p>

        <p>Great news! You're now on the <strong>${planName}</strong> plan and ready to grow your reviews.</p>

        <h2>What you get:</h2>
        <ul>
          <li>Unlimited review requests (within your plan limits)</li>
          <li>Automatic sentiment filtering</li>
          <li>Private feedback collection</li>
          <li>Dashboard analytics</li>
          ${planName === 'Growth' ? '<li>Automatic follow-up nudges</li><li>Priority support</li>' : ''}
        </ul>

        <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard" style="background: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Go to Dashboard →</a></p>

        <p>Need help? We're here for you - just reply to this email.</p>

        <p>Best regards,<br>
        The Grow Our Reviews Team</p>

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