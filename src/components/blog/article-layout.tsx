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
              <div className="prose prose-xl prose-blue max-w-none
                prose-headings:font-bold prose-headings:text-gray-900 prose-headings:tracking-tight
                prose-h2:text-3xl prose-h2:mt-16 prose-h2:mb-8 prose-h2:pb-4 prose-h2:border-b-2 prose-h2:border-gray-200
                prose-h3:text-xl prose-h3:mt-12 prose-h3:mb-6 prose-h3:font-semibold
                prose-p:text-gray-700 prose-p:text-lg prose-p:leading-relaxed prose-p:mb-8 prose-p:mt-4
                prose-ul:my-8 prose-ul:space-y-4 prose-li:text-gray-700 prose-li:text-lg prose-li:leading-relaxed prose-li:mb-2
                prose-ol:my-8 prose-ol:space-y-4 prose-ol:text-gray-700 prose-ol:text-lg prose-ol:leading-relaxed
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-a:text-blue-600 prose-a:no-underline hover:prose-a:text-blue-800 hover:prose-a:underline prose-a:font-medium
                prose-code:text-gray-800 prose-code:bg-gray-100 prose-code:px-2 prose-code:py-1 prose-code:rounded prose-code:font-medium
                prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-blue-50 prose-blockquote:py-6 prose-blockquote:px-8 prose-blockquote:my-10 prose-blockquote:rounded-r-lg prose-blockquote:italic prose-blockquote:text-lg
                [&>div.bg-blue-50]:my-10 [&>div.bg-blue-50]:p-8 [&>div.bg-blue-50]:rounded-xl [&>div.bg-blue-50]:border [&>div.bg-blue-50]:border-blue-200 [&>div.bg-blue-50]:shadow-sm
                [&>div.bg-blue-50>h3]:text-blue-900 [&>div.bg-blue-50>h3]:font-bold [&>div.bg-blue-50>h3]:mb-4 [&>div.bg-blue-50>h3]:mt-0 [&>div.bg-blue-50>h3]:text-xl
                [&>div.bg-blue-50>ul]:text-blue-800 [&>div.bg-blue-50>ul]:space-y-3 [&>div.bg-blue-50>ul]:mb-0 [&>div.bg-blue-50>ul]:text-lg
                [&>*]:max-w-none
              ">
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