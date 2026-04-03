import { NextRequest, NextResponse } from 'next/server'

/**
 * Admin authentication middleware for protecting admin endpoints
 *
 * Usage:
 * const authResult = validateAdminAuth(request)
 * if (authResult !== true) return authResult // Returns error response
 */
export function validateAdminAuth(request: NextRequest): true | NextResponse {
  try {
    // Check for admin API key in headers
    const adminKey = request.headers.get('x-admin-key') || request.headers.get('authorization')?.replace('Bearer ', '')

    // Validate admin key exists
    if (!adminKey) {
      console.warn('Admin endpoint access attempt without API key', {
        url: request.url,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        {
          error: 'Admin authentication required',
          message: 'Missing admin API key in x-admin-key header'
        },
        { status: 401 }
      )
    }

    // Validate admin key matches environment variable
    const expectedKey = process.env.ADMIN_API_KEY
    if (!expectedKey) {
      console.error('ADMIN_API_KEY environment variable not configured!')
      return NextResponse.json(
        {
          error: 'Server configuration error',
          message: 'Admin authentication not properly configured'
        },
        { status: 500 }
      )
    }

    if (adminKey !== expectedKey) {
      console.warn('Admin endpoint access attempt with invalid API key', {
        url: request.url,
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
        providedKey: adminKey.substring(0, 8) + '...', // Log first 8 chars for debugging
        userAgent: request.headers.get('user-agent')?.substring(0, 100),
        timestamp: new Date().toISOString()
      })

      return NextResponse.json(
        {
          error: 'Invalid admin credentials',
          message: 'Invalid admin API key provided'
        },
        { status: 403 }
      )
    }

    // Log successful admin access for audit trail
    console.log('Admin endpoint access granted', {
      url: request.url,
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
      timestamp: new Date().toISOString()
    })

    return true
  } catch (error) {
    console.error('Error in admin authentication:', error)
    return NextResponse.json(
      {
        error: 'Authentication error',
        message: 'Failed to validate admin credentials'
      },
      { status: 500 }
    )
  }
}

/**
 * Rate limiting for admin endpoints to prevent abuse
 * Simple in-memory rate limiting (can be enhanced with Redis for production)
 */
const adminAccessLog = new Map<string, { count: number; firstAccess: number }>()

export function checkAdminRateLimit(request: NextRequest, maxRequests: number = 100, windowMinutes: number = 60): true | NextResponse {
  const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
  const now = Date.now()
  const windowMs = windowMinutes * 60 * 1000

  // Clean up old entries
  for (const [key, data] of adminAccessLog.entries()) {
    if (now - data.firstAccess > windowMs) {
      adminAccessLog.delete(key)
    }
  }

  // Check current IP
  const current = adminAccessLog.get(ip)

  if (!current) {
    adminAccessLog.set(ip, { count: 1, firstAccess: now })
    return true
  }

  // Reset if window expired
  if (now - current.firstAccess > windowMs) {
    adminAccessLog.set(ip, { count: 1, firstAccess: now })
    return true
  }

  // Check if over limit
  if (current.count >= maxRequests) {
    console.warn('Admin rate limit exceeded', {
      ip,
      requests: current.count,
      windowMinutes,
      url: request.url
    })

    return NextResponse.json(
      {
        error: 'Rate limit exceeded',
        message: `Too many admin requests. Limit: ${maxRequests} per ${windowMinutes} minutes`
      },
      { status: 429 }
    )
  }

  // Increment counter
  current.count++
  return true
}

/**
 * Complete admin endpoint protection (auth + rate limiting)
 */
export function protectAdminEndpoint(request: NextRequest): true | NextResponse {
  // Check rate limiting first
  const rateLimitResult = checkAdminRateLimit(request)
  if (rateLimitResult !== true) return rateLimitResult

  // Then check authentication
  const authResult = validateAdminAuth(request)
  if (authResult !== true) return authResult

  return true
}