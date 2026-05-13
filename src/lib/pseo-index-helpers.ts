import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPatternBySlug } from '@/data/pseo-patterns'

export function pseoIndexMetadata(patternSlug: string): Metadata {
  const pattern = getPatternBySlug(patternSlug)
  if (!pattern) {
    return { title: 'Page Not Found' }
  }
  const canonical = `https://growourreviews.com${pattern.pathPrefix}`
  const title = `${pattern.indexTitle} | Grow Our Reviews`
  const description = pattern.indexDescription
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

export function pseoIndexResolve(patternSlug: string) {
  const pattern = getPatternBySlug(patternSlug)
  if (!pattern) notFound()
  return pattern
}
