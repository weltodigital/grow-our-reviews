'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface GoogleReviewGuideProps {
  className?: string
  showTitle?: boolean
}

export default function GoogleReviewGuide({ className = '', showTitle = true }: GoogleReviewGuideProps) {
  const [expandedMethod, setExpandedMethod] = useState<number>(1) // Method 1 expanded by default

  const toggleMethod = (methodNumber: number) => {
    setExpandedMethod(expandedMethod === methodNumber ? 0 : methodNumber)
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {showTitle && (
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">How to Set Up Google Reviews</h2>
          <p className="mt-2 text-sm text-gray-600">Choose the method that works best for you</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Method 1: Automatic Business Search (Easiest) */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleMethod(1)}
            className="w-full px-4 py-3 text-left flex items-center justify-between bg-green-50 rounded-t-lg hover:bg-green-100 transition-colors"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Method 1: Automatic Business Search (Easiest)</h3>
              <p className="text-sm text-gray-500">Search for your business in Grow Our Reviews</p>
            </div>
            {expandedMethod === 1 ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedMethod === 1 && (
            <div className="px-4 pb-4 space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-green-800 mb-2">✨ Recommended Method</h4>
                <p className="text-sm text-green-700">
                  This is the fastest and easiest way to set up your Google Reviews link. No manual searching required!
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">1</span>
                    <span className="font-medium">Go to Settings</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    In your Grow Our Reviews dashboard, go to Settings → Business Information
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">2</span>
                    <span className="font-medium">Search for your business</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Type your business name in the search box. We'll find it using Google's business directory.
                  </p>
                  <div className="ml-8 mt-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-md">
                      <input
                        type="text"
                        placeholder="e.g., Smith Plumbing Bristol"
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        readOnly
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">3</span>
                    <span className="font-medium">Select your business</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Click on your business from the search results. The Google Review URL will be automatically generated for you.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">4</span>
                    <span className="font-medium">Test and save</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Use the "Test Link" button to verify it opens your review page correctly, then save your settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Method 2: Manual Entry via Google Business Profile */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleMethod(2)}
            className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Method 2: Manual Entry via Google Business Profile</h3>
              <p className="text-sm text-gray-500">Use your Google Business Profile dashboard</p>
            </div>
            {expandedMethod === 2 ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedMethod === 2 && (
            <div className="px-4 pb-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-blue-800 mb-2">💼 Best for Business Owners</h4>
                <p className="text-sm text-blue-700">
                  If you manage your Google Business Profile directly, this method gives you the cleanest review URLs.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">1</span>
                    <span className="font-medium">Go to Google Business Profile</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Visit <strong>business.google.com</strong> and sign in with the Google account you use for your business.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">2</span>
                    <span className="font-medium">Navigate to Home</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Click "Home" in the menu on the left side of your dashboard.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">3</span>
                    <span className="font-medium">Find "Ask for reviews"</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Look for the "Get more reviews" card on your dashboard and click "Ask for reviews" or "Share review form".
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">4</span>
                    <span className="font-medium">Copy and paste the link</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Copy the review link from the popup and paste it into the manual URL field in Grow Our Reviews settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Method 3: Manual Entry via Google Search */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleMethod(3)}
            className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Method 3: Manual Entry via Google Search</h3>
              <p className="text-sm text-gray-500">Find your business on Google and get the review link</p>
            </div>
            {expandedMethod === 3 ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedMethod === 3 && (
            <div className="px-4 pb-4 space-y-4">
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-4">
                <h4 className="font-semibold text-orange-800 mb-2">🔍 Alternative Method</h4>
                <p className="text-sm text-orange-700">
                  Good fallback if you don't have access to Google Business Profile dashboard or automatic search doesn't find your business.
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">1</span>
                    <span className="font-medium">Search on Google</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Go to <strong>google.com</strong> and search for your exact business name and location (e.g., "Smith Plumbing Bristol").
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">2</span>
                    <span className="font-medium">Find your business profile</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Look for your Google Business Profile on the right side (desktop) or at the top (mobile). It will show your business name, star rating, and reviews.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">3</span>
                    <span className="font-medium">Click "Ask for reviews"</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Click the "Ask for reviews" button (or "Write a review" → "Ask for reviews"). If you don't see it, click your business name first to open the full profile.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-orange-100 text-orange-800 text-sm font-medium px-2.5 py-0.5 rounded-full">4</span>
                    <span className="font-medium">Copy and paste the link</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Copy the review link from the popup and paste it into the manual URL field in Grow Our Reviews settings.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Common Questions</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-gray-700">"Which method should I use?"</p>
            <p className="text-gray-600">
              <strong>Try Method 1 first</strong> — it's the fastest! If you can't find your business in the automatic search (common for Service Area Businesses/tradesmen), use Method 2 for the cleanest URLs, or Method 3 as a backup.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-700">"My business doesn't show up in the search"</p>
            <p className="text-gray-600">
              This is common for Service Area Businesses, tradesmen, or new businesses. Simply click "Don't see your business?" in the search results and use the manual entry option with Method 2 or 3.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-700">"I can't find my business on Google at all"</p>
            <p className="text-gray-600">
              You'll need to create a Google Business Profile first at <strong>business.google.com</strong>. It's free and takes about 10 minutes to set up. Once verified, return here to get your review link.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-700">"The link looks complicated — is it right?"</p>
            <p className="text-gray-600">
              Google review links often look like https://g.page/r/XXXXX/review or https://search.google.com/local/writereview?placeid=XXXXX. As long as it starts with https:// and contains 'google', it should work. Use the "Test Link" button to verify it opens your review page.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-700">"Will all customers be able to leave reviews?"</p>
            <p className="text-gray-600">
              Customers need a Google account to leave reviews. About 20-40% of customers typically complete a review after clicking the link. This is normal industry-wide — the volume approach ensures you still get plenty of reviews from willing customers.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-700">"I still need help"</p>
            <p className="text-gray-600">
              Email us at <strong>hello@growourreviews.com</strong> with your business name and we'll help you get set up. We usually respond within a few hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}