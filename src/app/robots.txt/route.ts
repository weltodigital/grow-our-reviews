import { NextResponse } from 'next/server';

export async function GET() {
  const robots = `User-agent: *
Allow: /
Disallow: /dashboard/
Disallow: /onboarding/
Disallow: /billing/
Disallow: /review/
Disallow: /test-emails
Disallow: /blog-test
Disallow: /debug-page
Disallow: /test123

Sitemap: https://www.growourreviews.com/sitemap.xml`;

  return new NextResponse(robots, {
    status: 200,
    headers: {
      'Content-Type': 'text/plain',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  });
}