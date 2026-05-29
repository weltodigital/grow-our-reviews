import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { industryLabels, industryOrder, nichesByIndustry } from '@/data/niches'
import { PatternConfig } from '@/data/pseo-patterns'
import { NavBubble } from '@/components/navigation/NavBubble'
import { MarketingFooter } from '@/components/marketing/marketing-footer'

interface Props {
  pattern: PatternConfig
}

export function PseoIndexPage({ pattern }: Props) {
  const grouped = nichesByIndustry()
  const canonical = `https://growourreviews.com${pattern.pathPrefix}`
  const totalNiches = Object.values(grouped).reduce((sum, arr) => sum + arr.length, 0)

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: pattern.indexTitle,
      description: pattern.indexDescription,
      url: canonical,
      inLanguage: 'en-GB',
      publisher: {
        '@type': 'Organization',
        name: 'Grow Our Reviews',
        url: 'https://growourreviews.com',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'Home',
          item: 'https://growourreviews.com',
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: pattern.name,
          item: canonical,
        },
      ],
    },
  ]

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemas) }}
      />
      <div className="min-h-screen bg-white">
        <NavBubble />
        <main>
          <section className="relative bg-gradient-to-br from-green-50 to-lime-100 py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <div
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-6"
                  style={{
                    backgroundColor: 'var(--accent-light)',
                    color: 'var(--accent-dark)',
                  }}
                >
                  {pattern.heroEyebrow}
                </div>
                <h1>{pattern.indexTitle}</h1>
                <p className="hero-subtitle mt-6 mx-auto">{pattern.indexLede}</p>
                <p className="mt-4 text-sm" style={{ color: 'var(--text-tertiary)' }}>
                  {totalNiches} industries covered · One platform that adapts to each
                </p>
              </div>
            </div>
          </section>

          <section className="section">
            <div className="container mx-auto px-4 max-w-6xl">
              {industryOrder.map((industryKey) => {
                const items = grouped[industryKey]
                if (!items || items.length === 0) return null
                return (
                  <div key={industryKey} className="mb-16">
                    <div className="flex items-baseline justify-between mb-6">
                      <h2 className="!text-2xl">{industryLabels[industryKey]}</h2>
                      <span
                        className="text-sm"
                        style={{ color: 'var(--text-tertiary)' }}
                      >
                        {items.length} {items.length === 1 ? 'industry' : 'industries'}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map((niche) => (
                        <Link
                          key={niche.slug}
                          href={`${pattern.pathPrefix}/${niche.slug}`}
                          className="rounded-2xl p-5 ring-1 transition-shadow hover:shadow-md group"
                          style={{
                            backgroundColor: 'white',
                            borderColor: 'var(--border-light)',
                          }}
                        >
                          <h3 className="!text-lg !mb-1 flex items-center gap-2">
                            <span>{niche.name}</span>
                            <ArrowRight
                              className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity"
                              style={{ color: 'var(--accent-dark)' }}
                            />
                          </h3>
                          <p className="text-sm m-0">
                            {pattern.name} for {niche.businessType}.
                          </p>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>

          <section
            className="section"
            style={{ backgroundColor: 'var(--bg-secondary)' }}
          >
            <div className="container mx-auto px-4 max-w-3xl text-center">
              <h2 className="mb-4">
                Don't see your industry? You probably still fit.
              </h2>
              <p className="page-subtitle mx-auto mb-8">
                Grow Our Reviews works for any business that finishes work for a customer
                and could ask for a review afterwards. If that's you, the trial is free for
                7 days — no card required.
              </p>
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
            </div>
          </section>
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}
