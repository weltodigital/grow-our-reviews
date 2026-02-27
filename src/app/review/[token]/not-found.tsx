import { Card, CardContent } from '@/components/ui/card'
import { AlertTriangle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <Card className="w-full max-w-md mx-auto text-center">
        <CardContent className="pt-8 pb-8">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-orange-100 p-3">
              <AlertTriangle className="h-8 w-8 text-orange-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Review Link Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            This review link is invalid or has expired. Please contact the business directly if you'd like to leave feedback.
          </p>
          <p className="text-xs text-gray-500">
            If you believe this is an error, please try the link again or contact support.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}