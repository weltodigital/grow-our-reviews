import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export interface FeedbackRateLimit {
  allowed: boolean
  reason?: string
  submissionsUsed: number
  maxSubmissions: number
  ipUsage?: {
    currentHour: number
    maxHour: number
  }
}

export interface FeedbackSubmissionAttempt {
  token: string
  ip: string
  userAgent?: string
  rating: number
  commentLength: number
  timestamp: Date
}

class FeedbackRateLimiterImpl {
  private supabase: any

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createServerClient<Database>(supabaseUrl, supabaseKey, {
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
    })
  }

  /**
   * Check if feedback submission is allowed based on rate limits
   */
  async canSubmitFeedback(token: string, ip: string): Promise<FeedbackRateLimit> {
    try {
      // Check per-token limit (max 5 submissions per token total)
      const tokenCheck = await this.checkTokenSubmissions(token)
      if (!tokenCheck.allowed) {
        return tokenCheck
      }

      // Check per-IP limit (max 50 submissions per IP per hour)
      const ipCheck = await this.checkIPSubmissions(ip)
      if (!ipCheck.allowed) {
        return {
          allowed: false,
          reason: 'IP rate limit exceeded (50 submissions per hour)',
          submissionsUsed: tokenCheck.submissionsUsed,
          maxSubmissions: tokenCheck.maxSubmissions,
          ipUsage: ipCheck.ipUsage
        }
      }

      return {
        allowed: true,
        submissionsUsed: tokenCheck.submissionsUsed,
        maxSubmissions: tokenCheck.maxSubmissions,
        ipUsage: ipCheck.ipUsage
      }

    } catch (error) {
      console.error('Error checking feedback rate limits:', error)
      // Fail open - allow submission if rate limit check fails
      return {
        allowed: true,
        submissionsUsed: 0,
        maxSubmissions: 5
      }
    }
  }

  /**
   * Check per-token submission limits (max 5 per token)
   */
  private async checkTokenSubmissions(token: string): Promise<FeedbackRateLimit> {
    // Count existing feedback submissions for this token
    const { count: tokenSubmissions, error } = await this.supabase
      .from('feedback')
      .select('id', { count: 'exact', head: true })
      .eq('token', token)

    if (error) {
      console.error('Error checking token submissions:', error)
      return { allowed: true, submissionsUsed: 0, maxSubmissions: 5 }
    }

    const submissionsUsed = tokenSubmissions || 0
    const maxSubmissions = 5

    if (submissionsUsed >= maxSubmissions) {
      return {
        allowed: false,
        reason: `Maximum submissions reached for this review link (${maxSubmissions} allowed)`,
        submissionsUsed,
        maxSubmissions
      }
    }

    return {
      allowed: true,
      submissionsUsed,
      maxSubmissions
    }
  }

  /**
   * Check per-IP hourly submission limits (max 50 per hour)
   */
  private async checkIPSubmissions(ip: string): Promise<{ allowed: boolean; ipUsage?: { currentHour: number; maxHour: number } }> {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)

    // Count submissions from this IP in the last hour
    const { count: hourlySubmissions, error } = await this.supabase
      .from('feedback_rate_limit_log')
      .select('id', { count: 'exact', head: true })
      .eq('ip', ip)
      .gte('created_at', oneHourAgo.toISOString())

    if (error) {
      console.error('Error checking IP submissions:', error)
      return { allowed: true }
    }

    const currentHour = hourlySubmissions || 0
    const maxHour = 50

    return {
      allowed: currentHour < maxHour,
      ipUsage: { currentHour, maxHour }
    }
  }

  /**
   * Log a feedback submission attempt for rate limiting and abuse detection
   */
  async logSubmissionAttempt(attempt: FeedbackSubmissionAttempt, allowed: boolean): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('feedback_rate_limit_log')
        .insert({
          token: attempt.token,
          ip: attempt.ip,
          user_agent: attempt.userAgent?.substring(0, 500) || null, // Limit length
          rating: attempt.rating,
          comment_length: attempt.commentLength,
          allowed,
          created_at: attempt.timestamp.toISOString()
        })

      if (error) {
        console.error('Error logging feedback submission attempt:', error)
      }
    } catch (error) {
      console.error('Failed to log feedback submission attempt:', error)
    }
  }

  /**
   * Get submission stats for a token (for debugging/monitoring)
   */
  async getTokenStats(token: string): Promise<{ submissions: number; lastSubmission?: string }> {
    try {
      const { data, error } = await this.supabase
        .from('feedback')
        .select('created_at')
        .eq('token', token)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching token stats:', error)
        return { submissions: 0 }
      }

      return {
        submissions: data?.length || 0,
        lastSubmission: data?.[0]?.created_at
      }
    } catch (error) {
      console.error('Error getting token stats:', error)
      return { submissions: 0 }
    }
  }

  /**
   * Detect potential abuse patterns
   */
  async detectAbuse(ip: string): Promise<{ suspiciousActivity: boolean; reasons: string[] }> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)

      const [hourlyLogs, dailyLogs] = await Promise.all([
        this.supabase
          .from('feedback_rate_limit_log')
          .select('*')
          .eq('ip', ip)
          .gte('created_at', oneHourAgo.toISOString()),
        this.supabase
          .from('feedback_rate_limit_log')
          .select('token, rating')
          .eq('ip', ip)
          .gte('created_at', oneDayAgo.toISOString())
      ])

      const reasons: string[] = []
      let suspiciousActivity = false

      // Check for rapid submissions (>10 in 1 hour)
      if (hourlyLogs.data && hourlyLogs.data.length > 10) {
        reasons.push('High submission rate (>10/hour)')
        suspiciousActivity = true
      }

      // Check for multiple tokens from same IP (>5 different tokens in 24h)
      if (dailyLogs.data) {
        const uniqueTokens = new Set(dailyLogs.data.map((log: any) => log.token))
        if (uniqueTokens.size > 5) {
          reasons.push(`Multiple tokens accessed (${uniqueTokens.size} different tokens)`)
          suspiciousActivity = true
        }

        // Check for rating patterns (all same rating)
        const ratings = dailyLogs.data.map((log: any) => log.rating).filter(Boolean)
        const uniqueRatings = new Set(ratings)
        if (ratings.length > 3 && uniqueRatings.size === 1) {
          reasons.push('Identical ratings pattern')
          suspiciousActivity = true
        }
      }

      return { suspiciousActivity, reasons }
    } catch (error) {
      console.error('Error detecting abuse:', error)
      return { suspiciousActivity: false, reasons: [] }
    }
  }
}

// Singleton instance
export const feedbackRateLimiter = new FeedbackRateLimiterImpl(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)