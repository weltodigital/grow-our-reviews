import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

interface DuplicateCheckResult {
  isDuplicate: boolean
  warningLevel: 'none' | 'info' | 'warning' | 'error'
  message: string
  details?: {
    phoneNumber: string
    customerName: string
    lastRequestDate: string
    daysAgo: number
    lastRequestStatus: string
    hasReviewed: boolean
    hasGivenFeedback: boolean
    totalRequests: number
  }
  suggestion?: string
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phoneNumber, customerName } = await request.json()

    if (!phoneNumber) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 })
    }

    // Normalize phone number for comparison
    const normalizedPhone = normalizePhoneNumber(phoneNumber)

    // Check for existing review requests in the last 90 days
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    const { data: existingRequests, error } = await supabase
      .from('review_requests')
      .select(`
        id,
        status,
        created_at,
        sent_at,
        clicked_at,
        customers!inner(name, phone)
      `)
      .eq('user_id', user.id)
      .eq('customers.phone', normalizedPhone)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error checking duplicate requests:', error)
      return NextResponse.json({ error: 'Failed to check duplicates' }, { status: 500 })
    }

    // If no existing requests, it's safe to proceed
    if (!existingRequests || existingRequests.length === 0) {
      return NextResponse.json({
        isDuplicate: false,
        warningLevel: 'none',
        message: 'No previous requests found - safe to send'
      } as DuplicateCheckResult)
    }

    // Analyze the most recent request
    const mostRecent = existingRequests[0] as any
    const lastRequestDate = new Date(mostRecent.created_at)
    const daysAgo = Math.ceil((Date.now() - lastRequestDate.getTime()) / (1000 * 60 * 60 * 24))

    // Check if customer has already reviewed or given feedback
    const hasReviewed = existingRequests.some((req: any) => req.status === 'reviewed')
    const hasGivenFeedback = existingRequests.some((req: any) => req.status === 'feedback_given')
    const totalRequests = existingRequests.length

    // Determine warning level and message based on various factors
    const result = analyzeDuplicateRisk({
      phoneNumber: normalizedPhone,
      customerName: mostRecent.customers?.name || '',
      lastRequestDate: lastRequestDate.toISOString(),
      daysAgo,
      lastRequestStatus: mostRecent.status,
      hasReviewed,
      hasGivenFeedback,
      totalRequests
    })

    return NextResponse.json(result)

  } catch (error) {
    console.error('Duplicate check error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function normalizePhoneNumber(phone: string): string {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '')

  // Convert UK numbers to consistent format
  if (digits.startsWith('447') && digits.length === 13) {
    return '+' + digits
  } else if (digits.startsWith('07') && digits.length === 11) {
    return '+44' + digits.substring(1)
  } else if (digits.startsWith('44') && digits.length === 12) {
    return '+' + digits
  }

  return phone // Return original if format not recognized
}

function analyzeDuplicateRisk(details: DuplicateCheckResult['details']): DuplicateCheckResult {
  if (!details) {
    return {
      isDuplicate: false,
      warningLevel: 'none',
      message: 'Unable to analyze request history'
    }
  }

  const { daysAgo, hasReviewed, hasGivenFeedback, totalRequests, lastRequestStatus } = details

  // CRITICAL: Customer already left a review
  if (hasReviewed) {
    return {
      isDuplicate: true,
      warningLevel: 'error',
      message: '🚫 This customer already left a review',
      details,
      suggestion: 'Skip this request - customers who already reviewed may get annoyed by additional requests'
    }
  }

  // CRITICAL: Customer gave negative feedback
  if (hasGivenFeedback) {
    return {
      isDuplicate: true,
      warningLevel: 'error',
      message: '🚫 This customer already gave feedback (likely negative)',
      details,
      suggestion: 'Do not send another request - they already indicated dissatisfaction'
    }
  }

  // HIGH RISK: Recent request (less than 30 days)
  if (daysAgo < 30) {
    return {
      isDuplicate: true,
      warningLevel: 'error',
      message: `🚫 Recent request sent ${daysAgo} days ago`,
      details,
      suggestion: 'Wait at least 30 days between requests to avoid annoying customers'
    }
  }

  // MEDIUM RISK: Multiple recent requests
  if (totalRequests >= 3) {
    return {
      isDuplicate: true,
      warningLevel: 'warning',
      message: `⚠️ This customer has received ${totalRequests} requests in the last 90 days`,
      details,
      suggestion: 'Consider if another request is really necessary - frequent requests may irritate customers'
    }
  }

  // LOW RISK: Request 30-60 days ago
  if (daysAgo >= 30 && daysAgo < 60) {
    const statusText = getStatusText(lastRequestStatus)
    return {
      isDuplicate: true,
      warningLevel: 'warning',
      message: `⚠️ Previous request sent ${daysAgo} days ago (${statusText})`,
      details,
      suggestion: 'Proceed with caution - customer may remember the previous request'
    }
  }

  // MINIMAL RISK: Request 60-90 days ago
  if (daysAgo >= 60) {
    const statusText = getStatusText(lastRequestStatus)
    return {
      isDuplicate: true,
      warningLevel: 'info',
      message: `ℹ️ Previous request sent ${daysAgo} days ago (${statusText})`,
      details,
      suggestion: 'Generally safe to proceed, but consider if service was provided again recently'
    }
  }

  return {
    isDuplicate: false,
    warningLevel: 'none',
    message: 'Safe to send',
    details
  }
}

function getStatusText(status: string): string {
  switch (status) {
    case 'reviewed':
      return 'customer left review'
    case 'feedback_given':
      return 'customer gave feedback'
    case 'clicked':
      return 'customer clicked link'
    case 'sent':
      return 'SMS delivered but not clicked'
    case 'failed':
      return 'SMS delivery failed'
    case 'scheduled':
      return 'was scheduled but not sent'
    default:
      return status
  }
}