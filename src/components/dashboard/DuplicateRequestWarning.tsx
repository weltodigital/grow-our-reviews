'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, Info, XCircle, Clock, CheckCircle, MessageCircle } from 'lucide-react'

interface DuplicateCheckResult {
  isDuplicate: boolean
  warningLevel: 'none' | 'info' | 'warning' | 'error'
  message: string
  details?: {
    phoneNumber: string
    customerName: string
    lastRequestDate: string
    daysAgo: number
    lastRequestStatus: string
    hasReviewed: boolean
    hasGivenFeedback: boolean
    totalRequests: number
  }
  suggestion?: string
}

interface DuplicateRequestWarningProps {
  phoneNumber: string
  customerName: string
  onProceedConfirmed: () => void
  onCancel: () => void
  isVisible: boolean
}

export function DuplicateRequestWarning({
  phoneNumber,
  customerName,
  onProceedConfirmed,
  onCancel,
  isVisible
}: DuplicateRequestWarningProps) {
  const [duplicateCheck, setDuplicateCheck] = useState<DuplicateCheckResult | null>(null)
  const [isChecking, setIsChecking] = useState(false)
  const [showDetails, setShowDetails] = useState(false)
  const [userConfirmed, setUserConfirmed] = useState(false)

  useEffect(() => {
    if (isVisible && phoneNumber && phoneNumber.trim()) {
      checkForDuplicates()
    }
  }, [phoneNumber, customerName, isVisible])

  const checkForDuplicates = async () => {
    if (!phoneNumber.trim()) return

    setIsChecking(true)
    try {
      const response = await fetch('/api/check-duplicate-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          customerName: customerName?.trim()
        })
      })

      const result: DuplicateCheckResult = await response.json()
      setDuplicateCheck(result)

      // Auto-proceed if no duplicates found
      if (!result.isDuplicate && result.warningLevel === 'none') {
        onProceedConfirmed()
      }
    } catch (error) {
      console.error('Error checking duplicates:', error)
      // On error, allow user to proceed but show warning
      setDuplicateCheck({
        isDuplicate: false,
        warningLevel: 'warning',
        message: 'Unable to check for duplicate requests',
        suggestion: 'Proceed with caution - duplicate check failed'
      })
    } finally {
      setIsChecking(false)
    }
  }

  const handleProceed = () => {
    setUserConfirmed(true)
    onProceedConfirmed()
  }

  const getIcon = () => {
    if (isChecking) {
      return <Clock className="h-5 w-5 animate-spin text-green-600" />
    }

    if (!duplicateCheck) return null

    switch (duplicateCheck.warningLevel) {
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-orange-600" />
      case 'info':
        return <Info className="h-5 w-5 text-green-600" />
      default:
        return <CheckCircle className="h-5 w-5 text-green-600" />
    }
  }

  const getCardStyle = () => {
    if (!duplicateCheck) return ''

    switch (duplicateCheck.warningLevel) {
      case 'error':
        return 'border-red-200 bg-red-50'
      case 'warning':
        return 'border-orange-200 bg-orange-50'
      case 'info':
        return 'border-green-200 bg-green-50'
      default:
        return 'border-green-200 bg-green-50'
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'reviewed':
        return <Badge className="bg-green-100 text-green-800">Left Review</Badge>
      case 'feedback_given':
        return <Badge className="bg-red-100 text-red-800">Gave Feedback</Badge>
      case 'clicked':
        return <Badge className="bg-green-100 text-green-800">Clicked Link</Badge>
      case 'sent':
        return <Badge className="bg-gray-100 text-gray-800">SMS Sent</Badge>
      case 'failed':
        return <Badge className="bg-red-100 text-red-800">SMS Failed</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  if (!isVisible || (!isChecking && (!duplicateCheck || !duplicateCheck.isDuplicate))) {
    return null
  }

  return (
    <Card className={`border-l-4 ${getCardStyle()}`}>
      <CardContent className="pt-4">
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            {getIcon()}
            <div className="flex-1">
              <h3 className="font-semibold">
                {isChecking ? 'Checking for previous requests...' : 'Previous Request Found'}
              </h3>
              {duplicateCheck && !isChecking && (
                <p className="text-sm mt-1">
                  {duplicateCheck.message}
                </p>
              )}
            </div>
          </div>

          {/* Details */}
          {duplicateCheck && duplicateCheck.details && !isChecking && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Request History for {customerName || phoneNumber}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? 'Hide Details' : 'Show Details'}
                </Button>
              </div>

              {showDetails && (
                <div className="bg-white/70 p-3 rounded space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Last Request:</span>
                      <div className="font-medium">
                        {formatDate(duplicateCheck.details.lastRequestDate)} ({duplicateCheck.details.daysAgo} days ago)
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="mt-1">
                        {getStatusBadge(duplicateCheck.details.lastRequestStatus)}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-gray-600">Total Requests (90 days):</span>
                      <div className="font-medium">{duplicateCheck.details.totalRequests}</div>
                    </div>
                    <div>
                      <span className="text-gray-600">Customer Actions:</span>
                      <div className="space-y-1">
                        {duplicateCheck.details.hasReviewed && (
                          <Badge className="bg-green-100 text-green-800 text-xs">Already Reviewed</Badge>
                        )}
                        {duplicateCheck.details.hasGivenFeedback && (
                          <Badge className="bg-red-100 text-red-800 text-xs">Gave Feedback</Badge>
                        )}
                        {!duplicateCheck.details.hasReviewed && !duplicateCheck.details.hasGivenFeedback && (
                          <Badge variant="outline" className="text-xs">No Response Yet</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Suggestion */}
              {duplicateCheck.suggestion && (
                <div className="bg-white/50 p-3 rounded">
                  <p className="text-sm">
                    <strong>💡 Recommendation:</strong> {duplicateCheck.suggestion}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          {duplicateCheck && !isChecking && (
            <div className="flex items-center gap-3 pt-3 border-t">
              <Button
                variant="outline"
                onClick={onCancel}
              >
                Cancel
              </Button>

              <Button
                onClick={handleProceed}
                className={
                  duplicateCheck.warningLevel === 'error'
                    ? 'bg-red-600 hover:bg-red-700 !text-white'
                    : duplicateCheck.warningLevel === 'warning'
                    ? 'bg-orange-600 hover:bg-orange-700 !text-white'
                    : ''
                }
              >
                {duplicateCheck.warningLevel === 'error' ? 'Send Anyway (Not Recommended)' :
                 duplicateCheck.warningLevel === 'warning' ? 'Proceed with Caution' :
                 'Proceed'}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}