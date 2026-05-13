import { Niche } from '@/data/niches'
import { PatternConfig, SectionKey, faqHeadingFor, pricingHeadingFor } from '@/data/pseo-patterns'
import { NavBubble } from '@/components/navigation/NavBubble'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { PseoHero } from './PseoHero'
import {
  PainPointsSection,
  ReviewImportanceSection,
  HowGorWorksSection,
  ExampleJobsSection,
  HowToStepsSection,
  ToolFeaturesSection,
  GrowthSection,
  LocalSeoSection,
  CustomerAcquisitionSection,
  PseoPricingSection,
  PseoFaqSection,
  PseoCtaSection,
} from './PseoSections'
import { PseoRelatedLinks } from './PseoRelatedLinks'

interface Props {
  niche: Niche
  pattern: PatternConfig
}

function renderSection(key: SectionKey, niche: Niche, pattern: PatternConfig): React.ReactNode {
  switch (key) {
    case 'pain-points':
      return <PainPointsSection niche={niche} pattern={pattern} />
    case 'review-importance':
      return <ReviewImportanceSection niche={niche} pattern={pattern} />
    case 'how-gor-works':
      return <HowGorWorksSection niche={niche} pattern={pattern} />
    case 'example-jobs':
      return <ExampleJobsSection niche={niche} pattern={pattern} />
    case 'how-to-steps':
      return <HowToStepsSection niche={niche} pattern={pattern} />
    case 'tool-features':
      return <ToolFeaturesSection niche={niche} pattern={pattern} />
    case 'growth':
      return <GrowthSection niche={niche} pattern={pattern} />
    case 'local-seo':
      return <LocalSeoSection niche={niche} pattern={pattern} />
    case 'customer-acquisition':
      return <CustomerAcquisitionSection niche={niche} pattern={pattern} />
    case 'pricing':
      return <PseoPricingSection niche={niche} heading={pricingHeadingFor(pattern, niche)} />
    case 'faq':
      return <PseoFaqSection faqs={pattern.faqs(niche)} heading={faqHeadingFor(pattern)} />
    case 'cta':
      return <PseoCtaSection niche={niche} pattern={pattern} />
    default:
      return null
  }
}

export function PseoPage({ niche, pattern }: Props) {
  const canonical = `https://growourreviews.com${pattern.pathPrefix}/${niche.slug}`
  const faqs = pattern.faqs(niche)

  const schemas = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pattern.title(niche),
      description: pattern.metaDescription(niche),
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
          item: `https://growourreviews.com${pattern.pathPrefix}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: niche.name,
          item: canonical,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: faqs.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
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
          <PseoHero niche={niche} pattern={pattern} />
          {pattern.sectionOrder.map((key, i) => (
            <div key={`${key}-${i}`}>{renderSection(key, niche, pattern)}</div>
          ))}
          <PseoRelatedLinks niche={niche} pattern={pattern} />
        </main>
        <MarketingFooter />
      </div>
    </>
  )
}
