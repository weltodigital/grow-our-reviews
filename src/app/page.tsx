import { HeroSection } from '@/components/marketing/hero-section'
import { HowItWorksSection } from '@/components/marketing/how-it-works-section'
import { WhyReviewsMatterSection } from '@/components/marketing/why-reviews-matter-section'
import { FeaturesSection } from '@/components/marketing/features-section'
import { SoundFamiliarSection } from '@/components/marketing/sound-familiar-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { LocalSeoCallout } from '@/components/marketing/local-seo-callout'
import { FaqSection } from '@/components/marketing/faq-section'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { MarketingHeader } from '@/components/marketing/marketing-header'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />
      <main>
        <HeroSection />
        <HowItWorksSection />
        <WhyReviewsMatterSection />
        <FeaturesSection />
        <SoundFamiliarSection />
        <PricingSection />
        <LocalSeoCallout />
        <FaqSection />
      </main>
      <MarketingFooter />
    </div>
  )
}
