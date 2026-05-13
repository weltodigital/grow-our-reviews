'use client'

import { useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HeroSection } from '@/components/marketing/hero-section'
import { HowItWorksSection } from '@/components/marketing/how-it-works-section'
import { WhyReviewsMatterSection } from '@/components/marketing/why-reviews-matter-section'
import { FeaturesSection } from '@/components/marketing/features-section'
import { SoundFamiliarSection } from '@/components/marketing/sound-familiar-section'
import { PricingSection } from '@/components/marketing/pricing-section'
import { LocalSeoCallout } from '@/components/marketing/local-seo-callout'
import { FaqSection } from '@/components/marketing/faq-section'
import { MarketingFooter } from '@/components/marketing/marketing-footer'
import { NicheLinksSection } from '@/components/marketing/niche-links-section'
import { NavBubble } from '@/components/navigation/NavBubble'
import { supabase } from '@/lib/supabase'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')

    // Handle existing reset links that still use code format
    if (code) {
      console.log('Legacy auth code detected, redirecting to server callback:', code)
      router.push(`/auth/callback?code=${code}&next=/reset-password/confirm`)
    }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-white">
      <NavBubble />
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
      <NicheLinksSection />
      <MarketingFooter />
    </div>
  )
}

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
