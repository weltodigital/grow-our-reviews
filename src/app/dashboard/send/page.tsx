'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Send, Clock } from 'lucide-react'
import Link from 'next/link'
import { createReviewRequest } from './actions'

export default function SendRequestPage() {
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState<{
    customerName: string
    scheduledTime: string
    token: string
  } | null>(null)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Client-side validation
    if (!customerName.trim()) {
      setError('Customer name is required')
      return
    }

    if (!customerPhone.trim()) {
      setError('Customer phone number is required')
      return
    }

    // Basic phone validation for UK numbers
    const cleanPhone = customerPhone.trim().replace(/\s+/g, '')
    const phoneRegex = /^(\+44|0)[7-9]\d{8,9}$/
    if (!phoneRegex.test(cleanPhone)) {
      setError('Please enter a valid UK phone number (e.g., 07700 123456 or +44 7700 123456)')
      return
    }

    setIsLoading(true)
    setError('')
    setSuccess(null)

    try {
      const result = await createReviewRequest({
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
      })

      if (result.error) {
        setError(result.error)
      } else if (result.success) {
        setSuccess({
          customerName: customerName.trim(),
          scheduledTime: result.scheduledTime!,
          token: result.token!,
        })
        // Clear form
        setCustomerName('')
        setCustomerPhone('')
      }
    } catch (err) {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatPhoneNumber = (value: string) => {
    // Remove all non-digits
    const digits = value.replace(/\D/g, '')

    // Format as UK number if it starts with 07 or 447
    if (digits.startsWith('07') && digits.length <= 11) {
      return digits.replace(/(\d{2})(\d{4})(\d{6})/, '$1$2 $3')
    } else if (digits.startsWith('447') && digits.length <= 13) {
      return '+' + digits.replace(/(\d{3})(\d{4})(\d{6})/, '$1 $2 $3')
    }

    return value
  }

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value)
    setCustomerPhone(formatted)
  }

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <Card className="bg-green-50 border-green-200">
          <CardHeader>
            <CardTitle className="text-green-800 flex items-center gap-2">
              <Send className="h-5 w-5" />
              Review Request Scheduled!
            </CardTitle>
            <CardDescription className="text-green-700">
              Your review request has been scheduled successfully
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <span className="font-medium text-green-800">Customer:</span> {success.customerName}
              </div>
              <div className="flex items-center gap-2 text-green-700">
                <Clock className="h-4 w-4" />
                <span>SMS will be sent at {new Date(success.scheduledTime).toLocaleString('en-GB', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit'
                })}</span>
              </div>
              <div className="pt-4 border-t border-green-200">
                <div className="text-sm text-green-600 mb-2">Preview link (for testing):</div>
                <code className="text-xs bg-white px-2 py-1 rounded border break-all">
                  {process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/review/{success.token}
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button onClick={() => setSuccess(null)}>
            Send Another Request
          </Button>
          <Button variant="outline" asChild>
            <Link href="/dashboard/requests">View All Requests</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Send Review Request</h1>
          <p className="text-gray-600">Send a review request to a customer</p>
        </div>
      </div>

      <div className="max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Customer Information</CardTitle>
            <CardDescription>
              Enter your customer's details to send them a review request
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. John Smith"
                    required
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500">
                    This will be used in the SMS message
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="customerPhone">Phone Number *</Label>
                  <Input
                    id="customerPhone"
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="07700 123456"
                    required
                    className="h-12"
                  />
                  <p className="text-xs text-gray-500">
                    UK mobile numbers (07xxx) or international (+44xxx)
                  </p>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="text-sm text-red-600">{error}</div>
                </div>
              )}

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• The SMS will be scheduled based on your delay settings</li>
                  <li>• If they rate 4-5 stars, they'll go to Google Reviews</li>
                  <li>• If they rate 1-3 stars, they'll give private feedback instead</li>
                  <li>• A gentle nudge SMS is sent after 48 hours if no response</li>
                </ul>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isLoading || !customerName.trim() || !customerPhone.trim()}
                className="w-full sm:w-auto"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                    Scheduling Request...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Schedule Review Request
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}