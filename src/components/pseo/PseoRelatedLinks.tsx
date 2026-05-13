import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Niche, niches, industryLabels } from '@/data/niches'
import { PatternConfig, patterns } from '@/data/pseo-patterns'
import { relatedArticlesFor } from '@/data/blog-articles'

interface Props {
  niche: Niche
  pattern: PatternConfig
}

// Stable string hash so per-niche selections are deterministic across renders
// and distributed evenly across niches (instead of always picking the first N).
function stringHash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

export function PseoRelatedLinks({ niche, pattern }: Props) {
  // Same-industry niches — picks 4 peers using a stride so the 4 picks are
  // spread across the industry list (not just contiguous). Eliminates orphan
  // niches that no sibling ever links to.
  const peers = niches.filter((n) => n.industry === niche.industry && n.slug !== niche.slug)
  const peerStart = peers.length > 0 ? stringHash(niche.slug + 'industry') % peers.length : 0
  const peerStride = Math.max(1, Math.floor(peers.length / 4))
  const sameIndustry: typeof peers = []
  for (let i = 0; i < Math.min(4, peers.length); i++) {
    sameIndustry.push(peers[(peerStart + i * peerStride) % peers.length])
  }

  // Cross-pattern links — same niche on 2 other patterns, rotated per niche
  // so inbound link equity spreads evenly across all 7 other patterns instead
  // of concentrating on a few hub patterns.
  const otherPool = patterns.filter((p) => p.slug !== pattern.slug)
  const patternStart = otherPool.length > 0 ? stringHash(niche.slug + pattern.slug) % otherPool.length : 0
  const stride = Math.max(1, Math.floor(otherPool.length / 2))
  const otherPatterns = [
    otherPool[patternStart],
    otherPool[(patternStart + stride) % otherPool.length],
  ]

  // 3 blog articles, weighted toward the pattern's angle
  const articles = relatedArticlesFor(pattern, niche.slug, niche.industry, 3)

  return (
    <section
      className="section"
      style={{ backgroundColor: 'var(--bg-secondary)', paddingTop: '4rem', paddingBottom: '4rem' }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="grid lg:grid-cols-3 gap-12">
          {/* Other niches in same industry */}
          <div>
            <h3 className="!text-xl !mb-1">
              Other {industryLabels[niche.industry]} we work with
            </h3>
            <p className="text-sm mb-5">
              The same approach works for adjacent {industryLabels[niche.industry].toLowerCase()} —
              same automation, different defaults.
            </p>
            <ul className="space-y-2">
              {sameIndustry.map((other) => (
                <li key={other.slug}>
                  <Link
                    href={`${pattern.pathPrefix}/${other.slug}`}
                    className="text-base inline-flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    {pattern.name} for {other.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Same niche, other patterns */}
          <div>
            <h3 className="!text-xl !mb-1">More for {niche.name.toLowerCase()}</h3>
            <p className="text-sm mb-5">
              Same topic, different angles — useful if you're researching how reviews fit into
              your wider {niche.possessive.toLowerCase()} business.
            </p>
            <ul className="space-y-2">
              {otherPatterns.map((p) => (
                <li key={p.slug}>
                  <Link
                    href={`${p.pathPrefix}/${niche.slug}`}
                    className="text-base inline-flex items-center gap-2 transition-colors"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <ArrowRight className="h-3.5 w-3.5" />
                    {p.name} for {niche.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/#pricing"
                  className="text-base inline-flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  See pricing
                </Link>
              </li>
              <li>
                <Link
                  href="/"
                  className="text-base inline-flex items-center gap-2 transition-colors"
                  style={{ color: 'var(--text-primary)' }}
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                  Back to Grow Our Reviews home
                </Link>
              </li>
            </ul>
          </div>

          {/* Related blog articles */}
          <div>
            <h3 className="!text-xl !mb-1">Further reading</h3>
            <p className="text-sm mb-5">
              Articles from the blog that go deeper into the topics on this page.
            </p>
            <ul className="space-y-3">
              {articles.map((article) => (
                <li key={article.slug}>
                  <Link
                    href={`/blog/${article.slug}`}
                    className="group block"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    <span
                      className="text-xs uppercase tracking-wider font-semibold"
                      style={{ color: 'var(--accent-dark)' }}
                    >
                      {article.category}
                    </span>
                    <span className="block text-base mt-1 group-hover:underline">
                      {article.title}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}
