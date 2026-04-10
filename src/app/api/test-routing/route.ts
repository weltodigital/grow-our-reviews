import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'GET route working',
    timestamp: new Date().toISOString()
  })
}

export async function POST(request: NextRequest) {
  return NextResponse.json({
    message: 'POST route working',
    timestamp: new Date().toISOString()
  })
}