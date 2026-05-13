import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getNicheBySlug, niches } from '@/data/niches'
import { getPatternBySlug } from '@/data/pseo-patterns'

export async function pseoGenerateMetadata(
  patternSlug: string,
  params: Promise<{ slug: string }>,
): Promise<Metadata> {
  const { slug } = await params
  const pattern = getPatternBySlug(patternSlug)
  const niche = getNicheBySlug(slug)
  if (!pattern || !niche) {
    return {
      title: 'Page Not Found',
      description: 'The page you are looking for does not exist.',
    }
  }
  const canonical = `https://growourreviews.com${pattern.pathPrefix}/${niche.slug}`
  const title = pattern.title(niche)
  const description = pattern.metaDescription(niche)
  return {
    title,
    description,
    robots: { index: true, follow: true },
    alternates: { canonical },
    openGraph: {
      title,
      description,
      type: 'website',
      url: canonical,
      siteName: 'Grow Our Reviews',
      locale: 'en_GB',
    },
    twitter: { card: 'summary_large_image', title, description },
  }
}

export function pseoStaticParams(): { slug: string }[] {
  return niches.map((n) => ({ slug: n.slug }))
}

export function pseoResolve(patternSlug: string, slug: string) {
  const pattern = getPatternBySlug(patternSlug)
  const niche = getNicheBySlug(slug)
  if (!pattern || !niche) notFound()
  return { pattern, niche }
}
