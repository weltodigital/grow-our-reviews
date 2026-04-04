'use client'

import { getAppUrl } from '@/lib/utils'

export function LocalSeoCallout() {
  return (
    <section className="section" style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}>
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className="mb-4">
            Every week without fresh Google reviews is a week your competitors are outranking you.
          </h2>
          <p className="page-subtitle mx-auto mb-8" style={{ color: 'var(--accent-dark)' }}>
            Google's local search algorithm updates constantly. Businesses with recent, consistent reviews climb higher. Those without them fall behind. The sooner you start, the sooner your phone rings more.
          </p>
          <a
            href={getAppUrl('/signup')}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold rounded-full transition-colors"
            style={{
              backgroundColor: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              border: 'none'
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-secondary)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-primary)'
            }}
          >
            Start Your Free Trial — It's Free for 14 Days
          </a>
        </div>
      </div>
    </section>
  )
}