'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X, ExternalLink, RefreshCw, Phone, MessageCircle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'

interface SmsFailureStats {
  recentFailures: {
    total: number
    percentage: number
    recentRequests: number
  }
  failureReasons: Array<{
    errorCode: string | null
    errorMessage: string | null
    count: number
    explanation: string
  }>
  recentFailedRequests: Array<{
    id: string
    customerName: string
    customerPhone: string
    failedAt: string
    errorCode: string | null
    errorMessage: string | null
    explanation: string
    retryCount: number
  }>
}

export function SmsFailureAlert() {
  const [stats, setStats] = useState<SmsFailureStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDismissed, setIsDismissed] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  useEffect(() => {
    const fetchFailureStats = async () => {
      try {
        const response = await fetch('/api/sms-failures')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Failed to fetch SMS failure stats:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchFailureStats()
  }, [])

  // Don't show anything while loading or if dismissed
  if (isLoading || isDismissed || !stats) {
    return null
  }

  // Only show alert if there are recent failures (> 5% failure rate or > 3 failures)
  const shouldShowAlert = stats.recentFailures.total > 0 && (
    stats.recentFailures.percentage > 5 ||
    stats.recentFailures.total >= 3
  )

  if (!shouldShowAlert) {
    return null
  }

  const getSeverityLevel = () => {
    if (stats.recentFailures.percentage >= 20 || stats.recentFailures.total >= 10) {
      return 'critical'
    } else if (stats.recentFailures.percentage >= 10 || stats.recentFailures.total >= 5) {
      return 'high'
    }
    return 'medium'
  }

  const severity = getSeverityLevel()
  const borderColor = severity === 'critical' ? 'border-red-500' :
                     severity === 'high' ? 'border-orange-500' : 'border-yellow-500'
  const bgColor = severity === 'critical' ? 'bg-red-50' :
                  severity === 'high' ? 'bg-orange-50' : 'bg-yellow-50'
  const textColor = severity === 'critical' ? 'text-red-900' :
                    severity === 'high' ? 'text-orange-900' : 'text-yellow-900'

  return (
    <Card className={`border-l-4 ${borderColor} ${bgColor} mb-6`}>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Alert Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className={`h-5 w-5 ${severity === 'critical' ? 'text-red-600' : severity === 'high' ? 'text-orange-600' : 'text-yellow-600'}`} />
              <div>
                <h3 className={`font-semibold ${textColor}`}>
                  SMS Delivery Issues Detected
                </h3>
                <p className={`text-sm ${textColor}`}>
                  <strong>{stats.recentFailures.total} of your last {stats.recentFailures.recentRequests} requests</strong>
                  {' '}failed to deliver ({stats.recentFailures.percentage}% failure rate)
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsDismissed(true)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href="/dashboard/requests?status=failed">
                <MessageCircle className="h-4 w-4 mr-2" />
                View Failed Requests
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {showDetails ? 'Hide Details' : 'Show Details'}
            </Button>
          </div>

          {/* Detailed Breakdown */}
          {showDetails && (
            <div className="space-y-4 pt-4 border-t">
              {/* Common Failure Reasons */}
              {stats.failureReasons.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Common Failure Reasons:</h4>
                  <div className="space-y-2">
                    {stats.failureReasons.slice(0, 3).map((reason, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-white/70 p-2 rounded">
                        <div>
                          <span className="font-medium">{reason.explanation}</span>
                          {reason.errorCode && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              Code: {reason.errorCode}
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary">
                          {reason.count} failure{reason.count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Failed Requests */}
              {stats.recentFailedRequests.length > 0 && (
                <div>
                  <h4 className="font-medium text-sm mb-2">Recent Failed Deliveries:</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {stats.recentFailedRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between text-sm bg-white/70 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <div>
                            <span className="font-medium">{request.customerName}</span>
                            <span className="text-gray-600 ml-2">{request.customerPhone}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {new Date(request.failedAt).toLocaleDateString()}
                          </div>
                          <div className="text-xs">
                            {request.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Help Text */}
              <div className="text-xs text-gray-600 bg-white/50 p-3 rounded">
                <p className="font-medium mb-1">💡 How to fix SMS delivery issues:</p>
                <ul className="space-y-1 ml-4">
                  <li>• Check phone numbers are in correct format (UK: +44 or 07xxx)</li>
                  <li>• Remove landline numbers (SMS only works on mobiles)</li>
                  <li>• Verify customers haven't blocked your number</li>
                  <li>• Consider alternative contact methods for failed numbers</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}