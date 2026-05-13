import Link from 'next/link'
import { industryLabels, industryOrder, nichesByIndustry } from '@/data/niches'
import { patterns } from '@/data/pseo-patterns'

export function NicheLinksSection() {
  const grouped = nichesByIndustry()

  return (
    <section
      style={{
        backgroundColor: 'var(--bg-secondary)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '3rem 0',
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Explore by topic — links to all 8 pattern index pages */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '0.5rem 1rem',
            marginBottom: '2.5rem',
            paddingBottom: '2rem',
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          <span
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: '0.75rem',
              fontWeight: 600,
              color: 'var(--text-tertiary)',
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              alignSelf: 'center',
            }}
          >
            Explore by topic
          </span>
          {patterns.map((p) => (
            <Link
              key={p.slug}
              href={p.pathPrefix}
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: '0.8125rem',
                color: 'var(--text-secondary)',
                textDecoration: 'none',
                padding: '0.25rem 0.625rem',
                borderRadius: '999px',
                border: '1px solid var(--border-light)',
                transition: 'border-color 0.15s ease, color 0.15s ease',
              }}
            >
              {p.shortName}
            </Link>
          ))}
        </div>

        <h3
          style={{
            fontFamily: "'Lora', serif",
            fontSize: '1.25rem',
            fontWeight: 600,
            color: 'var(--text-primary)',
            marginBottom: '1.5rem',
            textAlign: 'center',
          }}
        >
          Google Review Automation for Every Business
        </h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {industryOrder.map((key) => {
            const items = grouped[key]
            if (!items || items.length === 0) return null
            return (
              <div key={key}>
                <h4
                  style={{
                    fontFamily: "'Inter', sans-serif",
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    color: 'var(--text-tertiary)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    marginBottom: '0.5rem',
                  }}
                >
                  {industryLabels[key]}
                </h4>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                  }}
                >
                  {items.map((n) => (
                    <Link
                      key={n.slug}
                      href={`/automated-google-reviews/${n.slug}`}
                      style={{
                        fontFamily: "'Inter', sans-serif",
                        fontSize: '0.8125rem',
                        color: 'var(--text-secondary)',
                        textDecoration: 'none',
                        transition: 'color 0.15s ease',
                      }}
                    >
                      {n.name}
                    </Link>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
