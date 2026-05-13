import { Metadata } from 'next'
import { PseoIndexPage } from '@/components/pseo/PseoIndexPage'
import { pseoIndexMetadata, pseoIndexResolve } from '@/lib/pseo-index-helpers'

const PATTERN = 'google-review-tool'

export const metadata: Metadata = pseoIndexMetadata(PATTERN)

export default function Page() {
  const pattern = pseoIndexResolve(PATTERN)
  return <PseoIndexPage pattern={pattern} />
}
