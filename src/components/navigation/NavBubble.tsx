'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Menu, X } from 'lucide-react'

export function NavBubble() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      <header className="nav-wrapper">
        <nav className="nav-bubble">
          <Link href="/" className="nav-logo">
            <Image
              src="/grow-our-reviews-logo.png"
              alt="Grow Our Reviews"
              width={640}
              height={128}
              className="h-16 w-auto"
              priority
            />
          </Link>

          <div className="nav-links">
            <Link href="/#how-it-works">How It Works</Link>
            <Link href="/#features">Features</Link>
            <Link href="/pricing">Pricing</Link>
            <Link href="/blog">Blog</Link>
            <Link href="/#faq">FAQ</Link>
          </div>

          <div className="nav-actions">
            <Link href="https://app.growourreviews.com/login" className="nav-btn-secondary">
              Log In
            </Link>
            <Link href="https://app.growourreviews.com/signup" className="nav-btn-primary">
              Start Free Trial
            </Link>
          </div>

          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </nav>
      </header>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="nav-mobile-menu">
          <button
            className="nav-mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="flex flex-col items-center gap-8">
            <Link
              href="/#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-slate-800 hover:text-slate-600"
            >
              How It Works
            </Link>
            <Link
              href="/#features"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-slate-800 hover:text-slate-600"
            >
              Features
            </Link>
            <Link
              href="/pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-slate-800 hover:text-slate-600"
            >
              Pricing
            </Link>
            <Link
              href="/blog"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-slate-800 hover:text-slate-600"
            >
              Blog
            </Link>
            <Link
              href="/#faq"
              onClick={() => setMobileMenuOpen(false)}
              className="text-lg font-medium text-slate-800 hover:text-slate-600"
            >
              FAQ
            </Link>

            <div className="flex flex-col items-center gap-4 mt-4">
              <Link
                href="https://app.growourreviews.com/login"
                className="nav-btn-secondary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Log In
              </Link>
              <Link
                href="https://app.growourreviews.com/signup"
                className="nav-btn-primary"
                onClick={() => setMobileMenuOpen(false)}
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .nav-wrapper {
          position: sticky;
          top: 0;
          z-index: 50;
          display: flex;
          justify-content: center;
          padding: 1rem 1.5rem;
          pointer-events: none;
        }

        .nav-bubble {
          pointer-events: auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 2rem;
          max-width: 920px;
          width: 100%;
          padding: 0.625rem 0.625rem 0.625rem 1.5rem;
          background-color: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid var(--border-light);
          border-radius: 9999px;
          box-shadow: var(--shadow-md);
        }

        .nav-logo {
          text-decoration: none;
          white-space: nowrap;
          flex-shrink: 0;
          display: flex;
          align-items: center;
        }

        .nav-links {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .nav-links a {
          font-family: var(--font-inter, 'Inter', sans-serif);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          padding: 0.5rem 0.875rem;
          border-radius: 9999px;
          transition: all 0.15s ease;
          white-space: nowrap;
        }

        .nav-links a:hover {
          color: var(--text-primary);
          background-color: var(--bg-secondary);
        }

        .nav-actions {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        /* Log In — subtle outlined pill */
        .nav-btn-secondary {
          font-family: var(--font-inter, 'Inter', sans-serif);
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-primary);
          text-decoration: none;
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          border: 1px solid var(--border-light);
          background-color: transparent;
          transition: all 0.15s ease;
        }

        .nav-btn-secondary:hover {
          background-color: var(--bg-secondary);
          border-color: var(--text-tertiary);
        }

        /* Start Free Trial — brand colour pill with dark text */
        .nav-btn-primary {
          font-family: var(--font-inter, 'Inter', sans-serif);
          font-size: 0.875rem;
          font-weight: 600;
          color: var(--accent-text);           /* Dark text — #0f172a */
          text-decoration: none;
          padding: 0.5rem 1.25rem;
          border-radius: 9999px;
          background-color: var(--accent);     /* #80e000 */
          border: none;
          transition: all 0.15s ease;
        }

        .nav-btn-primary:hover {
          background-color: var(--accent-hover);  /* #6bc200 */
        }

        /* Mobile */
        @media (max-width: 768px) {
          .nav-bubble {
            max-width: 100%;
            border-radius: 1.5rem;
            padding: 0.5rem 0.5rem 0.5rem 1.25rem;
          }

          .nav-links {
            display: none;
          }

          .nav-actions {
            display: none;
          }

          .nav-mobile-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.5rem;
            height: 2.5rem;
            border: none;
            background: none;
            cursor: pointer;
            color: var(--text-primary);
          }
        }

        @media (min-width: 769px) {
          .nav-mobile-toggle {
            display: none;
          }
        }

        .nav-mobile-menu {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          z-index: 100;
          background-color: rgba(255, 255, 255, 0.97);
          backdrop-filter: blur(16px);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2rem;
          padding: 2rem;
        }

        .nav-mobile-menu .nav-btn-primary {
          font-size: 1.125rem;
          padding: 0.875rem 2rem;
        }

        .nav-mobile-close {
          position: absolute;
          top: 1.5rem;
          right: 1.5rem;
          width: 2.5rem;
          height: 2.5rem;
          border: none;
          background: none;
          cursor: pointer;
          color: var(--text-primary);
          font-size: 1.5rem;
        }
      `}</style>
    </>
  )
}