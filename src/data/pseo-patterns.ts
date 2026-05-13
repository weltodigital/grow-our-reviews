import { Niche } from './niches'

export type SectionKey =
  | 'pain-points'
  | 'review-importance'
  | 'how-gor-works'
  | 'example-jobs'
  | 'how-to-steps'
  | 'tool-features'
  | 'growth'
  | 'local-seo'
  | 'customer-acquisition'
  | 'pricing'
  | 'faq'
  | 'cta'

export interface FaqItem {
  q: string
  a: string
}

export interface SectionContent {
  heading: (n: Niche) => string
  lede: (n: Niche) => string
}

export interface PatternConfig {
  slug: string
  pathPrefix: string
  name: string
  shortName: string
  indexTitle: string
  indexDescription: string
  indexLede: string
  title: (n: Niche) => string
  metaDescription: (n: Niche) => string
  h1: (n: Niche) => string
  heroEyebrow: string
  heroSubtitle: (n: Niche) => string
  primaryCta: string
  secondaryCta: string
  finalCtaHeading: (n: Niche) => string
  finalCtaBody: (n: Niche) => string
  sectionOrder: SectionKey[]
  sections: Partial<Record<SectionKey, SectionContent>>
  faqs: (n: Niche) => FaqItem[]
}

// Pricing and FAQ section headings — shared but reworded per pattern
const pricingHeadings: Record<string, (n: Niche) => string> = {
  product: (n) => `Pricing for ${n.name}`,
  management: (n) => `What ${n.singular} Review Management Costs`,
  howto: (n) => `What It Costs (For a ${n.singular})`,
  software: (n) => `${n.name} Pricing — Simple and Flat`,
  tool: (n) => `The Tool's Price for ${n.name}`,
  growth: (n) => `Investment to Grow Your ${n.possessive} Business`,
  seo: (n) => `Pricing for ${n.singular} Local SEO`,
  customers: (n) => `Pricing to Get You More ${n.singular === 'Dentist' || n.singular === 'Vet' ? 'Patients' : 'Customers'}`,
}

const faqHeadings: Record<string, string> = {
  product: 'Frequently Asked Questions',
  management: 'Common Questions From Owners',
  howto: 'Quick Answers',
  software: 'Questions About the Software',
  tool: 'Tool FAQs',
  growth: 'Questions From Growing Businesses',
  seo: 'Local SEO Questions',
  customers: 'Common Questions',
}

// ============================================================
// PATTERN 1 — Automated Google Reviews (product / automation)
// ============================================================
const pattern1: PatternConfig = {
  slug: 'automated-google-reviews',
  pathPrefix: '/automated-google-reviews',
  name: 'Automated Google Reviews',
  shortName: 'Review Automation',
  indexTitle: 'Automated Google Reviews by Industry',
  indexDescription:
    'Pick your industry to see how automated Google review collection works for your specific trade or service. Built for UK businesses who finish jobs and never get round to asking.',
  indexLede:
    'Grow Our Reviews sends a polite SMS request to your customer after every job — so the reviews come in while you carry on working. Pick your industry to see exactly how it fits.',
  title: (n) => `Automated Google Reviews for ${n.name} | Grow Our Reviews`,
  metaDescription: (n) =>
    `Automate your Google review collection as a ${n.singular.toLowerCase()}. Send review requests to ${n.customerWord}s after every ${n.jobWord}. More reviews, better local rankings, more work. Free 14-day trial.`,
  h1: (n) => `Automated Google Reviews for ${n.name}`,
  heroEyebrow: 'Review Automation',
  heroSubtitle: (n) =>
    `Grow Our Reviews sends your ${n.customerWord}s a review request after every ${n.jobWord}. More Google reviews, better local rankings, more ${n.customerWord}s finding you.`,
  primaryCta: 'Start Your Free Trial',
  secondaryCta: 'See how it works',
  finalCtaHeading: (n) =>
    `Start collecting Google reviews for your ${n.businessType} today.`,
  finalCtaBody: (n) =>
    `Set up takes ten minutes. Your next ${n.jobWord} could be the one that finally gets reviewed — automatically, with no chasing.`,
  sectionOrder: ['pain-points', 'review-importance', 'how-gor-works', 'example-jobs', 'pricing', 'faq', 'cta'],
  sections: {
    'pain-points': {
      heading: (n) => `Why Most ${n.name} Have Too Few Google Reviews`,
      lede: (n) =>
        `The work doesn't stop and the asking gets forgotten. Most ${n.name.toLowerCase()} can name half a dozen ${n.customerWord}s they could have asked last month — and didn't. ${n.typicalReviewCount}, and you're nowhere near it because the process is manual.`,
    },
    'review-importance': {
      heading: (n) => `Why Google Reviews Matter for ${n.name}`,
      lede: (n) =>
        `${n.reviewImportance} When someone searches "${n.searchTerm}", Google shows the top three results based heavily on review count and rating — and those three results get most of the clicks.`,
    },
    'how-gor-works': {
      heading: (n) => `How Grow Our Reviews Works for ${n.name}`,
      lede: (n) =>
        `Three steps, no chasing. Finish a ${n.jobWord}, drop your ${n.customerWord}'s name and number into the app, and we handle the rest. Happy ${n.customerWord}s go straight to your Google profile. Unhappy ones give you private feedback first — so your public rating stays clean.`,
    },
    'example-jobs': {
      heading: (n) => `Works for Every Type of ${n.possessive} Work`,
      lede: (n) =>
        `Whether you're doing a ${n.exampleJobs[0]} or an emergency ${n.exampleJobs[2] || n.exampleJobs[0]}, the workflow is the same — the request goes out, the review comes in.`,
    },
  },
  faqs: (n) => [
    {
      q: `How many Google reviews does a ${n.singular.toLowerCase()} need to rank locally?`,
      a: `${n.typicalReviewCount}. The exact number depends on how competitive your area is, but consistency matters as much as volume — Google looks at how recently you've been collecting them.`,
    },
    {
      q: `Can I send review requests to my existing ${n.customerWord}s?`,
      a: `Yes. You can bulk import past ${n.customerWord}s and send a one-off request asking for a review. Most ${n.name.toLowerCase()} get a wave of reviews in the first week by reaching back to recent ${n.customerWord}s who would have happily reviewed if asked.`,
    },
    {
      q: `What if a ${n.customerWord} is unhappy?`,
      a: `Unhappy ${n.customerWord}s never reach your public Google profile. The sentiment gate intercepts low ratings and turns them into private feedback you can act on — protecting your rating and giving you a chance to fix it.`,
    },
    {
      q: `How long until I see results as a ${n.singular.toLowerCase()}?`,
      a: `Most ${n.businessType} owners get their first new reviews within the first week. Local ranking changes typically follow within 4-8 weeks of consistent collection.`,
    },
  ],
}

// ============================================================
// PATTERN 2 — Google Review Management (management/oversight)
// ============================================================
const pattern2: PatternConfig = {
  slug: 'google-review-management',
  pathPrefix: '/google-review-management',
  name: 'Google Review Management',
  shortName: 'Review Management',
  indexTitle: 'Google Review Management by Industry',
  indexDescription:
    'Automate the parts of Google review management that take all the time: collecting new reviews, filtering unhappy customers into private feedback, and seeing your full review profile in one dashboard. Pick your industry.',
  indexLede:
    'Most owners juggle three problems: not enough reviews coming in, no clean way to handle unhappy customers, and no single place to see how the profile is performing. Pick your industry below.',
  title: (n) => `Google Review Management for ${n.name} | Grow Our Reviews`,
  metaDescription: (n) =>
    `Automate Google review management for your ${n.businessType}. Collect new reviews on autopilot, route unhappy ${n.customerWord}s to private feedback, and see your whole profile in one dashboard. Free 14-day trial.`,
  h1: (n) => `Google Review Management for ${n.name}`,
  heroEyebrow: 'Hands-Off Management',
  heroSubtitle: (n) =>
    `Automate the parts of your Google review profile that always slip — the asking, the unhappy-${n.customerWord} handling, and the visibility — so the only thing left for you is the work itself.`,
  primaryCta: 'Manage Your Reviews',
  secondaryCta: 'See the dashboard',
  finalCtaHeading: (n) =>
    `Take control of your ${n.possessive.toLowerCase()} review profile.`,
  finalCtaBody: (n) =>
    `Reviews coming in on their own. Unhappy ${n.customerWord}s caught before they reach Google. Your existing reviews visible in one dashboard. That's the work the system takes off your plate.`,
  sectionOrder: ['how-gor-works', 'review-importance', 'pain-points', 'example-jobs', 'pricing', 'faq', 'cta'],
  sections: {
    'how-gor-works': {
      heading: (n) => `What Review Management Looks Like for a ${n.singular}`,
      lede: (n) =>
        `Three jobs sit behind every healthy review profile: getting reviews in, filtering out the unhappy ${n.customerWord}s before they post in public, and keeping an eye on what your profile actually says. For a busy ${n.businessType}, doing all three by hand is what falls off the to-do list. The dashboard handles the first two on autopilot and surfaces the third.`,
    },
    'review-importance': {
      heading: (n) => `Why a Managed Review Profile Wins for ${n.name}`,
      lede: (n) =>
        `Google doesn't just count your reviews — it watches how you handle them. ${n.reviewImportance} A managed profile shows fresh reviews, prompt replies, and steady momentum, which the local algorithm rewards.`,
    },
    'pain-points': {
      heading: (n) => `The Management Headaches ${n.name} Run Into`,
      lede: (n) =>
        `It's never one problem — it's all four at once. Below are the daily friction points that stop most ${n.businessType} owners from building a strong public profile, even when they want to.`,
    },
    'example-jobs': {
      heading: (n) => `Fits Every ${n.singular} Workflow`,
      lede: (n) =>
        `Whatever your bread and butter — from a ${n.exampleJobs[0]} to a one-off ${n.exampleJobs[1]} — the review management workflow plugs in without changing how you work.`,
    },
  },
  faqs: (n) => [
    {
      q: `Can I see all my Google reviews in the dashboard?`,
      a: `Yes — your existing Google reviews are pulled in and displayed in the dashboard so you can see your whole profile in one place. Replies still need to be posted on Google itself, which is where they're hosted.`,
    },
    {
      q: `What if a ${n.customerWord} is unhappy?`,
      a: `The sentiment gate catches them before they post publicly. Anyone who rates 1-3 stars is shown a private feedback form instead of the Google review form, so you get a chance to fix the issue — and your public rating doesn't take the hit.`,
    },
    {
      q: `Where do I see the unhappy ${n.customerWord} feedback?`,
      a: `In the private feedback inbox in your dashboard. Every low rating that didn't go to Google lands there with whatever comment they left, so you can call them, fix the issue, and protect future reviews.`,
    },
    {
      q: `Does it integrate with my existing software?`,
      a: `Not at the moment — Grow Our Reviews is a standalone dashboard. Most ${n.businessType} owners add the ${n.customerWord} directly from their phone after finishing the ${n.jobWord}.`,
    },
  ],
}

// ============================================================
// PATTERN 3 — Get More Google Reviews (how-to / educational)
// ============================================================
const pattern3: PatternConfig = {
  slug: 'get-more-google-reviews',
  pathPrefix: '/get-more-google-reviews',
  name: 'Get More Google Reviews',
  shortName: 'How to Get More Reviews',
  indexTitle: 'How to Get More Google Reviews — by Industry',
  indexDescription:
    'A straight-talking guide to getting more Google reviews, written specifically for each industry. No fluff — just what actually works for your trade.',
  indexLede:
    'The advice for a plumber isn\'t the advice for a hair salon. Pick your industry below for a guide tailored to how your customers actually behave.',
  title: (n) => `How to Get More Google Reviews as a ${n.singular} | Grow Our Reviews`,
  metaDescription: (n) =>
    `A practical guide to getting more Google reviews as a ${n.singular.toLowerCase()}. When to ask, what to say, and how to automate the whole thing. Plus the tool that does it for you.`,
  h1: (n) => `How to Get More Google Reviews as a ${n.singular}`,
  heroEyebrow: 'The Practical Guide',
  heroSubtitle: (n) =>
    `If you've ever finished a ${n.jobWord} and forgotten to ask, this is for you. A short, honest guide to filling your Google profile with real reviews — without it feeling weird.`,
  primaryCta: 'Get Started Free',
  secondaryCta: 'Read the guide',
  finalCtaHeading: (n) =>
    `Ready to get your first wave of new reviews?`,
  finalCtaBody: (n) =>
    `The guide above is what works. The fastest way to actually do it is to let the system ask for you — after every ${n.jobWord}, automatically.`,
  sectionOrder: ['review-importance', 'pain-points', 'how-to-steps', 'how-gor-works', 'example-jobs', 'pricing', 'faq', 'cta'],
  sections: {
    'review-importance': {
      heading: (n) => `Why More Reviews = More Work for ${n.name}`,
      lede: (n) =>
        `Before the how, here's the why. ${n.reviewImportance} Every extra review past your current count earns you a slightly better position in local search, which means slightly more phone calls — and the maths compounds fast.`,
    },
    'pain-points': {
      heading: (n) => `Why It's So Hard to Get Reviews as a ${n.singular}`,
      lede: (n) =>
        `The barrier isn't your work — it's the moment. Reviews happen when the asking is easy and the timing is right, and for most ${n.name.toLowerCase()} both of those things are working against you.`,
    },
    'how-to-steps': {
      heading: (n) => `The 5-Step System to Get More Reviews`,
      lede: (n) =>
        `This is the playbook we've watched work across hundreds of ${n.businessType} owners. None of it is clever — it's just consistent.`,
    },
    'how-gor-works': {
      heading: (n) => `Or Let It Run Itself`,
      lede: (n) =>
        `The five steps above work. The problem is keeping them up when you're knee-deep in a ${n.jobWord}. Grow Our Reviews automates step 1 through step 4 — you just finish the job.`,
    },
    'example-jobs': {
      heading: (n) => `Examples From a Working ${n.singular}'s Week`,
      lede: (n) =>
        `Picture a typical week — a ${n.exampleJobs[0]}, a ${n.exampleJobs[1]}, maybe a ${n.exampleJobs[2] || n.exampleJobs[1]}. Each one is a potential review. Here's how the asking fits each.`,
    },
  },
  faqs: (n) => [
    {
      q: `When is the best time to ask a ${n.customerWord} for a review?`,
      a: `Within 24-48 hours of finishing the ${n.jobWord}, while the experience is fresh. Wait a week and the response rate drops by more than half — we've measured it.`,
    },
    {
      q: `What's the highest-converting message to send?`,
      a: `Short, polite, and personal. Mention the ${n.customerWord}'s name, what you did, and a direct link to your Google review page. The fewer clicks between SMS and review form, the higher the conversion.`,
    },
    {
      q: `Is it OK to offer an incentive?`,
      a: `No. Google's policy explicitly bans incentivised reviews and they'll strip them — sometimes along with your whole rating. Don't risk it.`,
    },
    {
      q: `How many requests should I send per month as a ${n.singular.toLowerCase()}?`,
      a: `Send one to every ${n.customerWord} you've genuinely served. The "right number" is whatever your real job volume is — the goal is steady, not bulk.`,
    },
  ],
}

// ============================================================
// PATTERN 4 — Review Software (software / features)
// ============================================================
const pattern4: PatternConfig = {
  slug: 'review-software',
  pathPrefix: '/review-software',
  name: 'Review Software',
  shortName: 'Review Software',
  indexTitle: 'Review Software by Industry',
  indexDescription:
    'Review software built around how each industry actually works. Pick yours to see the features that matter and the ones we don\'t bother with.',
  indexLede:
    'Every industry asks for reviews differently. Our software ships with the right defaults for your trade — pick your industry to see what changes.',
  title: (n) => `Review Software for ${n.name} | Grow Our Reviews`,
  metaDescription: (n) =>
    `Simple review software built for ${n.name.toLowerCase()}. SMS requests, sentiment-gated routing, private feedback inbox, conversion stats, and CSV bulk import — everything a ${n.businessType} needs in one app. 14-day free trial.`,
  h1: (n) => `Review Software for ${n.name}`,
  heroEyebrow: 'Purpose-Built Software',
  heroSubtitle: (n) =>
    `Software designed for a ${n.businessType}, not a generic SaaS dashboard. SMS-first, low admin, and a phone-friendly interface for when you're between ${n.exampleJobs[0]}s.`,
  primaryCta: 'Try the Software',
  secondaryCta: 'See the features',
  finalCtaHeading: (n) =>
    `Software that earns its keep — for ${n.name.toLowerCase()}.`,
  finalCtaBody: (n) =>
    `No setup fees, no annual contracts, no per-seat pricing. Just the features that move your review count up and your admin down.`,
  sectionOrder: ['tool-features', 'pain-points', 'review-importance', 'example-jobs', 'pricing', 'faq', 'cta'],
  sections: {
    'tool-features': {
      heading: (n) => `What the Software Does for ${n.name}`,
      lede: (n) =>
        `Six features, all built around the same job: turn a finished ${n.jobWord} into a posted review with the least possible work from you. Nothing fluffy. Nothing you'd never use.`,
    },
    'pain-points': {
      heading: (n) => `What Software Like This Solves for ${n.name}`,
      lede: (n) =>
        `Generic CRMs treat a ${n.businessType} like a tech startup. Bespoke booking software costs hundreds a month and barely touches reviews. Below are the four specific problems this software was built to fix.`,
    },
    'review-importance': {
      heading: (n) => `Why ${n.name} Need Review Software in the First Place`,
      lede: (n) =>
        `${n.reviewImportance} Software solves the asking problem at scale — you can't do this by hand and run a business at the same time.`,
    },
    'example-jobs': {
      heading: (n) => `Designed Around the Reality of ${n.possessive} Work`,
      lede: (n) =>
        `From the busy week of a ${n.singular.toLowerCase()} juggling a ${n.exampleJobs[0]} and a ${n.exampleJobs[1]} on the same day, to the slow weeks — the software pulls its weight in both.`,
    },
  },
  faqs: (n) => [
    {
      q: `What features does the software include for ${n.name.toLowerCase()}?`,
      a: `SMS review requests, an automatic follow-up nudge, sentiment-gated routing (so unhappy ${n.customerWord}s go to private feedback, not Google), a private feedback inbox, a stats dashboard showing requests sent and conversions, your existing Google reviews displayed in-app, and CSV bulk import. Nothing bolted on you'd never use.`,
    },
    {
      q: `Does it work on my phone?`,
      a: `Yes — that's the point. The whole interface is built to be used between ${n.jobWord}s on a phone. Add a ${n.customerWord} in under 15 seconds.`,
    },
    {
      q: `What's the difference between this and free Google review request links?`,
      a: `A static link doesn't get sent, doesn't filter unhappy ${n.customerWord}s out, and doesn't tell you who hasn't reviewed yet. The software does all three.`,
    },
    {
      q: `Can I cancel anytime?`,
      a: `Yes. Monthly rolling — cancel from the dashboard with one click. No retention calls, no contracts to wriggle out of.`,
    },
  ],
}

// ============================================================
// PATTERN 5 — Google Review Tool (practical tool description)
// ============================================================
const pattern5: PatternConfig = {
  slug: 'google-review-tool',
  pathPrefix: '/google-review-tool',
  name: 'Google Review Tool',
  shortName: 'Review Tool',
  indexTitle: 'The Google Review Tool — by Industry',
  indexDescription:
    'A simple tool to send review requests and keep your Google profile growing. Built for tradespeople and service businesses. Pick your industry to see it in context.',
  indexLede:
    'It\'s a tool. You add a customer, it sends them an SMS, the review lands on your Google profile. Pick your industry to see how it slots into your day.',
  title: (n) => `${n.singular} Google Review Tool | Grow Our Reviews`,
  metaDescription: (n) =>
    `A simple Google review tool for ${n.name.toLowerCase()}. Add a ${n.customerWord}, send a request, get a review. No CRM bloat — just the tool that does the one job. Try it free for 14 days.`,
  h1: (n) => `${n.singular} Google Review Tool`,
  heroEyebrow: 'One Tool. One Job.',
  heroSubtitle: (n) =>
    `The fastest way for a ${n.singular.toLowerCase()} to turn a finished ${n.jobWord} into a Google review. Add a name and number, hit send, get back to work.`,
  primaryCta: 'Use the Tool',
  secondaryCta: 'See it in action',
  finalCtaHeading: (n) =>
    `The simplest review tool a ${n.singular.toLowerCase()} can pick up.`,
  finalCtaBody: (n) =>
    `No training, no onboarding, no integrations to set up. Sign up, add your first ${n.customerWord}, hit send. The next review is on its way.`,
  sectionOrder: ['tool-features', 'example-jobs', 'pain-points', 'how-gor-works', 'pricing', 'faq', 'cta'],
  sections: {
    'tool-features': {
      heading: (n) => `What the Tool Does (And What It Doesn't)`,
      lede: (n) =>
        `This isn't a marketing platform. It isn't a CRM. It's a tool that does exactly one thing: get a ${n.customerWord} to leave a Google review after you've finished a ${n.jobWord}. Below is what's inside.`,
    },
    'example-jobs': {
      heading: (n) => `What Using the Tool Actually Looks Like for a ${n.singular}`,
      lede: (n) =>
        `Five real scenarios from a typical week — a ${n.exampleJobs[0]}, a ${n.exampleJobs[1]}, a follow-up on an older ${n.exampleJobs[2] || 'job'}. Same three taps every time.`,
    },
    'pain-points': {
      heading: (n) => `Why Most ${n.name} Don't Use a Review Tool — Yet`,
      lede: (n) =>
        `The tools have been around for years. So why have most ${n.businessType} owners never tried one? It usually comes down to the four objections below — all of which fall apart on closer look.`,
    },
    'how-gor-works': {
      heading: (n) => `The Tool, From Tap to Review`,
      lede: (n) =>
        `Step one: open the app. Step two: enter the ${n.customerWord}. Step three: send. The SMS goes out, the review form opens for them, and your Google profile gets one richer. That's the whole product.`,
    },
  },
  faqs: (n) => [
    {
      q: `How quickly can I send my first request?`,
      a: `Under five minutes from signup. Connect your Google profile, add your first ${n.customerWord}, hit send. You'll often see the review appear on your profile that same day.`,
    },
    {
      q: `Does the tool send by SMS or email?`,
      a: `SMS only. Email gets a fraction of the open rate and a much lower review conversion, so the tool is built around what actually works for a ${n.singular.toLowerCase()}: a single polite text message to a UK mobile.`,
    },
    {
      q: `What happens if a ${n.customerWord} doesn't reply?`,
      a: `The tool sends one polite reminder after 3 days. After that, no more — we don't believe in nagging your ${n.customerWord}s on your behalf.`,
    },
    {
      q: `Can I bulk import old ${n.customerWord}s?`,
      a: `Yes — upload a CSV, the tool deduplicates and validates phone numbers, and you can send a one-off request to everyone you've worked for in the last 6-12 months.`,
    },
  ],
}

// ============================================================
// PATTERN 6 — Grow With Google Reviews (business growth)
// ============================================================
const pattern6: PatternConfig = {
  slug: 'grow-with-google-reviews',
  pathPrefix: '/grow-with-google-reviews',
  name: 'Grow With Google Reviews',
  shortName: 'Grow Your Business',
  indexTitle: 'Grow Your Business With Google Reviews — by Industry',
  indexDescription:
    'How Google reviews translate into actual revenue, broken down by industry. Pick your trade to see the growth maths for your business model.',
  indexLede:
    'The link between reviews and revenue is not the same for every industry. For some, one review = one job. For others, it\'s a brand asset. Pick yours.',
  title: (n) => `How to Grow Your ${n.possessive} Business With Google Reviews | Grow Our Reviews`,
  metaDescription: (n) =>
    `How a ${n.businessType} grows through Google reviews. The revenue maths, the ranking effect, and the system to make it happen consistently. Free trial.`,
  h1: (n) => `How to Grow Your ${n.possessive} Business With Google Reviews`,
  heroEyebrow: 'Business Growth',
  heroSubtitle: (n) =>
    `Reviews aren't a marketing tactic — they're the cheapest growth lever a ${n.businessType} has. Each one earns local visibility, trust, and more enquiries, at a marginal cost of zero.`,
  primaryCta: 'Grow Your Business',
  secondaryCta: 'See the growth maths',
  finalCtaHeading: (n) =>
    `Compound growth, one review at a time.`,
  finalCtaBody: (n) =>
    `${n.averageJobValue} per ${n.jobWord} × the extra ${n.customerWord}s that find you through better rankings = the only marketing channel that pays back forever.`,
  sectionOrder: ['growth', 'review-importance', 'pain-points', 'how-gor-works', 'example-jobs', 'pricing', 'faq', 'cta'],
  sections: {
    growth: {
      heading: (n) => `The Growth Maths for a ${n.singular}`,
      lede: (n) =>
        `A ${n.businessType} bills somewhere in the range of ${n.averageJobValue} per ${n.jobWord}. Climb three positions in the local map pack and your weekly enquiry volume typically doubles. Below is how the maths compounds month after month.`,
    },
    'review-importance': {
      heading: (n) => `Why Reviews Are the Highest-ROI Marketing Lever for ${n.name}`,
      lede: (n) =>
        `Compare reviews to Google Ads, leaflets, vans, or Checkatrade fees and the maths is not close. ${n.reviewImportance} Reviews are owned, permanent, and compound — paid advertising is rented and stops working the day you stop paying.`,
    },
    'pain-points': {
      heading: (n) => `What's Holding Most ${n.name} Back From Growing`,
      lede: (n) =>
        `It's almost never the work. It's almost always one of the four bottlenecks below — and all of them sit upstream of reviews, which is why fixing reviews has such an outsized effect on growth.`,
    },
    'how-gor-works': {
      heading: (n) => `The Engine That Runs the Growth`,
      lede: (n) =>
        `The growth maths only works if the reviews actually keep coming. Grow Our Reviews automates the part of the loop that always breaks — the asking — so the input rate stays high without you needing to remember.`,
    },
    'example-jobs': {
      heading: (n) => `Growth Levers Across ${n.possessive} Work`,
      lede: (n) =>
        `Some types of ${n.jobWord} compound your growth harder than others — a ${n.exampleJobs[0]} reviewed by a neighbour brings the next three jobs on the same street.`,
    },
  },
  faqs: (n) => [
    {
      q: `How much extra revenue can a ${n.businessType} make from reviews?`,
      a: `A typical ${n.singular.toLowerCase()} climbing from outside the map pack into the top three sees enquiry volume roughly double. At ${n.averageJobValue} per ${n.jobWord}, the maths compounds fast — and unlike paid ads, it doesn't stop when you stop paying.`,
    },
    {
      q: `How long does it take to see growth?`,
      a: `Local ranking lift starts in 4-8 weeks of consistent review collection. The compounding effect — where reviews bring more ${n.customerWord}s who leave more reviews — kicks in around month 3-4.`,
    },
    {
      q: `What's the cheapest way to grow a ${n.businessType}?`,
      a: `Reviews. Per pound spent, nothing else comes close — and the asset you build is permanent, unlike ads or platform leads.`,
    },
    {
      q: `Should I still pay for ads or leaflets?`,
      a: `Sometimes — but only after your review profile is doing its job. Paid traffic to a 12-review profile converts terribly. Paid traffic to a 60-review profile flies.`,
    },
  ],
}

// ============================================================
// PATTERN 7 — Local SEO (SEO education)
// ============================================================
const pattern7: PatternConfig = {
  slug: 'local-seo',
  pathPrefix: '/local-seo',
  name: 'Local SEO',
  shortName: 'Local SEO Guide',
  indexTitle: 'Local SEO Guides by Industry',
  indexDescription:
    'A plain-English guide to local SEO, tailored to each industry. How the algorithm works, what really moves the needle, and the role reviews play.',
  indexLede:
    'Local SEO works the same way under the hood for every industry, but the practical playbook is different. Pick yours.',
  title: (n) => `Local SEO for ${n.name}: A Complete Guide | Grow Our Reviews`,
  metaDescription: (n) =>
    `A complete local SEO guide for ${n.name.toLowerCase()}. How Google's local algorithm works, what matters most, and how to outrank the competition. Free tools and trial.`,
  h1: (n) => `Local SEO for ${n.name}: A Complete Guide`,
  heroEyebrow: 'The Complete Guide',
  heroSubtitle: (n) =>
    `Everything a ${n.singular.toLowerCase()} needs to know about ranking in the Google Map Pack — the three-result block that gets most of the clicks for "${n.searchTerm}".`,
  primaryCta: 'Improve Your Local SEO',
  secondaryCta: 'Read the guide',
  finalCtaHeading: (n) =>
    `Better local SEO. More ${n.customerWord}s.`,
  finalCtaBody: (n) =>
    `Local SEO is mostly about doing the basics consistently. Reviews are the single highest-leverage basic. Start collecting them automatically and the algorithm does the rest.`,
  sectionOrder: ['local-seo', 'review-importance', 'pain-points', 'how-gor-works', 'example-jobs', 'pricing', 'faq', 'cta'],
  sections: {
    'local-seo': {
      heading: (n) => `How Google's Local Algorithm Treats ${n.name}`,
      lede: (n) =>
        `Google ranks local results on three pillars: relevance, distance, and prominence. Relevance and distance are mostly fixed — you are what you are, and you're where you're located. Prominence is what you can actually move, and for ${n.name.toLowerCase()} it's almost entirely driven by reviews.`,
    },
    'review-importance': {
      heading: (n) => `Reviews: The Prominence Lever for ${n.name}`,
      lede: (n) =>
        `Of the three local ranking pillars, prominence is the one you control. ${n.reviewImportance} Reviews are the loudest signal you can send Google about how prominent your business really is in your area.`,
    },
    'pain-points': {
      heading: (n) => `The Local SEO Mistakes Most ${n.name} Make`,
      lede: (n) =>
        `It's rarely the dramatic stuff — penalties, manual actions, hacks gone wrong. For most ${n.name.toLowerCase()} the SEO problem is just neglect, in four common shapes.`,
    },
    'how-gor-works': {
      heading: (n) => `The Lazy Person's SEO Plan for a ${n.singular}`,
      lede: (n) =>
        `You don't need to learn SEO. You need to do one thing — keep reviews coming in — and let the algorithm do the work. Grow Our Reviews automates that one thing so you can ignore SEO and still rank.`,
    },
    'example-jobs': {
      heading: (n) => `SEO Tactics for Different Types of ${n.possessive} Work`,
      lede: (n) =>
        `Local SEO for a ${n.exampleJobs[0]} business is slightly different to a ${n.exampleJobs[1]} business. The basics overlap — the keyword and category nuances don't.`,
    },
  },
  faqs: (n) => [
    {
      q: `What's the single biggest local SEO factor for ${n.name.toLowerCase()}?`,
      a: `Review count and recency, by some distance. Categories, NAP consistency, and on-page basics all matter — but they're table stakes. Reviews are what moves you up.`,
    },
    {
      q: `How do I rank in the Google Map Pack?`,
      a: `Have a complete Google Business Profile, pick the right primary category, get more recent reviews than the businesses currently in the top 3, and reply to a healthy share of them. That's it.`,
    },
    {
      q: `Do I need a website to rank locally?`,
      a: `A website helps with relevance signals but it's not a hard requirement — plenty of ${n.name.toLowerCase()} rank well in the map pack with a strong Google Business Profile alone. A website becomes critical for ranking in the organic blue links below the map.`,
    },
    {
      q: `How long does local SEO take to show results?`,
      a: `Two to twelve weeks for a typical ${n.businessType}, depending on competition. Reviews are the fastest-acting signal — you can see ranking lift within 4-8 weeks of consistent collection.`,
    },
  ],
}

// ============================================================
// PATTERN 8 — Get More Customers (customer acquisition)
// ============================================================
const pattern8: PatternConfig = {
  slug: 'get-more-customers',
  pathPrefix: '/get-more-customers',
  name: 'Get More Customers',
  shortName: 'Get More Customers',
  indexTitle: 'Get More Customers by Industry',
  indexDescription:
    'The customer acquisition playbook for each industry. Where new customers actually come from, what really moves the needle, and how to do more of it.',
  indexLede:
    'Most "get more customers" advice is generic to the point of useless. The playbook for a service-led business is different to a high-street one — and different again for a property business. Pick yours.',
  title: (n) => `How to Get More ${n.customerWord === 'patient' ? 'Patients' : n.customerWord === 'client' ? 'Clients' : 'Customers'} as a ${n.singular} | Grow Our Reviews`,
  metaDescription: (n) =>
    `How a ${n.singular.toLowerCase()} actually gets more ${n.customerWord}s. The channels that work, the ones that don't, and where reviews fit. Free trial.`,
  h1: (n) => `How to Get More ${n.customerWord === 'patient' ? 'Patients' : n.customerWord === 'client' ? 'Clients' : 'Customers'} as a ${n.singular}`,
  heroEyebrow: 'Customer Acquisition',
  heroSubtitle: (n) =>
    `Forget the marketing hype. For most ${n.businessType} owners, more ${n.customerWord}s comes from doing one thing well: showing up at the top of Google when someone searches for "${n.searchTerm}". Here's how.`,
  primaryCta: 'Get More Customers',
  secondaryCta: 'See the playbook',
  finalCtaHeading: (n) =>
    `Your next ${n.customerWord} is already searching.`,
  finalCtaBody: (n) =>
    `They typed "${n.searchTerm}" five minutes ago. The question is whether your ${n.businessType} shows up in the top three or the third page. Reviews decide which.`,
  sectionOrder: ['customer-acquisition', 'review-importance', 'pain-points', 'how-gor-works', 'example-jobs', 'pricing', 'faq', 'cta'],
  sections: {
    'customer-acquisition': {
      heading: (n) => `Where ${n.singular} ${n.customerWord === 'patient' ? 'Patients' : n.customerWord === 'client' ? 'Clients' : 'Customers'} Actually Come From`,
      lede: (n) =>
        `Most ${n.businessType} owners overestimate social media and underestimate Google. The honest breakdown for a typical ${n.singular.toLowerCase()}: roughly 60% of new ${n.customerWord}s come from local Google search, 20% from word of mouth, 10% from directories like ${n.competitorPlatforms[0] || 'industry sites'}, and the remaining 10% is everything else combined.`,
    },
    'review-importance': {
      heading: (n) => `Why Google Reviews Bring You ${n.customerWord === 'patient' ? 'Patients' : 'Customers'}`,
      lede: (n) =>
        `60% of your ${n.customerWord}s come from Google search. ${n.reviewImportance} Reviews are the bridge between someone typing your search term and someone calling your number — the higher you rank and the more reviews you have, the wider that bridge gets.`,
    },
    'pain-points': {
      heading: (n) => `Why You're Not Getting Enough Calls`,
      lede: (n) =>
        `It's almost never because you're bad at the work. It's one of these four reasons — and they're all fixable.`,
    },
    'how-gor-works': {
      heading: (n) => `The Acquisition Engine Behind the Calls`,
      lede: (n) =>
        `Customer acquisition for a ${n.businessType} is mostly a review collection problem in disguise. Fix the collection and the calls follow. Grow Our Reviews handles the collection automatically, so the acquisition takes care of itself.`,
    },
    'example-jobs': {
      heading: (n) => `Examples — From Search to ${n.customerWord === 'patient' ? 'Patient' : n.customerWord === 'client' ? 'Client' : 'Customer'}`,
      lede: (n) =>
        `Three real journeys. A homeowner searching for a ${n.exampleJobs[0]}, someone urgently needing a ${n.exampleJobs[1]}, a referral checking your profile before they call. Each one is a ${n.customerWord} won or lost on what they see.`,
    },
  },
  faqs: (n) => [
    {
      q: `What's the fastest way to get more ${n.customerWord}s as a ${n.singular.toLowerCase()}?`,
      a: `Improve your Google ranking. Reviews are the fastest lever — typical lift in 4-8 weeks of consistent collection. Paid ads are faster but don't compound, so the moment you stop paying, the ${n.customerWord}s stop.`,
    },
    {
      q: `Should I advertise on Google or build organic ranking?`,
      a: `Both, in that order. Organic ranking via reviews is the long-term asset. Paid ads make sense once your profile converts — they don't make sense to a profile with 12 reviews.`,
    },
    {
      q: `Do directories like Checkatrade still work?`,
      a: `For ${n.name.toLowerCase()} they can — but the ROI rarely beats Google. A pound spent on review collection compounds for years. A pound spent on ${n.competitorPlatforms[0] || 'a directory'} stops working the moment you stop paying.`,
    },
    {
      q: `How many extra ${n.customerWord}s can I expect from better reviews?`,
      a: `A typical ${n.businessType} moving into the top three local results sees enquiry volume roughly double. From there it compounds — more ${n.customerWord}s mean more potential reviewers, which means even better ranking.`,
    },
  ],
}

// ============================================================
// Pattern category for shared pricing/FAQ heading helpers
// ============================================================
function patternHeadingCategory(slug: string) {
  if (slug === 'automated-google-reviews') return 'product'
  if (slug === 'google-review-management') return 'management'
  if (slug === 'get-more-google-reviews') return 'howto'
  if (slug === 'review-software') return 'software'
  if (slug === 'google-review-tool') return 'tool'
  if (slug === 'grow-with-google-reviews') return 'growth'
  if (slug === 'local-seo') return 'seo'
  return 'customers'
}

export function pricingHeadingFor(pattern: PatternConfig, niche: Niche): string {
  const cat = patternHeadingCategory(pattern.slug)
  return pricingHeadings[cat](niche)
}

export function faqHeadingFor(pattern: PatternConfig): string {
  const cat = patternHeadingCategory(pattern.slug)
  return faqHeadings[cat]
}

export const patterns: PatternConfig[] = [pattern1, pattern2, pattern3, pattern4, pattern5, pattern6, pattern7, pattern8]

export const patternsBySlug: Record<string, PatternConfig> = Object.fromEntries(
  patterns.map((p) => [p.slug, p])
)

export function getPatternBySlug(slug: string): PatternConfig | undefined {
  return patternsBySlug[slug]
}
