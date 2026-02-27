import { PricingHeader } from '@/components/pricing/pricing-header'
import { PricingPlans } from '@/components/pricing/pricing-plans'
import { PricingComparison } from '@/components/pricing/pricing-comparison'
import { PricingFaq } from '@/components/pricing/pricing-faq'
import { PricingCta } from '@/components/pricing/pricing-cta'

export const metadata = {
  title: 'Pricing - Grow Our Reviews',
  description: 'Simple, transparent pricing for review automation. Start with a 7-day free trial.',
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <PricingHeader />
      <main>
        <PricingPlans />
        <PricingComparison />
        <PricingFaq />
        <PricingCta />
      </main>
    </div>
  )
}