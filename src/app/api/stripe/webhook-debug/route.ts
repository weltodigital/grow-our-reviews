import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook endpoint is accessible',
    url: request.url,
    method: request.method,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headers = Object.fromEntries(request.headers.entries())

    return NextResponse.json({
      message: 'Webhook endpoint received POST request',
      url: request.url,
      method: request.method,
      headers,
      bodyLength: body.length,
      hasStripeSignature: !!headers['stripe-signature'],
      timestamp: new Date().toISOString(),
      bodyPreview: body.substring(0, 200) + (body.length > 200 ? '...' : '')
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Failed to process request',
      message: (error as any).message,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function HEAD(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json({
    message: 'Webhook endpoint supports OPTIONS',
    methods: ['GET', 'POST', 'HEAD', 'OPTIONS'],
    timestamp: new Date().toISOString()
  })
}