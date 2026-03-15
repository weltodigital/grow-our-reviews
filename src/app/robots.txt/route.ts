import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // Read the robots.txt file from the public directory
    const robotsPath = join(process.cwd(), 'public', 'robots.txt')
    const robots = readFileSync(robotsPath, 'utf8')

    return new NextResponse(robots, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      },
    })
  } catch (error) {
    console.error('Error serving robots.txt:', error)
    return new NextResponse('Robots.txt not found', { status: 404 })
  }
}