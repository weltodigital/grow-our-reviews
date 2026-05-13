import { NextResponse } from 'next/server'

const BASE = 'https://www.growourreviews.com'

// Mirrors article keys from src/app/blog/[slug]/page.tsx
const BLOG_ARTICLES: { slug: string; lastmod: string }[] = [
  { slug: 'checkatrade-mybuilder-google-reviews-2026', lastmod: '2026-03-16' },
  { slug: 'why-competitor-gets-more-work-than-you', lastmod: '2026-02-15' },
  { slug: 'best-time-to-ask-for-google-review', lastmod: '2026-02-10' },
  { slug: 'how-google-local-search-works-tradesmen', lastmod: '2026-02-05' },
  { slug: 'how-many-google-reviews-to-rank-locally', lastmod: '2026-01-30' },
  { slug: 'google-business-profile-setup-tradesmen', lastmod: '2026-01-25' },
  { slug: 'google-review-response-templates-tradesmen', lastmod: '2026-01-20' },
  { slug: 'google-reviews-vs-checkatrade', lastmod: '2026-01-15' },
  { slug: 'unfair-google-review-tradesman-guide', lastmod: '2026-01-10' },
]

export async function GET() {
  const urls = [
    {
      loc: `${BASE}/blog`,
      lastmod: '2026-03-16',
      changefreq: 'weekly',
      priority: '0.8',
    },
    ...BLOG_ARTICLES.map((a) => ({
      loc: `${BASE}/blog/${a.slug}`,
      lastmod: a.lastmod,
      changefreq: 'monthly',
      priority: '0.7',
    })),
  ]

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
