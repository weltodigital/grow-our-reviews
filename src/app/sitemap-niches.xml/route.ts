import { NextResponse } from 'next/server'
import { niches } from '@/data/niches'
import { patterns } from '@/data/pseo-patterns'

const BASE = 'https://www.growourreviews.com'

export async function GET() {
  const today = '2026-05-12'

  // Pattern index pages
  const indexUrls = patterns.map((p) => ({
    loc: `${BASE}${p.pathPrefix}`,
    lastmod: today,
    changefreq: 'monthly',
    priority: '0.7',
  }))

  // 8 × 86 niche pages
  const nicheUrls = patterns.flatMap((p) =>
    niches.map((n) => ({
      loc: `${BASE}${p.pathPrefix}/${n.slug}`,
      lastmod: today,
      changefreq: 'monthly',
      priority: '0.6',
    })),
  )

  const urls = [...indexUrls, ...nicheUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
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
