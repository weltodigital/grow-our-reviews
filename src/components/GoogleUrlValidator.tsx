'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { CheckCircle2, AlertCircle, ExternalLink, Eye, Loader2, XCircle } from 'lucide-react'

interface ValidationResult {
  isValid: boolean
  urlType: 'review_form' | 'business_profile' | 'search_listing' | 'maps_link' | 'invalid' | 'unknown'
  suggestions?: string[]
  warning?: string
  preview?: {
    title?: string
    description?: string
    redirectsTo?: string
  }
}

interface GoogleUrlValidatorProps {
  url: string
  onValidationChange?: (isValid: boolean, result?: ValidationResult) => void
  autoValidate?: boolean
}

export function GoogleUrlValidator({ url, onValidationChange, autoValidate = false }: GoogleUrlValidatorProps) {
  const [isValidating, setIsValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  useEffect(() => {
    if (autoValidate && url && url.trim().length > 0) {
      validateUrl()
    } else if (!url || url.trim().length === 0) {
      setValidationResult(null)
      onValidationChange?.(false)
    }
  }, [url, autoValidate])

  const validateUrl = async () => {
    if (!url || !url.trim()) return

    setIsValidating(true)
    try {
      const response = await fetch('/api/validate-google-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: url.trim() })
      })

      const result: ValidationResult = await response.json()
      setValidationResult(result)
      onValidationChange?.(result.isValid, result)
    } catch (error) {
      console.error('Validation error:', error)
      const errorResult: ValidationResult = {
        isValid: false,
        urlType: 'unknown',
        suggestions: ['Unable to validate URL. Please check your connection and try again.']
      }
      setValidationResult(errorResult)
      onValidationChange?.(false, errorResult)
    } finally {
      setIsValidating(false)
    }
  }

  const getStatusIcon = () => {
    if (isValidating) {
      return <Loader2 className="h-4 w-4 animate-spin text-green-600" />
    }

    if (!validationResult) {
      return null
    }

    if (validationResult.isValid) {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />
    }

    return <XCircle className="h-4 w-4 text-red-600" />
  }

  const getStatusColor = () => {
    if (!validationResult) return ''
    return validationResult.isValid ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
  }

  const getTypeDescription = (urlType: string) => {
    switch (urlType) {
      case 'review_form':
        return '✅ Direct review form - Perfect!'
      case 'business_profile':
        return '⚠️ Business profile page - Customers cannot review easily'
      case 'search_listing':
        return '❌ Search results - Not a direct review link'
      case 'maps_link':
        return '⚠️ General maps link - May not show review form'
      case 'invalid':
        return '❌ Invalid or non-Google URL'
      default:
        return '❓ Unknown URL type'
    }
  }

  if (!url || url.trim().length === 0) {
    return null
  }

  return (
    <div className="space-y-3">
      {/* Validation Controls */}
      <div className="flex items-center gap-2">
        {!autoValidate && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={validateUrl}
            disabled={isValidating}
          >
            {isValidating ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Validate URL
          </Button>
        )}

        {validationResult && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
        )}
      </div>

      {/* Validation Result */}
      {validationResult && (
        <Card className={`border-l-4 ${getStatusColor()}`}>
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <span className="font-medium">
                  {getTypeDescription(validationResult.urlType)}
                </span>
              </div>

              {validationResult.warning && (
                <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-yellow-800">{validationResult.warning}</p>
                </div>
              )}

              {validationResult.suggestions && validationResult.suggestions.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Suggestions:</h4>
                  <ul className="space-y-1">
                    {validationResult.suggestions.map((suggestion, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                        <span className="text-green-600 mt-1">•</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Preview */}
      {showPreview && validationResult?.preview && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-green-600" />
                <span className="font-medium text-green-900">Customer Preview</span>
              </div>

              <div className="bg-white border rounded-lg p-4 space-y-3">
                <h4 className="font-medium">
                  {validationResult.preview.title || 'Your Google Review Page'}
                </h4>
                <p className="text-sm text-gray-600">
                  {validationResult.preview.description || 'This is what customers will see when they click your review link.'}
                </p>

                {validationResult.preview.redirectsTo && (
                  <div className="text-xs text-gray-500">
                    <span className="font-medium">Note:</span> This URL redirects to {validationResult.preview.redirectsTo}
                  </div>
                )}

                <div className="pt-2 border-t">
                  <Button variant="outline" size="sm" asChild>
                    <a href={url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="h-3 w-3 mr-2" />
                      Test This Link
                    </a>
                  </Button>
                </div>
              </div>

              <div className="text-xs text-green-700">
                💡 <strong>Pro tip:</strong> Click "Test This Link" to see exactly what your customers will experience
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}