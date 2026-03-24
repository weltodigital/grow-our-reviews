import { NextResponse } from 'next/server'
import { healthMetrics, type HealthMetricType } from '@/lib/health-metrics'

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical'
  message: string
}

interface HealthReport {
  overall: HealthStatus
  services: {
    sms: HealthStatus
    nudges: HealthStatus
    trialEmails: HealthStatus
    webhooks: HealthStatus
    reconciliation: HealthStatus
  }
  metrics: Record<HealthMetricType, number>
  weeklyTrend: Array<{ date: string; metrics: Record<HealthMetricType, number> }>
}

export async function GET(request: Request) {
  try {
    // Verify cron secret for security
    const authHeader = new Headers(request.headers).get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('🏥 Generating daily health report...')

    // Get yesterday's metrics (since this runs early morning)
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]

    const [dailyMetrics, weeklyTrend] = await Promise.all([
      healthMetrics.getDailyMetrics(yesterdayStr),
      healthMetrics.getWeeklyTrend()
    ])

    // Analyze health status
    const report = analyzeHealth(dailyMetrics, weeklyTrend, yesterdayStr)

    // Send health report email
    await sendHealthReport(report)

    console.log('✅ Health report sent successfully')
    return NextResponse.json({
      success: true,
      report: {
        date: yesterdayStr,
        overall: report.overall.status,
        metrics: report.metrics
      }
    })

  } catch (error) {
    console.error('❌ Health report failed:', error)

    // Send failure alert
    await sendFailureAlert(error)

    return NextResponse.json(
      { error: 'Health report failed', details: (error as any).message },
      { status: 500 }
    )
  }
}

function analyzeHealth(
  metrics: Record<HealthMetricType, number>,
  weeklyTrend: Array<{ date: string; metrics: Record<HealthMetricType, number> }>,
  date: string
): HealthReport {
  const services = {
    sms: analyzeSMSHealth(metrics),
    nudges: analyzeNudgesHealth(metrics),
    trialEmails: analyzeTrialEmailsHealth(metrics),
    webhooks: analyzeWebhooksHealth(metrics),
    reconciliation: analyzeReconciliationHealth(metrics)
  }

  // Determine overall health
  const criticalServices = Object.values(services).filter(s => s.status === 'critical')
  const warningServices = Object.values(services).filter(s => s.status === 'warning')

  let overall: HealthStatus
  if (criticalServices.length > 0) {
    overall = {
      status: 'critical',
      message: `${criticalServices.length} service(s) critical`
    }
  } else if (warningServices.length > 0) {
    overall = {
      status: 'warning',
      message: `${warningServices.length} service(s) need attention`
    }
  } else {
    overall = {
      status: 'healthy',
      message: 'All systems operational'
    }
  }

  return {
    overall,
    services,
    metrics,
    weeklyTrend
  }
}

function analyzeSMSHealth(metrics: Record<HealthMetricType, number>): HealthStatus {
  const sent = metrics.sms_sent
  const failed = metrics.sms_failed
  const total = sent + failed

  if (total === 0) {
    return { status: 'warning', message: 'No SMS activity detected' }
  }

  const failureRate = failed / total
  if (failureRate > 0.1) { // >10% failure rate
    return { status: 'critical', message: `High SMS failure rate: ${(failureRate * 100).toFixed(1)}%` }
  } else if (failureRate > 0.05) { // >5% failure rate
    return { status: 'warning', message: `Elevated SMS failure rate: ${(failureRate * 100).toFixed(1)}%` }
  }

  return { status: 'healthy', message: `${sent} SMS sent successfully` }
}

function analyzeNudgesHealth(metrics: Record<HealthMetricType, number>): HealthStatus {
  const sent = metrics.nudges_sent
  const failed = metrics.nudges_failed

  if (sent === 0 && failed === 0) {
    return { status: 'healthy', message: 'No nudges scheduled' }
  }

  if (failed > 0 && sent === 0) {
    return { status: 'critical', message: `All nudges failed: ${failed}` }
  }

  if (failed > 0) {
    return { status: 'warning', message: `${sent} sent, ${failed} failed` }
  }

  return { status: 'healthy', message: `${sent} nudges sent successfully` }
}

function analyzeTrialEmailsHealth(metrics: Record<HealthMetricType, number>): HealthStatus {
  const sent = metrics.trial_emails_sent
  const failed = metrics.trial_emails_failed

  if (sent === 0 && failed === 0) {
    return { status: 'healthy', message: 'No trial emails scheduled' }
  }

  if (failed > 0 && sent === 0) {
    return { status: 'critical', message: `All trial emails failed: ${failed}` }
  }

  if (failed > 0) {
    return { status: 'warning', message: `${sent} sent, ${failed} failed` }
  }

  return { status: 'healthy', message: `${sent} trial emails sent successfully` }
}

function analyzeWebhooksHealth(metrics: Record<HealthMetricType, number>): HealthStatus {
  const processed = metrics.webhooks_processed
  const failed = metrics.webhooks_failed

  if (processed === 0 && failed === 0) {
    return { status: 'healthy', message: 'No webhook activity' }
  }

  if (failed > 0 && processed === 0) {
    return { status: 'critical', message: `All webhooks failed: ${failed}` }
  }

  if (failed > 0) {
    const total = processed + failed
    const failureRate = failed / total
    if (failureRate > 0.1) {
      return { status: 'critical', message: `High webhook failure rate: ${(failureRate * 100).toFixed(1)}%` }
    }
    return { status: 'warning', message: `${processed} processed, ${failed} failed` }
  }

  return { status: 'healthy', message: `${processed} webhooks processed successfully` }
}

function analyzeReconciliationHealth(metrics: Record<HealthMetricType, number>): HealthStatus {
  const runs = metrics.reconciliation_run
  const issues = metrics.reconciliation_issues

  if (runs === 0) {
    return { status: 'critical', message: 'Reconciliation did not run' }
  }

  if (issues > 0) {
    return { status: 'warning', message: `Found ${issues} billing issues` }
  }

  return { status: 'healthy', message: 'Reconciliation completed successfully' }
}

async function sendHealthReport(report: HealthReport) {
  try {
    const { resend } = await import('@/lib/resend')

    if (!resend) {
      throw new Error('Resend is not configured')
    }

    const subject = `System Health Report — ${report.overall.status.toUpperCase()}: ${report.overall.message}`
    const emailBody = formatHealthReport(report)

    await resend.emails.send({
      from: 'system@growourreviews.com',
      to: 'ed@growourreviews.com',
      subject,
      text: emailBody
    })

  } catch (error) {
    console.error('Failed to send health report email:', error)
  }
}

function formatHealthReport(report: HealthReport): string {
  const getStatusEmoji = (status: string) => {
    switch (status) {
      case 'healthy': return '✅'
      case 'warning': return '⚠️'
      case 'critical': return '🚨'
      default: return '❓'
    }
  }

  let body = `Daily System Health Report\n`
  body += `========================\n\n`

  body += `${getStatusEmoji(report.overall.status)} OVERALL: ${report.overall.message}\n\n`

  body += `SERVICE STATUS:\n`
  body += `${getStatusEmoji(report.services.sms.status)} SMS Service: ${report.services.sms.message}\n`
  body += `${getStatusEmoji(report.services.nudges.status)} Nudges: ${report.services.nudges.message}\n`
  body += `${getStatusEmoji(report.services.trialEmails.status)} Trial Emails: ${report.services.trialEmails.message}\n`
  body += `${getStatusEmoji(report.services.webhooks.status)} Webhooks: ${report.services.webhooks.message}\n`
  body += `${getStatusEmoji(report.services.reconciliation.status)} Billing Reconciliation: ${report.services.reconciliation.message}\n\n`

  body += `YESTERDAY'S METRICS:\n`
  body += `• SMS: ${report.metrics.sms_sent} sent, ${report.metrics.sms_failed} failed\n`
  body += `• Nudges: ${report.metrics.nudges_sent} sent, ${report.metrics.nudges_failed} failed\n`
  body += `• Trial Emails: ${report.metrics.trial_emails_sent} sent, ${report.metrics.trial_emails_failed} failed\n`
  body += `• Webhooks: ${report.metrics.webhooks_processed} processed, ${report.metrics.webhooks_failed} failed\n`
  body += `• Reconciliation: ${report.metrics.reconciliation_run} runs, ${report.metrics.reconciliation_issues} issues found\n\n`

  if (report.weeklyTrend.length > 0) {
    body += `7-DAY TREND (SMS sent):\n`
    report.weeklyTrend.slice(-7).forEach(day => {
      body += `• ${day.date}: ${day.metrics.sms_sent} SMS\n`
    })
  }

  return body
}

async function sendFailureAlert(error: any) {
  try {
    const { resend } = await import('@/lib/resend')

    if (!resend) {
      console.error('Resend not configured, cannot send failure alert')
      return
    }

    await resend.emails.send({
      from: 'alerts@growourreviews.com',
      to: 'ed@growourreviews.com',
      subject: 'CRITICAL: Health Report System Failed',
      text: `The daily health report system failed to run.\n\nError: ${error.message}\n\nThis means you have no visibility into system health today. Please investigate immediately.`
    })
  } catch (emailError) {
    console.error('Failed to send failure alert:', emailError)
  }
}