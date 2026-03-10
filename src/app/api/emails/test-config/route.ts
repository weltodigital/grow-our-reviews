import { NextRequest, NextResponse } from 'next/server'
import { resend } from '@/lib/resend'

export async function GET(request: NextRequest) {
  try {
    // Check if Resend is configured
    const isResendConfigured = !!resend
    const hasApiKey = !!process.env.RESEND_API_KEY
    const apiKeyLength = process.env.RESEND_API_KEY?.length || 0

    return NextResponse.json({
      configured: isResendConfigured,
      hasApiKey: hasApiKey,
      apiKeyLength: apiKeyLength,
      apiKeyPrefix: process.env.RESEND_API_KEY?.substring(0, 8) || 'none',
      resendInstance: !!resend,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown'
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to check configuration',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}