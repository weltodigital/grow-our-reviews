'use client';

import { ReactNode, useState, useEffect } from "react";
import Link from "next/link";
import { Calendar, Clock, Tag, ChevronRight, Home, Menu, X, Copy, Check } from "lucide-react";
import { BlogCTABanner } from "./blog-cta-banner";
import { MarketingHeader } from '@/components/marketing/marketing-header';
import { MarketingFooter } from '@/components/marketing/marketing-footer';

interface ArticleLayoutProps {
  title: string;
  description: string;
  category: string;
  publishDate: string;
  readingTime: number;
  children: ReactNode;
  relatedArticles?: {
    slug: string;
    title: string;
    category: string;
  }[];
}

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

function TableOfContents({ headings }: { headings: { id: string; text: string; level: number }[] }) {
  const [activeId, setActiveId] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      {
        rootMargin: "-20% 0% -70% 0%",
      }
    );

    headings.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) {
        observer.observe(element);
      }
    });

    return () => {
      headings.forEach(({ id }) => {
        const element = document.getElementById(id);
        if (element) {
          observer.unobserve(element);
        }
      });
    };
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <>
      {/* Mobile TOC */}
      <div className="lg:hidden mb-8">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between w-full bg-gray-50 border rounded-lg px-4 py-3 text-sm font-medium text-gray-900"
        >
          <span>Table of Contents</span>
          <Menu className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        </button>
        {isOpen && (
          <div className="mt-2 bg-white border rounded-lg p-4">
            <nav className="space-y-2">
              {headings.map(({ id, text }) => (
                <Link
                  key={id}
                  href={`#${id}`}
                  onClick={() => setIsOpen(false)}
                  className={`block text-sm hover:text-blue-600 ${
                    activeId === id ? 'text-blue-600 font-medium' : 'text-gray-600'
                  }`}
                >
                  {text}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </div>

      {/* Desktop TOC */}
      <div className="hidden lg:block">
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <h3 className="font-bold text-gray-900 mb-5 text-lg">Table of Contents</h3>
          <nav className="space-y-3">
            {headings.map(({ id, text, level }) => (
              <Link
                key={id}
                href={`#${id}`}
                className={`block text-sm leading-relaxed hover:text-blue-600 transition-all duration-200 py-1 ${
                  level === 3 ? 'pl-4 text-gray-500' : ''
                } ${
                  activeId === id
                    ? 'text-blue-600 font-semibold border-l-3 border-blue-600 pl-3 -ml-3 bg-blue-50 py-2 rounded-r'
                    : 'text-gray-700 hover:pl-1'
                }`}
              >
                {text}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </>
  );
}

function ShareButtons({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  const shareUrls = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
    twitter: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
  };

  return (
    <div className="flex items-center space-x-4 py-6 border-t border-b border-gray-200">
      <span className="text-sm font-medium text-gray-700">Share this article:</span>
      <div className="flex space-x-2">
        <button
          onClick={handleCopyLink}
          className="flex items-center px-3 py-2 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
        <a
          href={shareUrls.facebook}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
        >
          Facebook
        </a>
        <a
          href={shareUrls.twitter}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 text-xs bg-gray-900 hover:bg-black text-white rounded-md transition-colors"
        >
          X/Twitter
        </a>
        <a
          href={shareUrls.linkedin}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-2 text-xs bg-blue-700 hover:bg-blue-800 text-white rounded-md transition-colors"
        >
          LinkedIn
        </a>
      </div>
    </div>
  );
}

export function ArticleLayout({
  title,
  description,
  category,
  publishDate,
  readingTime,
  children,
  relatedArticles = [],
}: ArticleLayoutProps) {
  const [headings, setHeadings] = useState<{ id: string; text: string; level: number }[]>([]);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';

  useEffect(() => {
    // Extract headings from the article content
    const headingElements = document.querySelectorAll('h2[id], h3[id]');
    const headingList = Array.from(headingElements).map((heading) => ({
      id: heading.id,
      text: heading.textContent || '',
      level: parseInt(heading.tagName.substring(1)),
    }));
    setHeadings(headingList);
  }, [children]);

  return (
    <div className="min-h-screen bg-white">
      <MarketingHeader />

      <main className="container mx-auto px-4 py-12">
        {/* Breadcrumb */}
        <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-8 max-w-4xl mx-auto">
          <Link href="/" className="hover:text-gray-900 flex items-center">
            <Home className="h-4 w-4" />
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href="/blog" className="hover:text-gray-900">Blog</Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-gray-900 truncate">{title}</span>
        </nav>

        <div className="max-w-7xl mx-auto">
          <div className="lg:grid lg:grid-cols-12 lg:gap-16">
            {/* Article Content */}
            <article className="lg:col-span-8">
              {/* Article Header */}
              <header className="mb-12 pb-8 border-b border-gray-100">
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-6">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                    {category}
                  </span>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(publishDate)}
                  </div>
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {readingTime} min read
                  </div>
                </div>
                <h1 className="text-4xl lg:text-5xl font-bold text-gray-900 leading-tight mb-6 tracking-tight">
                  {title}
                </h1>
                <p className="text-xl lg:text-2xl text-gray-600 leading-relaxed font-light mb-6">
                  {description}
                </p>
                <div className="flex items-center text-sm text-gray-600">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium mr-3">
                    E
                  </div>
                  By <span className="font-medium text-gray-900 ml-1">Ed at Grow Our Reviews</span>
                </div>
              </header>

              {/* Article Content */}
              <div
                className="prose prose-xl prose-blue max-w-none article-content"
                style={{
                  '--tw-gradient-from': '#111827',
                  '--tw-gradient-to': '#1e40af',
                }}
              >
                <style jsx>{`
                  .article-content > h2 {
                    font-size: 2.25rem !important;
                    font-weight: 900 !important;
                    margin-top: 5rem !important;
                    margin-bottom: 2.5rem !important;
                    padding-bottom: 1.5rem !important;
                    border-bottom: 4px solid #2563eb !important;
                    background: linear-gradient(to right, #111827, #1e40af) !important;
                    background-clip: text !important;
                    -webkit-background-clip: text !important;
                    color: transparent !important;
                    line-height: 1.1 !important;
                    letter-spacing: -0.025em !important;
                  }

                  .article-content > h3 {
                    font-size: 1.5rem !important;
                    font-weight: 700 !important;
                    color: #1e3a8a !important;
                    margin-top: 4rem !important;
                    margin-bottom: 2rem !important;
                    position: relative !important;
                    padding-left: 1.5rem !important;
                  }

                  .article-content > h3::before {
                    content: '' !important;
                    position: absolute !important;
                    left: 0 !important;
                    top: 0.25rem !important;
                    width: 0.25rem !important;
                    height: 2rem !important;
                    background-color: #2563eb !important;
                    border-radius: 9999px !important;
                  }

                  .article-content > p {
                    color: #374151 !important;
                    font-size: 1.125rem !important;
                    line-height: 1.625 !important;
                    margin-bottom: 2.5rem !important;
                    margin-top: 1.5rem !important;
                  }

                  .article-content > ul,
                  .article-content > ol {
                    margin-top: 2.5rem !important;
                    margin-bottom: 2.5rem !important;
                  }

                  .article-content > ul > li,
                  .article-content > ol > li {
                    color: #374151 !important;
                    font-size: 1.125rem !important;
                    line-height: 1.625 !important;
                    margin-bottom: 1rem !important;
                  }

                  @media (min-width: 1024px) {
                    .article-content > h2 {
                      font-size: 3rem !important;
                    }

                    .article-content > h3 {
                      font-size: 1.875rem !important;
                    }
                  }
                `}</style>
                {children}
              </div>

              {/* Share Buttons */}
              <ShareButtons title={title} url={currentUrl} />

              {/* CTA Banner */}
              <BlogCTABanner />

              {/* Related Articles */}
              {relatedArticles.length > 0 && (
                <section className="mt-12 pt-8 border-t border-gray-200">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6">Related Articles</h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {relatedArticles.slice(0, 3).map((article) => (
                      <div key={article.slug} className="bg-gray-50 rounded-lg p-6 hover:bg-gray-100 transition-colors">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium mb-3 ${getCategoryColor(article.category)}`}>
                          {article.category}
                        </span>
                        <h4 className="text-lg font-semibold text-gray-900 mb-2">
                          <Link href={`/blog/${article.slug}`} className="hover:text-blue-600">
                            {article.title}
                          </Link>
                        </h4>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </article>

            {/* Sidebar */}
            <aside className="lg:col-span-4">
              <div className="sticky top-8">
                <TableOfContents headings={headings} />
              </div>
            </aside>
          </div>
        </div>
      </main>

      <MarketingFooter />
    </div>
  );
}