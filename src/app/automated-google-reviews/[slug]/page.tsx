import { Metadata } from 'next'
import { PseoPage } from '@/components/pseo/PseoPage'
import {
  pseoGenerateMetadata,
  pseoResolve,
  pseoStaticParams,
} from '@/lib/pseo-page-helpers'

const PATTERN = 'automated-google-reviews'

export function generateStaticParams() {
  return pseoStaticParams()
}

export function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  return pseoGenerateMetadata(PATTERN, params)
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { pattern, niche } = pseoResolve(PATTERN, slug)
  return <PseoPage niche={niche} pattern={pattern} />
}
