import { NextResponse } from 'next/server'

const BASE = 'https://www.growourreviews.com'

interface UrlEntry {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: string
}

export async function GET() {
  const today = '2026-05-12'
  const urls: UrlEntry[] = [
    { loc: `${BASE}/`, lastmod: today, changefreq: 'monthly', priority: '1.0' },
    { loc: `${BASE}/privacy`, lastmod: '2025-01-01', changefreq: 'yearly', priority: '0.3' },
    { loc: `${BASE}/terms`, lastmod: '2025-01-01', changefreq: 'yearly', priority: '0.3' },
    { loc: `${BASE}/cookies`, lastmod: '2025-01-01', changefreq: 'yearly', priority: '0.3' },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>${u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : ''}${
      u.changefreq ? `\n    <changefreq>${u.changefreq}</changefreq>` : ''
    }${u.priority ? `\n    <priority>${u.priority}</priority>` : ''}
  </url>`,
  )
  .join('\n')}
</urlset>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
