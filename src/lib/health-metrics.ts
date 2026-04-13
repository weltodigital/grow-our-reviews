import { createServerClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export type HealthMetricType =
  | 'sms_sent'
  | 'sms_failed'
  | 'nudges_sent'
  | 'nudges_failed'
  | 'trial_emails_sent'
  | 'trial_emails_failed'
  | 'webhooks_processed'
  | 'webhooks_failed'
  | 'reconciliation_run'
  | 'reconciliation_issues'
  | 'trials_started'
  | 'trials_converted'
  | 'trials_failed'
  | 'payment_tests_run'
  | 'payment_tests_failed'
  | 'safety_net_recoveries'
  | 'first_user_failures_caught'

export class HealthMetrics {
  private supabase: any

  constructor() {
    this.supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll() { return [] },
          setAll() {},
        },
      }
    )
  }

  async increment(metricType: HealthMetricType, count: number = 1): Promise<void> {
    try {
      const { error } = await this.supabase.rpc('increment_health_metric', {
        metric_type_param: metricType,
        increment_by: count
      })

      if (error) {
        console.error(`Failed to increment health metric ${metricType}:`, error)
      }
    } catch (error) {
      console.error(`Error incrementing health metric ${metricType}:`, error)
    }
  }

  async getDailyMetrics(date?: string): Promise<Record<HealthMetricType, number>> {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0]

      const { data, error } = await this.supabase
        .from('health_metrics')
        .select('metric_type, count')
        .eq('date', targetDate)

      if (error) {
        console.error('Failed to fetch health metrics:', error)
        return this.getEmptyMetrics()
      }

      const metrics = this.getEmptyMetrics()
      data?.forEach((row: any) => {
        metrics[row.metric_type as HealthMetricType] = row.count
      })

      return metrics
    } catch (error) {
      console.error('Error fetching health metrics:', error)
      return this.getEmptyMetrics()
    }
  }

  async getWeeklyTrend(): Promise<Array<{ date: string; metrics: Record<HealthMetricType, number> }>> {
    try {
      const sevenDaysAgo = new Date()
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
      const startDate = sevenDaysAgo.toISOString().split('T')[0]

      const { data, error } = await this.supabase
        .from('health_metrics')
        .select('date, metric_type, count')
        .gte('date', startDate)
        .order('date', { ascending: true })

      if (error) {
        console.error('Failed to fetch weekly health metrics:', error)
        return []
      }

      // Group by date
      const groupedByDate: Record<string, Record<HealthMetricType, number>> = {}

      data?.forEach((row: any) => {
        if (!groupedByDate[row.date]) {
          groupedByDate[row.date] = this.getEmptyMetrics()
        }
        groupedByDate[row.date][row.metric_type as HealthMetricType] = row.count
      })

      return Object.entries(groupedByDate).map(([date, metrics]) => ({
        date,
        metrics
      }))
    } catch (error) {
      console.error('Error fetching weekly health metrics:', error)
      return []
    }
  }

  private getEmptyMetrics(): Record<HealthMetricType, number> {
    return {
      sms_sent: 0,
      sms_failed: 0,
      nudges_sent: 0,
      nudges_failed: 0,
      trial_emails_sent: 0,
      trial_emails_failed: 0,
      webhooks_processed: 0,
      webhooks_failed: 0,
      reconciliation_run: 0,
      reconciliation_issues: 0,
      trials_started: 0,
      trials_converted: 0,
      trials_failed: 0,
      payment_tests_run: 0,
      payment_tests_failed: 0,
      safety_net_recoveries: 0,
      first_user_failures_caught: 0
    }
  }
}

// Singleton instance
export const healthMetrics = new HealthMetrics()