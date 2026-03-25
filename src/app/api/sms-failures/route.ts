import { createServerSupabase } from '@/lib/auth'
import { NextResponse } from 'next/server'

interface SmsFailureStats {
  recentFailures: {
    total: number
    percentage: number
    recentRequests: number
  }
  failureReasons: Array<{
    errorCode: string | null
    errorMessage: string | null
    count: number
    explanation: string
  }>
  recentFailedRequests: Array<{
    id: string
    customerName: string
    customerPhone: string
    failedAt: string
    errorCode: string | null
    errorMessage: string | null
    explanation: string
    retryCount: number
  }>
}

// Common Twilio error codes and their user-friendly explanations
const ERROR_EXPLANATIONS: Record<string, string> = {
  '21211': 'Invalid phone number format - check the number is correct',
  '21612': 'Phone number cannot receive SMS (landline or invalid carrier)',
  '21610': 'Message blocked by carrier spam filter',
  '30007': 'Message delivery failed - carrier rejected',
  '30008': 'Unknown destination phone number',
  '30034': 'Message blocked by destination carrier',
  '21408': 'Permission denied - number may be on do-not-call list',
  '21614': 'Invalid destination phone number',
  '21217': 'Phone number is not a mobile number',
  '30003': 'Unreachable destination - phone may be turned off',
  '30004': 'Message blocked - invalid destination',
  '30005': 'Unknown destination - carrier not found',
  '30006': 'Landline or unreachable carrier'
}

function getErrorExplanation(errorCode: string | null, errorMessage: string | null): string {
  if (errorCode && ERROR_EXPLANATIONS[errorCode]) {
    return ERROR_EXPLANATIONS[errorCode]
  }

  if (errorMessage) {
    const lowerMessage = errorMessage.toLowerCase()
    if (lowerMessage.includes('invalid') && lowerMessage.includes('number')) {
      return 'Invalid phone number format - check the number is correct'
    }
    if (lowerMessage.includes('landline')) {
      return 'Cannot send SMS to landline numbers'
    }
    if (lowerMessage.includes('carrier') && lowerMessage.includes('block')) {
      return 'Message blocked by mobile carrier'
    }
    if (lowerMessage.includes('spam')) {
      return 'Message flagged as spam by carrier'
    }
    if (lowerMessage.includes('unreachable')) {
      return 'Phone number unreachable - may be turned off or out of service'
    }
    return `Delivery failed: ${errorMessage}`
  }

  return 'SMS delivery failed for unknown reason'
}

export async function GET() {
  try {
    const supabase = await createServerSupabase()

    // Get the current user
    const { data: { user }, error: authError } = await (supabase as any).auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Get recent requests (last 30 days) to calculate failure rate
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    const { data: recentRequests, error: recentError } = await (supabase as any)
      .from('review_requests')
      .select('id, status, sms_failed_at, sms_error_code, sms_error_message')
      .eq('user_id', user.id)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (recentError) {
      throw recentError
    }

    const totalRecent = recentRequests?.length || 0
    const failedRecent = recentRequests?.filter((req: any) => req.status === 'failed').length || 0

    // Get detailed failure information (last 14 days for actionable insights)
    const fourteenDaysAgo = new Date()
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14)

    const { data: failedRequests, error: failuresError } = await (supabase as any)
      .from('review_requests')
      .select(`
        id,
        sms_failed_at,
        sms_error_code,
        sms_error_message,
        retry_count,
        customer_id,
        customers!inner(name, phone)
      `)
      .eq('user_id', user.id)
      .eq('status', 'failed')
      .gte('sms_failed_at', fourteenDaysAgo.toISOString())
      .order('sms_failed_at', { ascending: false })
      .limit(20) // Get up to 20 recent failures

    if (failuresError) {
      throw failuresError
    }

    // Group failures by error code/message
    const failureReasonGroups: Record<string, { count: number; errorCode: string | null; errorMessage: string | null }> = {}

    failedRequests?.forEach((req: any) => {
      const key = `${req.sms_error_code || 'unknown'}-${req.sms_error_message || 'unknown'}`
      if (!failureReasonGroups[key]) {
        failureReasonGroups[key] = {
          count: 0,
          errorCode: req.sms_error_code,
          errorMessage: req.sms_error_message
        }
      }
      failureReasonGroups[key].count++
    })

    const failureReasons = Object.values(failureReasonGroups)
      .map(group => ({
        errorCode: group.errorCode,
        errorMessage: group.errorMessage,
        count: group.count,
        explanation: getErrorExplanation(group.errorCode, group.errorMessage)
      }))
      .sort((a, b) => b.count - a.count)

    // Format recent failed requests for display
    const recentFailedRequests = failedRequests?.map((req: any) => ({
      id: req.id,
      customerName: req.customers?.name || 'Unknown',
      customerPhone: req.customers?.phone || '',
      failedAt: req.sms_failed_at,
      errorCode: req.sms_error_code,
      errorMessage: req.sms_error_message,
      explanation: getErrorExplanation(req.sms_error_code, req.sms_error_message),
      retryCount: req.retry_count || 0
    })) || []

    const stats: SmsFailureStats = {
      recentFailures: {
        total: failedRecent,
        percentage: totalRecent > 0 ? Math.round((failedRecent / totalRecent) * 100) : 0,
        recentRequests: totalRecent
      },
      failureReasons,
      recentFailedRequests
    }

    return NextResponse.json(stats)

  } catch (error: any) {
    console.error('Error fetching SMS failure stats:', error)
    return NextResponse.json(
      { error: 'Failed to fetch SMS failure statistics' },
      { status: 500 }
    )
  }
}