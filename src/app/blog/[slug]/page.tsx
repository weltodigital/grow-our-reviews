import { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArticleLayout } from "@/components/blog/article-layout";

// This would normally come from a CMS or database
const articles = {
  "why-competitor-gets-more-work-than-you": {
    title: "Why Your Competitor With Worse Work Gets More Jobs Than You",
    description: "You do better work but your competitor gets more calls. Here's why — and exactly what to do about it. The answer isn't working harder, it's working smarter on your online presence.",
    category: "Getting More Work",
    publishDate: "2025-01-15",
    readingTime: 8,
    content: () => import("@/content/blog/why-competitor-gets-more-work-than-you").then(m => m.default),
  },
  "best-time-to-ask-for-google-review": {
    title: "The Best Time to Ask a Customer for a Google Review (And Exactly What to Say)",
    description: "Timing is everything when asking for a Google review. Here's when to ask, what to say (with word-for-word scripts), and how to automate the whole process.",
    category: "Google Reviews",
    publishDate: "2025-01-12",
    readingTime: 8,
    content: () => import("@/content/blog/best-time-to-ask-for-google-review").then(m => m.default),
  },
  "how-google-local-search-works-tradesmen": {
    title: "How Google Decides Which Tradespeople to Show in Local Search Results",
    description: "Google uses three main factors to decide which tradespeople appear in local search results. Here's how the algorithm works in plain English — and how to use it to get more calls.",
    category: "Local SEO",
    publishDate: "2025-01-10",
    readingTime: 9,
    content: () => import("@/content/blog/how-google-local-search-works-tradesmen").then(m => m.default),
  },
  "how-many-google-reviews-to-rank-locally": {
    title: "How Many Google Reviews Does a Tradesperson Need to Rank in the Map Pack?",
    description: "Most tradespeople in the Google Map Pack have 40-80 reviews. Find out how many Google reviews you actually need to rank in local search results and start getting more calls.",
    category: "Local SEO",
    publishDate: "2025-01-08",
    readingTime: 8,
    content: () => import("@/content/blog/how-many-google-reviews-to-rank-locally").then(m => m.default),
  },
  "google-business-profile-setup-tradesmen": {
    title: "How to Set Up a Google Business Profile for Your Trade Business (Step-by-Step)",
    description: "A complete step-by-step guide to setting up your Google Business Profile as a tradesperson. Get found on Google Maps, show up in local search, and start collecting reviews.",
    category: "Local SEO",
    publishDate: "2025-01-05",
    readingTime: 10,
    content: () => import("@/content/blog/google-business-profile-setup-tradesmen").then(m => m.default),
  },
};

type ArticleParams = {
  slug: string;
};

export async function generateMetadata({ params }: { params: ArticleParams }): Promise<Metadata> {
  const article = articles[params.slug as keyof typeof articles];

  if (!article) {
    return {
      title: "Article Not Found",
      description: "The article you're looking for doesn't exist.",
    };
  }

  const url = `https://growourreviews.com/blog/${params.slug}`;

  return {
    title: `${article.title} | Grow Our Reviews`,
    description: article.description,
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: article.title,
      description: article.description,
      type: "article",
      url,
      siteName: "Grow Our Reviews",
      locale: "en_GB",
      publishedTime: article.publishDate,
    },
    twitter: {
      card: "summary_large_image",
      title: article.title,
      description: article.description,
    },
  };
}

export async function generateStaticParams() {
  return Object.keys(articles).map((slug) => ({
    slug,
  }));
}

export default async function BlogArticlePage({ params }: { params: ArticleParams }) {
  const article = articles[params.slug as keyof typeof articles];

  if (!article) {
    notFound();
  }

  const ArticleContent = await article.content();

  // Get related articles (simple logic - same category, exclude current)
  const relatedArticles = Object.entries(articles)
    .filter(([slug, data]) => slug !== params.slug && data.category === article.category)
    .slice(0, 3)
    .map(([slug, data]) => ({
      slug,
      title: data.title,
      category: data.category,
    }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            // Article structured data
            {
              "@context": "https://schema.org",
              "@type": "Article",
              headline: article.title,
              description: article.description,
              author: {
                "@type": "Person",
                name: "Ed",
                url: "https://growourreviews.com"
              },
              publisher: {
                "@type": "Organization",
                name: "Grow Our Reviews",
                url: "https://growourreviews.com"
              },
              datePublished: article.publishDate,
              dateModified: article.publishDate,
              mainEntityOfPage: {
                "@type": "WebPage",
                "@id": `https://growourreviews.com/blog/${params.slug}`
              }
            },
            // Breadcrumb structured data
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://growourreviews.com"
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Blog",
                  item: "https://growourreviews.com/blog"
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: article.title,
                  item: `https://growourreviews.com/blog/${params.slug}`
                }
              ]
            }
          ])
        }}
      />

      <ArticleLayout
        title={article.title}
        description={article.description}
        category={article.category}
        publishDate={article.publishDate}
        readingTime={article.readingTime}
        relatedArticles={relatedArticles}
      >
        <ArticleContent />
      </ArticleLayout>
    </>
  );
}