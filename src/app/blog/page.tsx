import type { Metadata } from "next";
import Link from "next/link";
import { Clock, Calendar, Tag } from "lucide-react";
import { MarketingHeader } from '@/components/marketing/marketing-header';
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
    featured: true,
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
      <MarketingHeader />

      {/* Blog Content */}
      <main>
        {/* Hero Section */}
        <section className="relative bg-gradient-to-br from-blue-50 to-indigo-100 py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <div className="text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
                Blog
              </h1>
              <p className="text-lg leading-8 text-gray-600 max-w-3xl mx-auto">
                Practical guides on Google reviews, local SEO, and getting more work for tradespeople.
                Learn how to grow your online reputation and win more local customers.
              </p>
            </div>
          </div>
        </section>

        {/* Articles Section */}
        <section className="container mx-auto px-4 py-16">
          {/* Featured Articles */}
          {featuredArticles.length > 0 && (
            <div className="mb-16">
              <h2 className="text-2xl font-bold text-gray-900 mb-8">Featured Articles</h2>
            <div className="grid gap-8 md:grid-cols-2">
              {featuredArticles.map((article) => (
                <article key={article.slug} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="h-48 bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <div className="text-center text-white">
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
                      <Link href={`/blog/${article.slug}`} className="hover:text-blue-600">
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
            <h2 className="text-2xl font-bold text-gray-900 mb-8">All Articles</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {regularArticles.map((article) => (
              <article key={article.slug} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="h-32 bg-gradient-to-br from-gray-400 to-gray-600 flex items-center justify-center">
                  <div className="text-center text-white">
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
                    <Link href={`/blog/${article.slug}`} className="hover:text-blue-600">
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
        </section>
      </main>

      <MarketingFooter />
    </div>
  );
}