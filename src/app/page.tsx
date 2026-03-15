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
import { MarketingHeader } from '@/components/marketing/marketing-header'
import { supabase } from '@/lib/supabase'

function HomePageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')

    // If there's an auth code, handle password reset callback
    if (code) {
      handlePasswordResetCallback(code)
    }
  }, [searchParams])

  const handlePasswordResetCallback = async (code: string) => {
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }

    try {
      console.log('Handling password reset callback with code:', code)

      const { error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Code exchange error:', error)
        router.push('/reset-password?error=Invalid or expired reset link')
        return
      }

      console.log('Code exchange successful, redirecting to confirm page')
      router.push('/reset-password/confirm')
    } catch (err) {
      console.error('Unexpected error during code exchange:', err)
      router.push('/reset-password?error=Something went wrong')
    }
  }

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

export default function HomePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  )
}
