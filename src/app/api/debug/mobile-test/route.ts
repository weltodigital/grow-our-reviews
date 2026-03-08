import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    method: 'GET',
    message: 'Mobile debug GET endpoint working',
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  try {
    let body = null
    try {
      body = await request.json()
    } catch {
      body = 'Could not parse JSON'
    }

    return NextResponse.json({
      method: 'POST',
      message: 'Mobile debug POST endpoint working',
      headers: Object.fromEntries(request.headers.entries()),
      url: request.url,
      body,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return NextResponse.json({
      method: 'POST',
      error: error instanceof Error ? error.message : 'Unknown error',
      headers: Object.fromEntries(request.headers.entries()),
      url: request.url,
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  return NextResponse.json({
    method: 'PUT',
    message: 'Mobile debug PUT endpoint working',
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
    timestamp: new Date().toISOString()
  })
}

export async function DELETE(request: NextRequest) {
  return NextResponse.json({
    method: 'DELETE',
    message: 'Mobile debug DELETE endpoint working',
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
    timestamp: new Date().toISOString()
  })
}

export async function PATCH(request: NextRequest) {
  return NextResponse.json({
    method: 'PATCH',
    message: 'Mobile debug PATCH endpoint working',
    headers: Object.fromEntries(request.headers.entries()),
    url: request.url,
    timestamp: new Date().toISOString()
  })
}