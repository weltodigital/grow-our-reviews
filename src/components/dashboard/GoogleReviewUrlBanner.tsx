'use client'

import { useState } from 'react'
import { Link2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import GoogleReviewGuide from '@/components/GoogleReviewGuide'

interface GoogleReviewUrlBannerProps {
  profile: any
}

export default function GoogleReviewUrlBanner({ profile }: GoogleReviewUrlBannerProps) {
  const [showGuide, setShowGuide] = useState(false)

  // Don't show banner if URL is already set
  if (profile?.google_review_url) {
    return null
  }

  return (
    <>
      {/* Banner */}
      <div className="bg-yellow-50 border-b border-yellow-200">
        <div className="px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <Link2 className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-yellow-800">
                One more step before you can send review requests
              </h3>
              <p className="mt-1 text-sm text-yellow-700">
                You need to add your Google Review link so we know where to send your happy customers. It takes about 60 seconds.
              </p>
              <div className="mt-3 flex flex-col sm:flex-row sm:space-x-3 space-y-2 sm:space-y-0">
                <Button size="sm" asChild>
                  <a href="/dashboard/settings">Add Google Review Link</a>
                </Button>
                <button
                  type="button"
                  onClick={() => setShowGuide(true)}
                  className="text-sm text-yellow-800 hover:text-yellow-900 underline"
                >
                  Show me how to find it
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Guide Modal */}
      {showGuide && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">How to Find Your Google Review Link</h2>
              <button
                onClick={() => setShowGuide(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="px-6 py-4">
              <GoogleReviewGuide showTitle={false} />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <Button onClick={() => setShowGuide(false)} className="w-full sm:w-auto">
                Got it, thanks!
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}