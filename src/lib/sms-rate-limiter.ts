import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'
import { resend } from './resend'

export interface SMSRateLimit {
  limit_type: 'hourly' | 'daily' | 'per_user_hourly'
  limit_value: number
  is_active: boolean
}

export interface SMSUsageCheck {
  allowed: boolean
  currentUsage: number
  limit: number
  percentage: number
  message?: string
  queuedReason?: string
  limitType?: 'platform' | 'user'
}

export interface SMSRateLimiter {
  canSendSMS(userId?: string): Promise<SMSUsageCheck>
  incrementUsage(userId?: string): Promise<void>
  checkAndAlert(): Promise<void>
}

class SMSRateLimiterImpl implements SMSRateLimiter {
  private supabase: any

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    })
  }

  private getCurrentDateTime() {
    const now = new Date()
    const date = now.toISOString().split('T')[0] // YYYY-MM-DD format
    const hour = now.getHours() // 0-23
    return { date, hour, now }
  }

  private async getRateLimits(): Promise<SMSRateLimit[]> {
    const { data, error } = await this.supabase
      .from('sms_rate_limits')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching SMS rate limits:', error)
      // Return conservative defaults if DB query fails
      return [
        { limit_type: 'hourly', limit_value: 200, is_active: true },
        { limit_type: 'daily', limit_value: 1000, is_active: true }
      ]
    }

    return data || []
  }

  private async getCurrentUsage(date: string, hour?: number): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc(hour !== undefined ? 'get_sms_usage' : 'get_sms_usage', {
          target_date: date,
          target_hour: hour
        })

      if (error) {
        console.error('Error getting SMS usage:', error)
        return 0
      }

      return data?.[0]?.sms_count || 0
    } catch (error) {
      console.error('Error in getCurrentUsage:', error)
      return 0
    }
  }

  private async getUserUsage(userId: string, date: string, hour?: number): Promise<number> {
    try {
      const { data, error } = await this.supabase
        .rpc('get_user_sms_usage', {
          target_user_id: userId,
          target_date: date,
          target_hour: hour
        })

      if (error) {
        console.error('Error getting user SMS usage:', error)
        return 0
      }

      return data?.[0]?.sms_count || 0
    } catch (error) {
      console.error('Error in getUserUsage:', error)
      return 0
    }
  }

  async canSendSMS(userId?: string): Promise<SMSUsageCheck> {
    try {
      const { date, hour } = this.getCurrentDateTime()
      const rateLimits = await this.getRateLimits()

      // First check per-user limits if userId provided
      if (userId) {
        const perUserLimit = rateLimits.find(limit => limit.limit_type === 'per_user_hourly')
        if (perUserLimit) {
          const userHourlyUsage = await this.getUserUsage(userId, date, hour)
          const userPercentage = (userHourlyUsage / perUserLimit.limit_value) * 100

          if (userHourlyUsage >= perUserLimit.limit_value) {
            return {
              allowed: false,
              currentUsage: userHourlyUsage,
              limit: perUserLimit.limit_value,
              percentage: userPercentage,
              limitType: 'user',
              queuedReason: 'per_user_hourly_limit',
              message: `User hourly SMS limit exceeded: ${userHourlyUsage}/${perUserLimit.limit_value}`
            }
          }
        }
      }

      // Then check platform-wide limits
      // Check hourly limit first (more restrictive)
      const hourlyLimit = rateLimits.find(limit => limit.limit_type === 'hourly')
      if (hourlyLimit) {
        const hourlyUsage = await this.getCurrentUsage(date, hour)
        const hourlyPercentage = (hourlyUsage / hourlyLimit.limit_value) * 100

        if (hourlyUsage >= hourlyLimit.limit_value) {
          return {
            allowed: false,
            currentUsage: hourlyUsage,
            limit: hourlyLimit.limit_value,
            percentage: hourlyPercentage,
            limitType: 'platform',
            queuedReason: 'platform_hourly_limit',
            message: `Platform hourly SMS limit exceeded: ${hourlyUsage}/${hourlyLimit.limit_value}`
          }
        }
      }

      // Check daily limit
      const dailyLimit = rateLimits.find(limit => limit.limit_type === 'daily')
      if (dailyLimit) {
        const dailyUsage = await this.getCurrentUsage(date)
        const dailyPercentage = (dailyUsage / dailyLimit.limit_value) * 100

        if (dailyUsage >= dailyLimit.limit_value) {
          return {
            allowed: false,
            currentUsage: dailyUsage,
            limit: dailyLimit.limit_value,
            percentage: dailyPercentage,
            limitType: 'platform',
            queuedReason: 'platform_daily_limit',
            message: `Platform daily SMS limit exceeded: ${dailyUsage}/${dailyLimit.limit_value}`
          }
        }
      }

      // Return the most restrictive current usage percentage for monitoring
      const hourlyUsage = hourlyLimit ? await this.getCurrentUsage(date, hour) : 0
      const dailyUsage = dailyLimit ? await this.getCurrentUsage(date) : 0
      const userHourlyUsage = userId ? await this.getUserUsage(userId, date, hour) : 0

      const hourlyPercentage = hourlyLimit ? (hourlyUsage / hourlyLimit.limit_value) * 100 : 0
      const dailyPercentage = dailyLimit ? (dailyUsage / dailyLimit.limit_value) * 100 : 0
      const userPercentage = userId ? (userHourlyUsage / 30) * 100 : 0 // Default per-user limit of 30

      const maxPercentage = Math.max(hourlyPercentage, dailyPercentage, userPercentage)
      const isHourly = hourlyPercentage >= dailyPercentage && hourlyPercentage >= userPercentage
      const isDaily = dailyPercentage >= hourlyPercentage && dailyPercentage >= userPercentage
      const isUser = userPercentage >= hourlyPercentage && userPercentage >= dailyPercentage

      let message = 'SMS usage: '
      if (isUser && userId) {
        message += `${userHourlyUsage}/30 user hourly`
      } else if (isHourly) {
        message += `${hourlyUsage}/${hourlyLimit?.limit_value} platform hourly`
      } else {
        message += `${dailyUsage}/${dailyLimit?.limit_value} platform daily`
      }

      return {
        allowed: true,
        currentUsage: isUser ? userHourlyUsage : (isHourly ? hourlyUsage : dailyUsage),
        limit: isUser ? 30 : (isHourly ? (hourlyLimit?.limit_value || 0) : (dailyLimit?.limit_value || 0)),
        percentage: maxPercentage,
        limitType: isUser ? 'user' : 'platform',
        message: message
      }
    } catch (error) {
      console.error('Error in canSendSMS:', error)
      // Conservative approach: deny if we can't check limits
      return {
        allowed: false,
        currentUsage: 0,
        limit: 0,
        percentage: 100,
        queuedReason: 'system_error',
        message: 'Error checking SMS limits - denying as safety measure'
      }
    }
  }

  async incrementUsage(userId?: string): Promise<void> {
    try {
      const { date, hour } = this.getCurrentDateTime()

      // Increment platform-wide usage
      const { error: platformError } = await this.supabase
        .rpc('increment_sms_usage', {
          target_date: date,
          target_hour: hour,
          increment_by: 1
        })

      if (platformError) {
        console.error('Error incrementing platform SMS usage:', platformError)
      }

      // Increment per-user usage if userId provided
      if (userId) {
        const { error: userError } = await this.supabase
          .rpc('increment_user_sms_usage', {
            target_user_id: userId,
            target_date: date,
            target_hour: hour,
            increment_by: 1
          })

        if (userError) {
          console.error('Error incrementing user SMS usage:', userError)
        }
      }
    } catch (error) {
      console.error('Error in incrementUsage:', error)
    }
  }

  async checkAndAlert(): Promise<void> {
    try {
      const usage = await this.canSendSMS()

      // Send alerts at 80% and 95% thresholds
      if (usage.percentage >= 95) {
        await this.sendCriticalAlert(usage)
      } else if (usage.percentage >= 80) {
        await this.sendWarningAlert(usage)
      }
    } catch (error) {
      console.error('Error in checkAndAlert:', error)
    }
  }

  private async sendWarningAlert(usage: SMSUsageCheck): Promise<void> {
    if (!resend) {
      console.warn('Resend not configured - cannot send SMS usage warning alert')
      return
    }

    try {
      const { date, hour } = this.getCurrentDateTime()
      const timeframe = usage.currentUsage <= 300 ? 'hourly' : 'daily'

      await resend.emails.send({
        from: 'Grow Our Reviews Alerts <ed@growourreviews.com>',
        to: ['ed@growourreviews.com'],
        subject: `⚠️ SMS Usage Warning - ${Math.round(usage.percentage)}% of ${timeframe} limit reached`,
        html: `
          <h1>SMS Usage Warning</h1>

          <p><strong>Current usage:</strong> ${usage.currentUsage}/${usage.limit} SMS (${Math.round(usage.percentage)}%)</p>
          <p><strong>Timeframe:</strong> ${timeframe === 'hourly' ? `Hour ${hour} of ${date}` : `Day ${date}`}</p>
          <p><strong>Status:</strong> Approaching limit - monitor for unusual activity</p>

          <h2>What to check:</h2>
          <ul>
            <li>Recent bulk uploads creating many scheduled messages</li>
            <li>Database bugs creating duplicate review_requests</li>
            <li>Users somehow bypassing credit limits</li>
            <li>Unusual SMS sending patterns in logs</li>
          </ul>

          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard" style="background: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Check Dashboard →</a></p>

          <p>This is an automated alert from your SMS rate limiting system.</p>
        `
      })

      console.log(`SMS usage warning alert sent - ${usage.percentage}% of limit reached`)
    } catch (error) {
      console.error('Error sending SMS usage warning alert:', error)
    }
  }

  private async sendCriticalAlert(usage: SMSUsageCheck): Promise<void> {
    if (!resend) {
      console.warn('Resend not configured - cannot send SMS usage critical alert')
      return
    }

    try {
      const { date, hour } = this.getCurrentDateTime()
      const timeframe = usage.currentUsage <= 300 ? 'hourly' : 'daily'
      const isBlocked = !usage.allowed

      await resend.emails.send({
        from: 'Grow Our Reviews Alerts <ed@growourreviews.com>',
        to: ['ed@growourreviews.com'],
        subject: `🚨 ${isBlocked ? 'SMS SENDING BLOCKED' : 'CRITICAL SMS Usage'} - ${Math.round(usage.percentage)}% of ${timeframe} limit`,
        html: `
          <h1>${isBlocked ? '🚨 SMS Sending Blocked' : '🚨 Critical SMS Usage Alert'}</h1>

          <p><strong>Current usage:</strong> ${usage.currentUsage}/${usage.limit} SMS (${Math.round(usage.percentage)}%)</p>
          <p><strong>Timeframe:</strong> ${timeframe === 'hourly' ? `Hour ${hour} of ${date}` : `Day ${date}`}</p>
          <p><strong>Status:</strong> ${isBlocked ? 'SMS sending is now PAUSED' : 'About to reach limit'}</p>

          ${isBlocked ? `
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 16px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin: 0 0 10px 0;">SMS Sending Paused</h3>
            <p style="margin: 0;">The SMS rate limiter has paused all SMS sending to prevent cost overrun. The cron jobs will resume automatically when the limit resets.</p>
          </div>
          ` : ''}

          <h2>Immediate Actions:</h2>
          <ul>
            <li><strong>Check for bugs</strong> - Look for duplicate review_requests in database</li>
            <li><strong>Review recent activity</strong> - Check for unusual bulk uploads</li>
            <li><strong>Monitor Twilio costs</strong> - Check current SMS charges</li>
            <li><strong>Check user activity</strong> - Look for users bypassing credit limits</li>
          </ul>

          <h2>System Details:</h2>
          <ul>
            <li>Hourly limit: 200 SMS</li>
            <li>Daily limit: 1000 SMS</li>
            <li>Rate limiter: Active and blocking further SMS</li>
            <li>Reset time: ${timeframe === 'hourly' ? 'Next hour' : 'Tomorrow at midnight UTC'}</li>
          </ul>

          <p><a href="${process.env.NEXT_PUBLIC_APP_URL || 'https://app.growourreviews.com'}/dashboard" style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Check Dashboard Immediately →</a></p>

          <p><strong>This is a critical automated alert from your SMS rate limiting system.</strong></p>
        `
      })

      console.log(`SMS usage critical alert sent - ${isBlocked ? 'SMS BLOCKED' : 'CRITICAL'} - ${usage.percentage}% of limit reached`)
    } catch (error) {
      console.error('Error sending SMS usage critical alert:', error)
    }
  }
}

// Factory function to create SMS rate limiter
export function createSMSRateLimiter(supabaseUrl: string, supabaseKey: string): SMSRateLimiter {
  return new SMSRateLimiterImpl(supabaseUrl, supabaseKey)
}