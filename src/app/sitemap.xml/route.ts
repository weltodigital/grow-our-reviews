import { NextRequest, NextResponse } from 'next/server'
import { readFileSync } from 'fs'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // Read the sitemap.xml file from the public directory
    const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml')
    const sitemap = readFileSync(sitemapPath, 'utf8')

    return new NextResponse(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600'
      },
    })
  } catch (error) {
    console.error('Error serving sitemap:', error)
    return new NextResponse('Sitemap not found', { status: 404 })
  }
}