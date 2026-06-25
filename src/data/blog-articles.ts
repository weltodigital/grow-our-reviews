import { IndustryKey } from './niches'
import { PatternConfig } from './pseo-patterns'

export interface BlogArticleRef {
  slug: string
  title: string
  category:
    | 'Getting More Work'
    | 'Google Reviews'
    | 'Local SEO'
    | 'Reputation Management'
    | 'Case Studies'
}

// Mirrors the article registry in src/app/blog/[slug]/page.tsx.
// Kept here to avoid pulling the heavy MDX components into PSEO pages.
export const blogArticles: BlogArticleRef[] = [
  {
    slug: 'cannon-steels-case-study',
    title: 'How Cannon Steels Got More Google Reviews in Two Months Than They Had in Years',
    category: 'Case Studies',
  },
  {
    slug: 'checkatrade-mybuilder-google-reviews-2026',
    title: 'Checkatrade, MyBuilder, or Google Reviews: Where Should Tradespeople Focus in 2026?',
    category: 'Getting More Work',
  },
  {
    slug: 'why-competitor-gets-more-work-than-you',
    title: 'Why Your Competitor With Worse Work Gets More Jobs Than You',
    category: 'Getting More Work',
  },
  {
    slug: 'best-time-to-ask-for-google-review',
    title: 'The Best Time to Ask a Customer for a Google Review',
    category: 'Google Reviews',
  },
  {
    slug: 'how-google-local-search-works-tradesmen',
    title: 'How Google Decides Which Tradespeople to Show in Local Search Results',
    category: 'Local SEO',
  },
  {
    slug: 'how-many-google-reviews-to-rank-locally',
    title: 'How Many Google Reviews Does a Tradesperson Need to Rank in the Map Pack?',
    category: 'Local SEO',
  },
  {
    slug: 'google-business-profile-setup-tradesmen',
    title: 'How to Set Up a Google Business Profile for Your Trade Business',
    category: 'Local SEO',
  },
  {
    slug: 'google-review-response-templates-tradesmen',
    title: 'How to Respond to Every Type of Google Review (With Copy-Paste Templates)',
    category: 'Reputation Management',
  },
  {
    slug: 'google-reviews-vs-checkatrade',
    title: 'Google Reviews vs Checkatrade: Which Actually Gets Tradespeople More Work?',
    category: 'Getting More Work',
  },
  {
    slug: 'unfair-google-review-tradesman-guide',
    title: 'What to Do When You Get an Unfair Google Review',
    category: 'Reputation Management',
  },
]

// Map each pattern to the article categories most relevant to its angle.
const patternCategoryPriority: Record<string, BlogArticleRef['category'][]> = {
  'automated-google-reviews': ['Google Reviews', 'Getting More Work'],
  'google-review-management': ['Reputation Management', 'Google Reviews'],
  'get-more-google-reviews': ['Google Reviews', 'Getting More Work'],
  'review-software': ['Google Reviews', 'Local SEO'],
  'google-review-tool': ['Google Reviews', 'Getting More Work'],
  'grow-with-google-reviews': ['Getting More Work', 'Local SEO'],
  'local-seo': ['Local SEO', 'Google Reviews'],
  'get-more-customers': ['Getting More Work', 'Local SEO'],
}

// Stable per-niche article picks. Uses a simple hash to vary which 3 articles
// surface across niches so we don't link the same 3 articles from every page —
// that helps internal linking spread evenly without going random per request.
function nicheHash(slug: string): number {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return h
}

export function relatedArticlesFor(
  pattern: PatternConfig,
  nicheSlug: string,
  industry: IndustryKey,
  limit = 3,
): BlogArticleRef[] {
  const priorities = patternCategoryPriority[pattern.slug] ?? ['Google Reviews']
  // Sort: prefer articles in priority categories first, then everything else.
  const priority = blogArticles.filter((a) => priorities.includes(a.category))
  const rest = blogArticles.filter((a) => !priorities.includes(a.category))
  const ordered = [...priority, ...rest]

  // Rotate the starting index by niche hash so adjacent niches don't share
  // identical article lists.
  const start = nicheHash(nicheSlug + industry) % ordered.length
  const picked: BlogArticleRef[] = []
  for (let i = 0; i < ordered.length && picked.length < limit; i++) {
    picked.push(ordered[(start + i) % ordered.length])
  }
  return picked
}
