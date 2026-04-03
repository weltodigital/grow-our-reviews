import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Calendar, Tag } from "lucide-react";
import { NavBubble } from '@/components/navigation/NavBubble';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

export const metadata: Metadata = {
  title: "Blog — Grow Our Reviews",
  description: "Practical guides on Google reviews, local SEO, and getting more work for tradespeople. Learn how to grow your online reputation and win more local customers.",
  keywords: "google reviews, local SEO, tradespeople guides, online reputation, customer reviews",
  robots: {
    index: true,
    follow: true,
  },
};

// Blog article data - in a real app this would come from a CMS or database
const blogArticles = [
  {
    slug: "checkatrade-mybuilder-google-reviews-2026",
    title: "Checkatrade, MyBuilder, or Google Reviews: Where Should Tradespeople Focus in 2026?",
    description: "Comparing Checkatrade, MyBuilder, and Google Reviews for UK tradespeople in 2026. Which platform gives you the best return on your time and money?",
    category: "Getting More Work",
    publishDate: "2026-03-16",
    readingTime: 10,
    featured: true,
  },
  {
    slug: "why-competitor-gets-more-work-than-you",
    title: "Why Your Competitor With Worse Work Gets More Jobs Than You",
    description: "You do better work but your competitor gets more calls. Here's why — and exactly what to do about it.",
    category: "Getting More Work",
    publishDate: "2026-02-15",
    readingTime: 8,
    featured: true,
  },
  {
    slug: "best-time-to-ask-for-google-review",
    title: "The Best Time to Ask a Customer for a Google Review (And Exactly What to Say)",
    description: "Timing is everything when asking for a Google review. Here's when to ask, what to say, and how to automate it.",
    category: "Google Reviews",
    publishDate: "2026-02-10",
    readingTime: 8,
    featured: false,
  },
  {
    slug: "how-google-local-search-works-tradesmen",
    title: "How Google Decides Which Tradespeople to Show in Local Search Results",
    description: "Google uses three main factors to decide which tradespeople appear in local search. Here's how it works in plain English.",
    category: "Local SEO",
    publishDate: "2026-02-05",
    readingTime: 9,
    featured: false,
  },
  {
    slug: "how-many-google-reviews-to-rank-locally",
    title: "How Many Google Reviews Does a Tradesperson Need to Rank in the Map Pack?",
    description: "Most tradespeople in the Google Map Pack have 40-80 reviews. Find out how many you actually need to rank locally.",
    category: "Local SEO",
    publishDate: "2026-01-30",
    readingTime: 8,
    featured: false,
  },
  {
    slug: "google-business-profile-setup-tradesmen",
    title: "How to Set Up a Google Business Profile for Your Trade Business (Step-by-Step)",
    description: "A complete step-by-step guide to setting up your Google Business Profile as a tradesperson.",
    category: "Local SEO",
    publishDate: "2026-01-25",
    readingTime: 10,
    featured: false,
  },
  {
    slug: "google-review-response-templates-tradesmen",
    title: "How to Respond to Every Type of Google Review (With Copy-Paste Templates)",
    description: "Ready-to-use Google review response templates for tradespeople. Copy, paste, and personalise responses for 5-star reviews, complaints, and more.",
    category: "Reputation Management",
    publishDate: "2026-01-20",
    readingTime: 9,
    featured: false,
  },
  {
    slug: "google-reviews-vs-checkatrade",
    title: "Google Reviews vs Checkatrade: Which Actually Gets Tradespeople More Work?",
    description: "Tradespeople spend £50-100/month on Checkatrade. But do Google reviews get you more work for free? We compare the two to help you decide.",
    category: "Getting More Work",
    publishDate: "2026-01-15",
    readingTime: 9,
    featured: false,
  },
  {
    slug: "unfair-google-review-tradesman-guide",
    title: "What to Do When You Get an Unfair Google Review (A Tradesperson's Guide)",
    description: "Got an unfair or fake Google review? Here's exactly what to do — from responding professionally to reporting it to Google, with copy-paste templates.",
    category: "Reputation Management",
    publishDate: "2026-01-10",
    readingTime: 10,
    featured: false,
  },
];

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

function getCategoryColor(category: string) {
  const colors = {
    "Getting More Work": "bg-green-100 text-green-800",
    "Google Reviews": "bg-blue-100 text-blue-800",
    "Local SEO": "bg-purple-100 text-purple-800",
    "Reputation Management": "bg-orange-100 text-orange-800",
    "Case Studies": "bg-indigo-100 text-indigo-800",
  };
  return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
}

export default function BlogPage() {
  const featuredArticles = blogArticles.filter(article => article.featured);
  const regularArticles = blogArticles.filter(article => !article.featured);

  return (
    <div className="min-h-screen bg-white">
      <NavBubble />

      {/* Blog Content */}
      <main>
        {/* Hero Section */}
        <section className="section" style={{ backgroundColor: 'var(--bg-primary)' }}>
          <div className="container mx-auto px-4">
            <div className="section-header">
              <h1>Blog</h1>
              <p className="page-subtitle mx-auto">
                Practical guides on Google reviews, local SEO, and getting more work for tradespeople.
                Learn how to grow your online reputation and win more local customers.
              </p>
            </div>
          </div>
        </section>

        {/* Articles Section */}
        <section className="section" style={{ backgroundColor: 'var(--bg-secondary)' }}>
          <div className="container mx-auto px-4">
            {/* Featured Articles */}
            {featuredArticles.length > 0 && (
              <div className="mb-16">
                <h2 className="mb-8">Featured Articles</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {featuredArticles.map((article) => (
                <article key={article.slug} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--accent), var(--accent-hover))' }}>
                    <div className="text-center" style={{ color: 'var(--accent-text)' }}>
                      <Tag className="mx-auto mb-3 h-12 w-12" />
                      <div className="text-sm font-medium">{article.category}</div>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                        {article.category}
                      </span>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          {formatDate(article.publishDate)}
                        </div>
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-1" />
                          {article.readingTime} min
                        </div>
                      </div>
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                      <Link href={`/blog/${article.slug}`} className="hover:underline" style={{ color: 'inherit' }}
                        onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
                        onMouseOut={(e) => { e.currentTarget.style.color = 'inherit' }}>
                        {article.title}
                      </Link>
                    </h3>
                    <p className="text-gray-600 leading-relaxed">
                      {article.description}
                    </p>
                  </div>
                </article>
              ))}
            </div>
            </div>
          )}

            {/* All Articles */}
            <div>
              <h2 className="mb-8">All Articles</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularArticles.map((article) => (
              <article key={article.slug} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-32 flex items-center justify-center" style={{ background: 'linear-gradient(to bottom right, var(--text-tertiary), var(--text-secondary))' }}>
                  <div className="text-center" style={{ color: 'var(--bg-primary)' }}>
                    <Tag className="mx-auto mb-2 h-8 w-8" />
                    <div className="text-xs font-medium">{article.category}</div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between text-sm text-gray-500 mb-3">
                    <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(article.category)}`}>
                      {article.category}
                    </span>
                    <div className="flex items-center space-x-2 text-xs">
                      <div className="flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {formatDate(article.publishDate)}
                      </div>
                      <div className="flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {article.readingTime}m
                      </div>
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    <Link href={`/blog/${article.slug}`} className="hover:underline" style={{ color: 'inherit' }}
                      onMouseOver={(e) => { e.currentTarget.style.color = 'var(--accent)' }}
                      onMouseOut={(e) => { e.currentTarget.style.color = 'inherit' }}>
                      {article.title}
                    </Link>
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {article.description}
                  </p>
                </div>
              </article>
            ))}
            </div>
            </div>
          </div>
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}