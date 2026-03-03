import { Button } from '@/components/ui/button'
import { ArrowLeft, Home } from 'lucide-react'
import Link from 'next/link'
import GoogleReviewGuide from '@/components/GoogleReviewGuide'

export default function GoogleReviewLinkHelpPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/settings">
                Settings
              </Link>
            </Button>
          </div>
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Home className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Grow Our Reviews</h1>
              <p className="text-gray-600">Help Center</p>
            </div>
          </div>
        </div>

        {/* Guide */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <GoogleReviewGuide />
        </div>

        {/* Back to Settings */}
        <div className="mt-8 text-center">
          <Button asChild>
            <Link href="/dashboard/settings">
              Go to Settings to Add Your Link
            </Link>
          </Button>
        </div>

        {/* Contact Section */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
          <h3 className="font-semibold text-blue-900 mb-2">Still Need Help?</h3>
          <p className="text-blue-700 text-sm mb-4">
            If you're still having trouble finding your Google Review link, we're here to help!
          </p>
          <div className="space-y-2">
            <p className="text-blue-700 text-sm">
              Email us at{' '}
              <a
                href="mailto:hello@growourreviews.com"
                className="font-medium text-blue-800 hover:text-blue-900"
              >
                hello@growourreviews.com
              </a>{' '}
              with your business name and we'll find the link for you.
            </p>
            <p className="text-xs text-blue-600">We usually respond within a few hours.</p>
          </div>
        </div>
      </div>
    </div>
  )
}