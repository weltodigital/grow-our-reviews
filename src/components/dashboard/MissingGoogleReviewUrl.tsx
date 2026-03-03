'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Link2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import GoogleReviewGuide from '@/components/GoogleReviewGuide'

export default function MissingGoogleReviewUrl() {
  const [showGuide, setShowGuide] = useState(false)

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <div className="max-w-2xl">
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mb-4">
                <Link2 className="h-6 w-6 text-yellow-600" />
              </div>
              <CardTitle className="text-yellow-800">
                Before you can send review requests, you need to add your Google Review link
              </CardTitle>
              <CardDescription className="text-yellow-700">
                This is the link where your happy customers will be sent to leave a Google review. Without it, we don't know where to direct them.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <Link href="/dashboard/settings">Add Google Review Link</Link>
                </Button>
                <Button variant="outline" onClick={() => setShowGuide(true)}>
                  Need help finding it?
                </Button>
              </div>
            </CardContent>
          </Card>
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
                ×
              </button>
            </div>
            <div className="px-6 py-4">
              <GoogleReviewGuide showTitle={false} />
            </div>
            <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4">
              <div className="flex gap-3 justify-end">
                <Button onClick={() => setShowGuide(false)} variant="outline">
                  Close
                </Button>
                <Button asChild>
                  <Link href="/dashboard/settings">Go to Settings</Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}