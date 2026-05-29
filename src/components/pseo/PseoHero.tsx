import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'
import { Niche } from '@/data/niches'
import { PatternConfig } from '@/data/pseo-patterns'

interface Props {
  niche: Niche
  pattern: PatternConfig
}

export function PseoHero({ niche, pattern }: Props) {
  return (
    <section className="relative bg-gradient-to-br from-green-50 to-lime-100 py-20 sm:py-28">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
            style={{
              backgroundColor: 'var(--accent-light)',
              color: 'var(--accent-dark)',
            }}
          >
            <Star className="h-3.5 w-3.5" />
            {pattern.heroEyebrow} for {niche.name}
          </div>
          <h1>{pattern.h1(niche)}</h1>
          <p className="hero-subtitle mt-6 mx-auto">{pattern.heroSubtitle(niche)}</p>
          <div className="mt-10 flex items-center justify-center gap-4 flex-wrap">
            <a
              href="https://app.growourreviews.com/signup"
              className="inline-flex items-center gap-2 px-8 py-4 text-lg font-semibold rounded-full transition-colors"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              {pattern.primaryCta}
              <ArrowRight className="h-4 w-4" />
            </a>
            <Link
              href="#how-it-works"
              className="inline-flex items-center px-8 py-4 text-lg font-medium rounded-full border-2 transition-colors"
              style={{
                color: 'var(--text-primary)',
                borderColor: 'var(--border-light)',
                backgroundColor: 'transparent',
              }}
            >
              {pattern.secondaryCta}
            </Link>
          </div>
          <p className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
            7-day free trial · No card required · Cancel anytime
          </p>
        </div>
      </div>
    </section>
  )
}
