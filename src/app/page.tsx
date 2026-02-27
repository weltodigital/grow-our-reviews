import { HeroSection } from '@/components/marketing/hero-section'
import { HowItWorksSection } from '@/components/marketing/how-it-works-section'
import { WhyReviewsMatterSection } from '@/components/marketing/why-reviews-matter-section'
import { FeaturesSection } from '@/components/marketing/features-section'
import { PricingSection } from '@/components/marketing/pricing-section'
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
        <PricingSection />
        <FaqSection />
      </main>
      <MarketingFooter />
    </div>
  )
}
