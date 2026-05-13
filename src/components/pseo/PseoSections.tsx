import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  Search,
  Users,
  Zap,
  Filter,
  Bell,
  Inbox,
  BarChart3,
  Upload,
  ShieldCheck,
} from 'lucide-react'
import { Niche } from '@/data/niches'
import { PatternConfig, SectionContent } from '@/data/pseo-patterns'

interface SectionProps {
  niche: Niche
  pattern: PatternConfig
}

function SectionWrapper({
  children,
  alt = false,
  id,
}: {
  children: React.ReactNode
  alt?: boolean
  id?: string
}) {
  return (
    <section
      id={id}
      className="section"
      style={alt ? { backgroundColor: 'var(--bg-secondary)' } : undefined}
    >
      <div className="container mx-auto px-4 max-w-5xl">{children}</div>
    </section>
  )
}

function SectionHeader({ heading, lede }: { heading: string; lede: string }) {
  return (
    <div className="mb-12">
      <h2 className="mb-6">{heading}</h2>
      <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
        {lede}
      </p>
    </div>
  )
}

function lookup(pattern: PatternConfig, key: keyof PatternConfig['sections']): SectionContent {
  const c = pattern.sections[key]
  if (c) return c
  // Fallback — should never trigger if pattern config is correct
  return { heading: () => '', lede: () => '' }
}

// ============================================================
// PAIN POINTS
// ============================================================
export function PainPointsSection({ niche, pattern }: SectionProps & { alt?: boolean }) {
  const { heading, lede } = lookup(pattern, 'pain-points')
  return (
    <SectionWrapper alt>
      <SectionHeader heading={heading(niche)} lede={lede(niche)} />
      <div className="grid md:grid-cols-2 gap-6">
        {niche.painPoints.map((point, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-6 ring-1"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <AlertCircle
              className="h-5 w-5 mb-3"
              style={{ color: 'var(--status-warning)' }}
            />
            <p className="text-base m-0">{point}</p>
          </div>
        ))}
      </div>
      <div
        className="mt-10 p-6 rounded-2xl text-center"
        style={{ backgroundColor: 'var(--accent-light)' }}
      >
        <p className="font-semibold m-0" style={{ color: 'var(--text-primary)' }}>
          {niche.typicalReviewCount}.
        </p>
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// REVIEW IMPORTANCE
// ============================================================
export function ReviewImportanceSection({ niche, pattern }: SectionProps) {
  const { heading, lede } = lookup(pattern, 'review-importance')
  const competitorMention = niche.competitorPlatforms[0]
  return (
    <SectionWrapper>
      <SectionHeader heading={heading(niche)} lede={lede(niche)} />
      <div className="grid md:grid-cols-3 gap-6">
        <div
          className="rounded-2xl p-6 ring-1"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <Search className="h-6 w-6 mb-3" style={{ color: 'var(--accent-dark)' }} />
          <h4 className="!text-base !mb-2">"{niche.searchTerm}"</h4>
          <p className="text-sm m-0">
            Google shows the top three results for this search based heavily on review
            count, rating, and recency. Most clicks go to those three.
          </p>
        </div>
        <div
          className="rounded-2xl p-6 ring-1"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <Users className="h-6 w-6 mb-3" style={{ color: 'var(--accent-dark)' }} />
          <h4 className="!text-base !mb-2">Trust signal</h4>
          <p className="text-sm m-0">
            For a {niche.businessType}, reviews are the first social proof potential{' '}
            {niche.customerWord}s see — long before they ever talk to you.
          </p>
        </div>
        <div
          className="rounded-2xl p-6 ring-1"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <TrendingUp
            className="h-6 w-6 mb-3"
            style={{ color: 'var(--accent-dark)' }}
          />
          <h4 className="!text-base !mb-2">Permanent asset</h4>
          <p className="text-sm m-0">
            {competitorMention
              ? `Unlike ${competitorMention}, Google reviews are free, owned by you, and don't disappear when you stop paying.`
              : `Reviews are an owned, permanent asset — unlike paid leads that stop the moment you stop paying.`}
          </p>
        </div>
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// HOW GOR WORKS
// ============================================================
export function HowGorWorksSection({ niche, pattern }: SectionProps) {
  const { heading, lede } = lookup(pattern, 'how-gor-works')
  const steps = [
    {
      icon: CheckCircle2,
      title: `Finish a ${niche.jobWord}`,
      body: `Wrap up the work the same way you always have. Nothing changes in how you operate.`,
    },
    {
      icon: Send,
      title: `Add the ${niche.customerWord}`,
      body: `Drop their name and mobile into the app — fifteen seconds, from your phone.`,
    },
    {
      icon: Sparkles,
      title: `Reviews land`,
      body: `Happy ${niche.customerWord}s post directly to Google. Unhappy ones give you private feedback first.`,
    },
  ]
  return (
    <SectionWrapper id="how-it-works">
      <SectionHeader heading={heading(niche)} lede={lede(niche)} />
      <div className="grid md:grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 ring-1"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-4 text-sm font-bold"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              {i + 1}
            </div>
            <step.icon
              className="h-5 w-5 mb-3"
              style={{ color: 'var(--accent-dark)' }}
            />
            <h4 className="!text-lg !mb-2">{step.title}</h4>
            <p className="text-sm m-0">{step.body}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// EXAMPLE JOBS
// ============================================================
export function ExampleJobsSection({ niche, pattern }: SectionProps) {
  const { heading, lede } = lookup(pattern, 'example-jobs')
  return (
    <SectionWrapper alt>
      <SectionHeader heading={heading(niche)} lede={lede(niche)} />
      <div className="grid sm:grid-cols-2 gap-4">
        {niche.exampleJobs.map((job, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl p-5 flex items-start gap-4 ring-1"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <CheckCircle2
              className="h-5 w-5 mt-0.5 shrink-0"
              style={{ color: 'var(--accent-dark)' }}
            />
            <div>
              <h4 className="!text-base !mb-1 capitalize">{job}</h4>
              <p className="text-sm m-0">
                A {niche.customerWord} who's just had a {job} from you is the easiest review
                you'll ever ask for — when the moment is right. The system catches that moment.
              </p>
            </div>
          </div>
        ))}
      </div>
      {niche.seasonality && (
        <div
          className="mt-8 p-5 rounded-2xl flex gap-3 bg-white ring-1"
          style={{ borderColor: 'var(--border-light)' }}
        >
          <Bell
            className="h-5 w-5 mt-0.5 shrink-0"
            style={{ color: 'var(--accent-dark)' }}
          />
          <p className="text-sm m-0">
            <strong>Seasonality note:</strong> {niche.seasonality} — bank reviews in your quiet
            months so your profile is strongest going into the busy season.
          </p>
        </div>
      )}
    </SectionWrapper>
  )
}

// ============================================================
// HOW TO STEPS (Pattern 3)
// ============================================================
export function HowToStepsSection({ niche, pattern }: SectionProps) {
  const { heading, lede } = lookup(pattern, 'how-to-steps')
  const steps = [
    {
      title: `Ask within 24-48 hours of finishing the ${niche.jobWord}`,
      body: `Response rates roughly halve after a week. The fresher the experience, the more likely they post.`,
    },
    {
      title: `Send by SMS, not email`,
      body: `SMS gets opened in minutes. Email gets opened, maybe, on Sunday night. SMS wins for ${niche.name.toLowerCase()} every time.`,
    },
    {
      title: `Personalise the message`,
      body: `Use the ${niche.customerWord}'s name and reference the actual ${niche.jobWord}. Generic templates underperform personalised messages by 2-3x.`,
    },
    {
      title: `Give them a direct link to your Google review form`,
      body: `Don't make them search for your business. One tap from SMS to review form is the gold standard.`,
    },
    {
      title: `Filter out unhappy ${niche.customerWord}s first`,
      body: `Send a low-friction "how was it?" question first. Only ${niche.customerWord}s who rate you highly should be funnelled to Google. The rest give you private feedback.`,
    },
  ]
  return (
    <SectionWrapper>
      <SectionHeader heading={heading(niche)} lede={lede(niche)} />
      <ol className="space-y-6">
        {steps.map((step, i) => (
          <li
            key={i}
            className="flex gap-5 p-6 rounded-2xl ring-1"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
              style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
            >
              {i + 1}
            </div>
            <div>
              <h4 className="!text-lg !mb-1">{step.title}</h4>
              <p className="text-sm m-0">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </SectionWrapper>
  )
}

// ============================================================
// TOOL FEATURES (Patterns 4 & 5)
// ============================================================
export function ToolFeaturesSection({ niche, pattern }: SectionProps) {
  const { heading, lede } = lookup(pattern, 'tool-features')
  const features = [
    {
      icon: MessageSquare,
      title: 'SMS review requests',
      body: `Sent the moment you finish a ${niche.jobWord}. SMS gets a 90%+ open rate within minutes.`,
    },
    {
      icon: Filter,
      title: 'Sentiment gate',
      body: `Unhappy ${niche.customerWord}s give private feedback. Only happy ones go to Google.`,
    },
    {
      icon: Bell,
      title: 'Automatic follow-up nudge',
      body: `If a ${niche.customerWord} doesn't respond to the first request, one polite reminder goes out a few days later. Then it stops — no nagging.`,
    },
    {
      icon: Inbox,
      title: 'Private feedback inbox',
      body: `Every low rating that didn't go to Google lands in your dashboard with its comment, so you can call the ${niche.customerWord} back and fix the issue.`,
    },
    {
      icon: BarChart3,
      title: 'Conversion stats',
      body: `See how many requests you've sent, how many ${niche.customerWord}s clicked through, and how many actually posted a review.`,
    },
    {
      icon: Upload,
      title: `Bulk import past ${niche.customerWord}s`,
      body: `Upload a CSV of recent ${niche.customerWord}s and send a one-off request to all of them — a fast way to bank a wave of reviews.`,
    },
  ]
  return (
    <SectionWrapper>
      <SectionHeader heading={heading(niche)} lede={lede(niche)} />
      <div className="grid md:grid-cols-2 gap-6">
        {features.map((f, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 ring-1"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <f.icon className="h-6 w-6 mb-3" style={{ color: 'var(--accent-dark)' }} />
            <h4 className="!text-base !mb-2">{f.title}</h4>
            <p className="text-sm m-0">{f.body}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// GROWTH (Pattern 6)
// ============================================================
export function GrowthSection({ niche, pattern }: SectionProps) {
  const { heading, lede } = lookup(pattern, 'growth')
  const blocks = [
    {
      stat: niche.averageJobValue,
      label: `Per ${niche.jobWord}`,
      body: `The typical revenue range for a single ${niche.jobWord} at a ${niche.businessType}.`,
    },
    {
      stat: '2-3×',
      label: 'More enquiries',
      body: `What climbing into the top 3 local results typically does to weekly enquiry volume for ${n_or_a(niche)}.`,
    },
    {
      stat: '4-8 weeks',
      label: 'To rank',
      body: `How long consistent review collection typically takes to move the local ranking needle for a ${n_or_a(niche)}.`,
    },
  ]
  return (
    <SectionWrapper>
      <SectionHeader heading={heading(niche)} lede={lede(niche)} />
      <div className="grid md:grid-cols-3 gap-6">
        {blocks.map((b, i) => (
          <div
            key={i}
            className="rounded-2xl p-8 ring-1"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <div
              className="text-4xl font-bold mb-2"
              style={{
                fontFamily: 'var(--font-lora)',
                color: 'var(--accent-dark)',
              }}
            >
              {b.stat}
            </div>
            <div
              className="text-xs uppercase tracking-wider mb-3 font-semibold"
              style={{ color: 'var(--text-tertiary)' }}
            >
              {b.label}
            </div>
            <p className="text-sm m-0">{b.body}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

function n_or_a(niche: Niche) {
  const firstLetter = niche.singular[0]?.toLowerCase()
  const article = 'aeiou'.includes(firstLetter) ? 'an' : 'a'
  return `${article} ${niche.singular.toLowerCase()}`
}

// ============================================================
// LOCAL SEO (Pattern 7)
// ============================================================
export function LocalSeoSection({ niche, pattern }: SectionProps) {
  const { heading, lede } = lookup(pattern, 'local-seo')
  const pillars = [
    {
      icon: Search,
      title: 'Relevance',
      body: `Does Google understand your business actually does this? Categories, services, and on-profile content all feed this. For ${niche.name.toLowerCase()}, the primary category matters most.`,
    },
    {
      icon: Zap,
      title: 'Distance',
      body: `How close are you to the searcher? Mostly fixed for a ${niche.businessType} — you are where you are. Service area settings can help slightly.`,
    },
    {
      icon: Sparkles,
      title: 'Prominence',
      body: `How well-known and well-reviewed is the business? This is the one you can actually move — and for ${niche.name.toLowerCase()} it's almost entirely about reviews.`,
    },
  ]
  return (
    <SectionWrapper>
      <SectionHeader heading={heading(niche)} lede={lede(niche)} />
      <div className="grid md:grid-cols-3 gap-6">
        {pillars.map((p, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 ring-1"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <p.icon className="h-6 w-6 mb-3" style={{ color: 'var(--accent-dark)' }} />
            <h4 className="!text-lg !mb-2">{p.title}</h4>
            <p className="text-sm m-0">{p.body}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// CUSTOMER ACQUISITION (Pattern 8)
// ============================================================
export function CustomerAcquisitionSection({ niche, pattern }: SectionProps) {
  const { heading, lede } = lookup(pattern, 'customer-acquisition')
  const channels = [
    {
      pct: '60%',
      title: 'Local Google search',
      body: `Someone types "${niche.searchTerm}" and clicks one of the top 3 results in the map pack. Owned, ranking-driven, compounds.`,
    },
    {
      pct: '20%',
      title: 'Word of mouth',
      body: `A friend, neighbour, or family member recommends you. Often they'll still Google-check you before calling.`,
    },
    {
      pct: '10%',
      title: 'Directories',
      body: `Platforms like ${niche.competitorPlatforms[0] || 'industry directories'} send paid leads. Useful for top-up — terrible as a primary channel.`,
    },
    {
      pct: '10%',
      title: 'Everything else',
      body: `Social media, leaflets, vehicle wraps, Google Ads, and your existing customer database all combined.`,
    },
  ]
  return (
    <SectionWrapper>
      <SectionHeader heading={heading(niche)} lede={lede(niche)} />
      <div className="grid md:grid-cols-2 gap-6">
        {channels.map((c, i) => (
          <div
            key={i}
            className="rounded-2xl p-6 ring-1"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <div
              className="text-3xl font-bold mb-2"
              style={{ fontFamily: 'var(--font-lora)', color: 'var(--accent-dark)' }}
            >
              {c.pct}
            </div>
            <h4 className="!text-base !mb-2">{c.title}</h4>
            <p className="text-sm m-0">{c.body}</p>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// PRICING
// ============================================================
export function PseoPricingSection({
  niche,
  heading,
}: {
  niche: Niche
  heading: string
}) {
  const plans = [
    {
      name: 'Starter',
      price: 49,
      requests: 150,
      features: [
        'Up to 150 message credits per month',
        'SMS review requests',
        'Automatic follow-up nudges',
        'Sentiment gate (review filtering)',
        'Simple dashboard',
        'Email support',
      ],
      recommended: false,
    },
    {
      name: 'Growth',
      price: 79,
      requests: 300,
      features: ['Up to 300 message credits per month', 'Everything in Starter', 'Priority support'],
      recommended: true,
    },
  ]
  return (
    <SectionWrapper id="pricing">
      <div className="text-center mb-12">
        <h2 className="mb-4">{heading}</h2>
        <p className="page-subtitle mx-auto">
          14-day free trial. Card required. Cancel from the dashboard anytime.
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`relative rounded-2xl p-8 ring-1 ${
              plan.recommended ? 'shadow-lg' : 'shadow-sm bg-white'
            }`}
            style={
              plan.recommended
                ? {
                    backgroundColor: 'var(--accent-light)',
                    borderColor: 'var(--accent)',
                  }
                : { borderColor: 'var(--border-light)' }
            }
          >
            {plan.recommended && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold"
                style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
              >
                Most popular
              </div>
            )}
            <h3 className="!text-2xl !mb-2">{plan.name}</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold" style={{ fontFamily: 'var(--font-lora)' }}>
                £{plan.price}
              </span>
              <span className="text-sm" style={{ color: 'var(--text-tertiary)' }}>
                {' '}
                / month
              </span>
            </div>
            <p className="text-sm mb-6">
              Enough credits for around {plan.requests} {niche.jobWord}s a month.
            </p>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm">
                  <CheckCircle2
                    className="h-4 w-4 mt-1 shrink-0"
                    style={{ color: 'var(--accent-dark)' }}
                  />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <a
              href="https://app.growourreviews.com/signup"
              className="block text-center w-full py-3 rounded-full font-semibold transition-colors"
              style={
                plan.recommended
                  ? { backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--text-primary)',
                      border: '2px solid var(--border-light)',
                    }
              }
            >
              Start Free Trial
            </a>
          </div>
        ))}
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// FAQ
// ============================================================
export function PseoFaqSection({
  faqs,
  heading,
}: {
  faqs: Array<{ q: string; a: string }>
  heading: string
}) {
  return (
    <SectionWrapper alt id="faq">
      <div className="text-center mb-12">
        <h2>{heading}</h2>
      </div>
      <div className="max-w-3xl mx-auto space-y-4">
        {faqs.map((faq, i) => (
          <details
            key={i}
            className="bg-white rounded-2xl p-6 ring-1 group"
            style={{ borderColor: 'var(--border-light)' }}
          >
            <summary className="cursor-pointer font-semibold text-lg list-none flex items-start justify-between gap-4">
              <span style={{ fontFamily: 'var(--font-lora)' }}>{faq.q}</span>
              <span
                className="text-2xl leading-none mt-1 transition-transform group-open:rotate-45"
                style={{ color: 'var(--accent-dark)' }}
              >
                +
              </span>
            </summary>
            <p className="mt-4 text-base m-0">{faq.a}</p>
          </details>
        ))}
      </div>
    </SectionWrapper>
  )
}

// ============================================================
// CTA
// ============================================================
export function PseoCtaSection({ niche, pattern }: SectionProps) {
  return (
    <SectionWrapper>
      <div className="max-w-3xl mx-auto text-center">
        <ShieldCheck
          className="h-10 w-10 mx-auto mb-4"
          style={{ color: 'var(--accent-dark)' }}
        />
        <h2 className="mb-4">{pattern.finalCtaHeading(niche)}</h2>
        <p className="page-subtitle mx-auto mb-8">{pattern.finalCtaBody(niche)}</p>
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
        <p className="mt-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>
          14-day free trial · No setup fees · Cancel anytime
        </p>
      </div>
    </SectionWrapper>
  )
}

