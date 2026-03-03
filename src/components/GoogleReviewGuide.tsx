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
          <h2 className="text-2xl font-bold text-gray-900">How to Find Your Google Review Link</h2>
          <p className="mt-2 text-sm text-gray-600">Follow these steps — it takes about 60 seconds</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Method 1: From Google Search (Easiest) */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleMethod(1)}
            className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Method 1: From Google Search (Easiest)</h3>
              <p className="text-sm text-gray-500">Search for your business on Google</p>
            </div>
            {expandedMethod === 1 ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedMethod === 1 && (
            <div className="px-4 pb-4 space-y-4">
              <div className="space-y-3">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">1</span>
                    <span className="font-medium">Search for your business</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Open Google and search for your exact business name. For example: "Smith Plumbing Bristol"
                  </p>
                  <div className="ml-8 mt-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-sm">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">G</span>
                        </div>
                        <div className="flex-1 bg-white border border-gray-300 rounded-full px-3 py-1.5">
                          <span className="text-gray-500 text-sm">Smith Plumbing Bristol</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">2</span>
                    <span className="font-medium">Find your business profile</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Look for your Google Business Profile on the right side (desktop) or at the top (mobile) with your business name, star rating, and reviews.
                  </p>
                  <div className="ml-8 mt-2">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-sm">
                      <h4 className="font-semibold text-gray-900">Smith Plumbing Bristol</h4>
                      <div className="flex items-center space-x-1 mt-1">
                        <span className="text-yellow-400">★★★★★</span>
                        <span className="text-sm text-gray-600">4.8 (127 reviews)</span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Plumber • Bristol</p>
                      <div className="flex space-x-2 mt-3">
                        <div className="bg-blue-600 text-white text-xs px-2 py-1 rounded">Call</div>
                        <div className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">Directions</div>
                        <div className="bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded border-2 border-blue-500">Ask for reviews</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">3</span>
                    <span className="font-medium">Click "Ask for reviews"</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Click the "Ask for reviews" button (it might also say "Get more reviews"). If you don't see this button, click on your business name first to open the full profile.
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">4</span>
                    <span className="font-medium">Copy the review link</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    A popup will appear with your unique review link. Click "Copy link" or select the entire link and copy it.
                  </p>
                  <div className="ml-8 mt-2">
                    <div className="bg-white border border-gray-200 rounded-lg p-4 max-w-md">
                      <h4 className="font-semibold text-gray-900 mb-2">Share review form</h4>
                      <div className="bg-gray-50 border border-gray-200 rounded p-2 mb-3">
                        <p className="text-xs text-gray-600 break-all">
                          https://search.google.com/local/writereview?placeid=ChIJxxxxxxxxxxxxx
                        </p>
                      </div>
                      <button className="bg-blue-600 text-white text-sm px-4 py-2 rounded hover:bg-blue-700">
                        Copy link
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-100 text-blue-800 text-sm font-medium px-2.5 py-0.5 rounded-full">5</span>
                    <span className="font-medium">Paste into Grow Our Reviews</span>
                  </div>
                  <p className="text-sm text-gray-600 ml-8">
                    Come back to Grow Our Reviews and paste the link into the field above.
                  </p>
                  <div className="ml-8 mt-2">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 max-w-md">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Google Review URL</label>
                      <input
                        type="text"
                        placeholder="Paste your link here"
                        value="https://search.google.com/local/writereview?placeid=..."
                        className="w-full border border-gray-300 rounded px-3 py-2 text-sm"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Method 2: From Google Maps */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleMethod(2)}
            className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Method 2: From Google Maps</h3>
              <p className="text-sm text-gray-500">Use Google Maps to find your business</p>
            </div>
            {expandedMethod === 2 ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedMethod === 2 && (
            <div className="px-4 pb-4 space-y-3">
              <div className="space-y-2">
                <p><strong>Step 1:</strong> Go to Google Maps (maps.google.com) and search for your business name.</p>
                <p><strong>Step 2:</strong> Click on your business listing to open your profile.</p>
                <p><strong>Step 3:</strong> Click "Ask for reviews" or the "Get more reviews" link.</p>
                <p><strong>Step 4:</strong> Copy the link from the popup that appears.</p>
                <p><strong>Step 5:</strong> Paste it into Grow Our Reviews.</p>
              </div>
            </div>
          )}
        </div>

        {/* Method 3: From Google Business Profile Dashboard */}
        <div className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleMethod(3)}
            className="w-full px-4 py-3 text-left flex items-center justify-between bg-gray-50 rounded-t-lg hover:bg-gray-100 transition-colors"
          >
            <div>
              <h3 className="font-semibold text-gray-900">Method 3: From Google Business Profile Dashboard</h3>
              <p className="text-sm text-gray-500">If you manage your business profile directly</p>
            </div>
            {expandedMethod === 3 ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>

          {expandedMethod === 3 && (
            <div className="px-4 pb-4 space-y-3">
              <div className="space-y-2">
                <p><strong>Step 1:</strong> Go to business.google.com and sign in with the Google account you use for your business.</p>
                <p><strong>Step 2:</strong> Click "Home" in the menu on the left.</p>
                <p><strong>Step 3:</strong> Look for the "Get more reviews" card on your dashboard. Click "Share review form".</p>
                <p><strong>Step 4:</strong> Copy the link.</p>
                <p><strong>Step 5:</strong> Paste it into Grow Our Reviews.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Troubleshooting */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-3">Need help?</h3>
        <div className="space-y-3 text-sm">
          <div>
            <p className="font-medium text-gray-700">"I can't find my business on Google"</p>
            <p className="text-gray-600">
              If your business doesn't appear in Google search, you may not have a Google Business Profile yet. You can create one for free at business.google.com — it takes about 10 minutes. Once it's set up and verified, come back here and follow the steps above.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-700">"I found the link but it looks weird"</p>
            <p className="text-gray-600">
              Google review links usually look something like: https://g.page/r/XXXXX/review or https://search.google.com/local/writereview?placeid=XXXXX. If your link starts with https:// and contains 'google', it's probably correct. Paste it in and try it — we'll validate it for you.
            </p>
          </div>

          <div>
            <p className="font-medium text-gray-700">"I still need help"</p>
            <p className="text-gray-600">
              No problem — email us at hello@growourreviews.com with your business name and we'll find the link for you. We usually respond within a few hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}