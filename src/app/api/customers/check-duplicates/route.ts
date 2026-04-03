import { createServerSupabase } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { phoneNumbers } = await request.json()

    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return NextResponse.json(
        { error: 'Phone numbers array required' },
        { status: 400 }
      )
    }

    // Enhanced duplicate check for last 90 days with risk analysis
    const ninetyDaysAgo = new Date()
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90)

    // SECURITY: Check for SMS suppressions (opt-outs)
    const { data: suppressions, error: suppressionError } = await supabase
      .from('sms_suppressions')
      .select('phone_number, reason, suppressed_at')
      .eq('user_id', user.id)
      .in('phone_number', phoneNumbers)

    if (suppressionError) {
      console.error('Error checking suppressions:', suppressionError)
      // Continue without suppression data rather than failing completely
    }

    const { data: existingRequests, error } = await supabase
      .from('review_requests')
      .select(`
        id,
        status,
        created_at,
        customers!inner(name, phone)
      `)
      .eq('user_id', user.id)
      .gte('created_at', ninetyDaysAgo.toISOString())
      .in('customers.phone', phoneNumbers)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error checking duplicates:', error)
      return NextResponse.json(
        { error: 'Failed to check duplicates' },
        { status: 500 }
      )
    }

    // Analyze each phone number for risk level
    const duplicateAnalysis = phoneNumbers.map(phone => {
      // SECURITY: Check if customer has opted out first (highest priority block)
      const suppression = suppressions?.find((s: any) => s.phone_number === phone)
      if (suppression) {
        const suppressedDate = new Date(suppression.suppressed_at)
        const daysAgoSuppressed = Math.ceil((Date.now() - suppressedDate.getTime()) / (1000 * 60 * 60 * 24))

        return {
          phoneNumber: phone,
          riskLevel: 'critical',
          canProceed: false,
          message: `⛔ Customer opted out ${daysAgoSuppressed} days ago`,
          reason: 'opted_out'
        }
      }

      const phoneRequests = existingRequests?.filter((req: any) => req.customers.phone === phone) || []

      if (phoneRequests.length === 0) {
        return {
          phoneNumber: phone,
          riskLevel: 'none',
          canProceed: true,
          message: 'No previous requests found'
        }
      }

      const mostRecent = phoneRequests[0] as any
      const daysAgo = Math.ceil((Date.now() - new Date(mostRecent.created_at).getTime()) / (1000 * 60 * 60 * 24))
      const hasReviewed = phoneRequests.some((req: any) => req.status === 'reviewed')
      const hasGivenFeedback = phoneRequests.some((req: any) => req.status === 'feedback_given')

      // Critical blocks (should not upload)
      if (hasReviewed) {
        return {
          phoneNumber: phone,
          riskLevel: 'critical',
          canProceed: false,
          message: `Customer already left a review (${daysAgo} days ago)`,
          reason: 'already_reviewed'
        }
      }

      if (hasGivenFeedback) {
        return {
          phoneNumber: phone,
          riskLevel: 'critical',
          canProceed: false,
          message: `Customer already gave feedback (${daysAgo} days ago)`,
          reason: 'gave_feedback'
        }
      }

      if (daysAgo < 30) {
        return {
          phoneNumber: phone,
          riskLevel: 'critical',
          canProceed: false,
          message: `Recent request sent ${daysAgo} days ago`,
          reason: 'recent_request'
        }
      }

      // Warnings (can upload but should review)
      if (phoneRequests.length >= 3) {
        return {
          phoneNumber: phone,
          riskLevel: 'warning',
          canProceed: true,
          message: `${phoneRequests.length} requests in last 90 days`,
          reason: 'multiple_requests'
        }
      }

      if (daysAgo >= 30 && daysAgo < 60) {
        return {
          phoneNumber: phone,
          riskLevel: 'warning',
          canProceed: true,
          message: `Previous request ${daysAgo} days ago`,
          reason: 'moderate_recent'
        }
      }

      // Low risk (generally safe)
      return {
        phoneNumber: phone,
        riskLevel: 'info',
        canProceed: true,
        message: `Previous request ${daysAgo} days ago`,
        reason: 'old_request'
      }
    })

    // Separate into different categories
    const blocked = duplicateAnalysis.filter(item => !item.canProceed)
    const warnings = duplicateAnalysis.filter(item => item.canProceed && item.riskLevel === 'warning')
    const info = duplicateAnalysis.filter(item => item.canProceed && item.riskLevel === 'info')
    const safe = duplicateAnalysis.filter(item => item.riskLevel === 'none')

    return NextResponse.json({
      // Legacy compatibility
      existingPhones: blocked.map(item => item.phoneNumber),

      // Enhanced analysis
      analysis: {
        total: phoneNumbers.length,
        safe: safe.length,
        warnings: warnings.length,
        blocked: blocked.length,
        details: {
          blocked,
          warnings,
          info,
          safe
        }
      }
    })

  } catch (error) {
    console.error('Check duplicates error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}