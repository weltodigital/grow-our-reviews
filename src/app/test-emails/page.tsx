'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function TestEmailsPage() {
  const [loading, setLoading] = useState<string | null>(null)
  const [results, setResults] = useState<string[]>([])

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testEmail = async (type: string, endpoint: string, method: 'GET' | 'POST' = 'GET', body?: any) => {
    setLoading(type)
    try {
      const response = await fetch(endpoint, {
        method,
        headers: method === 'POST' ? { 'Content-Type': 'application/json' } : {},
        body: body ? JSON.stringify(body) : undefined
      })

      // Check if response is OK before trying to parse JSON
      if (!response.ok) {
        // Try to get error text if JSON parsing fails
        let errorText
        try {
          const errorData = await response.json()
          errorText = errorData.error || `HTTP ${response.status} ${response.statusText}`
        } catch {
          errorText = `HTTP ${response.status} ${response.statusText}`
        }
        addResult(`❌ ${type} failed: ${errorText}`)
        return
      }

      // Try to parse JSON response
      let data
      try {
        const responseText = await response.text()
        if (responseText.trim()) {
          data = JSON.parse(responseText)
        } else {
          addResult(`⚠️ ${type}: Empty response (might have sent successfully)`)
          return
        }
      } catch (parseError) {
        addResult(`💥 ${type} JSON parse error: Response was not valid JSON`)
        return
      }

      if (data.success !== false) {
        addResult(`✅ ${data.message || `${type} sent successfully`}`)
      } else {
        addResult(`❌ ${type} failed: ${data.error || 'Unknown error'}`)
      }
    } catch (error) {
      addResult(`💥 ${type} network error: ${error instanceof Error ? error.message : error}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Email Testing Dashboard</h1>
          <p className="text-gray-600">Test all automated emails to ed@weltodigital.com</p>
          <Badge variant="outline" className="mt-2">Dev/Testing Only</Badge>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Plan Limit Emails */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Limit Reached</CardTitle>
              <CardDescription>
                Test emails sent when users reach their monthly request limit
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => testEmail('Starter Plan Limit', '/api/emails/test-plan-limit')}
                disabled={loading === 'Starter Plan Limit'}
                className="w-full"
                variant="outline"
              >
                {loading === 'Starter Plan Limit' ? 'Sending...' : 'Test Starter Plan Limit (150/150)'}
              </Button>

              <Button
                onClick={() => testEmail('Growth Plan Limit', '/api/emails/test-plan-limit', 'POST', { planType: 'growth' })}
                disabled={loading === 'Growth Plan Limit'}
                className="w-full"
                variant="outline"
              >
                {loading === 'Growth Plan Limit' ? 'Sending...' : 'Test Growth Plan Limit (300/300)'}
              </Button>
            </CardContent>
          </Card>

          {/* Payment Failed Emails */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payment Failed</CardTitle>
              <CardDescription>
                Test emails sent when subscription payments fail
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => testEmail('Starter Payment Failed', '/api/emails/test-payment-failed')}
                disabled={loading === 'Starter Payment Failed'}
                className="w-full"
                variant="outline"
              >
                {loading === 'Starter Payment Failed' ? 'Sending...' : 'Test Starter Payment Failed'}
              </Button>

              <Button
                onClick={() => testEmail('Growth Payment Failed', '/api/emails/test-payment-failed', 'POST', { planType: 'growth' })}
                disabled={loading === 'Growth Payment Failed'}
                className="w-full"
                variant="outline"
              >
                {loading === 'Growth Payment Failed' ? 'Sending...' : 'Test Growth Payment Failed'}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Email Tests */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Existing Emails</CardTitle>
              <CardDescription>
                Test existing automated emails
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button
                onClick={() => testEmail('Welcome Email', '/api/emails/welcome', 'POST', {
                  email: 'ed@weltodigital.com',
                  businessName: 'Welto Digital (Test)'
                })}
                disabled={loading === 'Welcome Email'}
                className="w-full"
                variant="outline"
              >
                {loading === 'Welcome Email' ? 'Sending...' : 'Test Welcome Email'}
              </Button>

              <Button
                onClick={() => testEmail('Trial Ending', '/api/emails/trial-ending', 'POST', {
                  email: 'ed@weltodigital.com',
                  businessName: 'Welto Digital (Test)',
                  trialEndsAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString()
                })}
                disabled={loading === 'Trial Ending'}
                className="w-full"
                variant="outline"
              >
                {loading === 'Trial Ending' ? 'Sending...' : 'Test Trial Ending Email'}
              </Button>

              <Button
                onClick={() => testEmail('Subscription Confirmation', '/api/emails/subscription-confirmation', 'POST', {
                  email: 'ed@weltodigital.com',
                  businessName: 'Welto Digital (Test)',
                  planName: 'Growth'
                })}
                disabled={loading === 'Subscription Confirmation'}
                className="w-full"
                variant="outline"
              >
                {loading === 'Subscription Confirmation' ? 'Sending...' : 'Test Subscription Confirmation'}
              </Button>
            </CardContent>
          </Card>

          {/* Configuration Test */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configuration</CardTitle>
              <CardDescription>
                Check if email service is properly configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={async () => {
                  setLoading('Config Check')
                  try {
                    const response = await fetch('/api/emails/test-config')
                    const data = await response.json()
                    if (response.ok) {
                      addResult(`✅ Resend configured: ${data.configured}, API Key: ${data.hasApiKey ? 'Present' : 'Missing'} (${data.apiKeyPrefix}...)`)
                    } else {
                      addResult(`❌ Config check failed: ${data.error}`)
                    }
                  } catch (error) {
                    addResult(`💥 Config check error: ${error}`)
                  } finally {
                    setLoading(null)
                  }
                }}
                disabled={loading === 'Config Check'}
                className="w-full"
                variant="secondary"
              >
                {loading === 'Config Check' ? 'Checking...' : 'Check Email Configuration'}
              </Button>
            </CardContent>
          </Card>

          {/* Results */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Test Results</CardTitle>
              <CardDescription>
                Results from email sending tests
              </CardDescription>
            </CardHeader>
            <CardContent>
              {results.length === 0 ? (
                <p className="text-gray-500 text-sm">No tests run yet</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {results.map((result, index) => (
                    <div key={index} className="text-xs font-mono bg-gray-50 p-2 rounded border">
                      {result}
                    </div>
                  ))}
                </div>
              )}

              {results.length > 0 && (
                <Button
                  onClick={() => setResults([])}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Clear Results
                </Button>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="font-medium text-blue-900 mb-2">📧 Email Destination</h3>
          <p className="text-blue-800 text-sm">
            All test emails will be sent to: <strong>ed@weltodigital.com</strong>
          </p>
          <p className="text-blue-700 text-xs mt-1">
            Check your email inbox and spam folder for the test messages.
          </p>
        </div>
      </div>
    </div>
  )
}