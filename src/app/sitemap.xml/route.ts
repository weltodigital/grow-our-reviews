import { NextResponse } from 'next/server'

const BASE = 'https://www.growourreviews.com'

export async function GET() {
  const today = new Date().toISOString().split('T')[0]
  const children = [
    { loc: `${BASE}/sitemap-pages.xml`, lastmod: today },
    { loc: `${BASE}/sitemap-blog.xml`, lastmod: today },
    { loc: `${BASE}/sitemap-niches.xml`, lastmod: today },
  ]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${children
  .map(
    (c) => `  <sitemap>
    <loc>${c.loc}</loc>
    <lastmod>${c.lastmod}</lastmod>
  </sitemap>`,
  )
  .join('\n')}
</sitemapindex>`

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  })
}
