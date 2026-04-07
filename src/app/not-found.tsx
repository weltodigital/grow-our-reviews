import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <h1 className="text-6xl font-bold text-gray-900 mb-2">404</h1>
          <h2 className="text-2xl font-semibold text-gray-700 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or doesn't exist.
          </p>
        </div>

        <div className="space-y-4">
          <Button asChild className="w-full text-white">
            <Link href="/">
              Return to Homepage
            </Link>
          </Button>

          <Button asChild variant="outline" className="w-full">
            <Link href="/blog">
              Visit Our Blog
            </Link>
          </Button>
        </div>

        <div className="mt-8 text-sm text-gray-500">
          <p>If you believe this is an error, please contact us.</p>
        </div>
      </div>
    </div>
  )
}