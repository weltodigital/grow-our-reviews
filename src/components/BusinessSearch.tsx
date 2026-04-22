'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Star, Users, Check, ExternalLink, X, Plus } from 'lucide-react'

interface Business {
  placeId: string
  name: string
  address: string
  rating?: number
  userRatingsTotal?: number
  types: string[]
  reviewUrl: string
}

interface BusinessSearchProps {
  value: string
  onBusinessSelect: (business: Business | null) => void
  onBusinessNameChange: (name: string) => void
  placeholder?: string
  label?: string
  helperText?: string
  required?: boolean
  disabled?: boolean
  showTestLink?: boolean
  currentGoogleUrl?: string | null
  onManualEntry?: () => void
}

export default function BusinessSearch({
  value,
  onBusinessSelect,
  onBusinessNameChange,
  placeholder = "Search for your business...",
  label = "Business Name",
  helperText,
  required = false,
  disabled = false,
  showTestLink = false,
  currentGoogleUrl = null,
  onManualEntry
}: BusinessSearchProps) {
  const [query, setQuery] = useState(value)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [error, setError] = useState('')
  const [editableBusinessName, setEditableBusinessName] = useState(value)
  const [isEditingName, setIsEditingName] = useState(false)

  const debounceTimer = useRef<NodeJS.Timeout | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Debounced search function
  const searchBusinesses = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setBusinesses([])
      setShowDropdown(false)
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/business-search?query=${encodeURIComponent(searchQuery.trim())}`)
      const data = await response.json()

      if (!response.ok) {
        console.error('Business search API error:', data)

        // Show specific error messages to help with debugging
        if (data.details) {
          throw new Error(`${data.error}: ${data.details}`)
        }
        throw new Error(data.error || 'Failed to search businesses')
      }

      setBusinesses(data.businesses || [])
      setShowDropdown(true)
      setError('') // Clear any previous errors
    } catch (err: any) {
      console.error('Business search error:', err)

      // Show user-friendly error messages
      let userMessage = err.message || 'Failed to search businesses'
      if (err.message?.includes('API key')) {
        userMessage = 'Business search temporarily unavailable. Please enter your business name manually.'
      } else if (err.message?.includes('quota')) {
        userMessage = 'Too many searches. Please wait a moment and try again.'
      }

      setError(userMessage)
      setBusinesses([])
      setShowDropdown(false)
    } finally {
      setIsLoading(false)
    }
  }

  // Handle input changes with debouncing
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    onBusinessNameChange(newQuery)

    // Clear selected business if user is typing
    if (selectedBusiness && newQuery !== selectedBusiness.name) {
      setSelectedBusiness(null)
      onBusinessSelect(null)
    }

    // Clear existing debounce timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    // Set new debounce timer
    debounceTimer.current = setTimeout(() => {
      searchBusinesses(newQuery)
    }, 300)
  }

  // Handle business selection
  const handleBusinessSelect = (business: Business) => {
    setSelectedBusiness(business)
    setQuery(business.name)
    setEditableBusinessName(business.name)
    setShowDropdown(false)
    onBusinessNameChange(business.name)
    onBusinessSelect(business)
  }

  // Handle business name editing
  const handleBusinessNameEdit = (newName: string) => {
    setEditableBusinessName(newName)
    onBusinessNameChange(newName)
  }

  // Handle saving edited business name
  const handleSaveEditedName = () => {
    setQuery(editableBusinessName)
    setIsEditingName(false)
  }

  // Handle canceling business name edit
  const handleCancelEdit = () => {
    setEditableBusinessName(selectedBusiness?.name || '')
    setIsEditingName(false)
  }

  // Clear selected business
  const handleClearSelection = () => {
    setSelectedBusiness(null)
    setQuery('')
    setEditableBusinessName('')
    onBusinessSelect(null)
    onBusinessNameChange('')
  }

  // Handle manual entry (when user types business name but doesn't select from dropdown)
  const handleManualEntry = () => {
    if (!selectedBusiness && query.trim()) {
      setSelectedBusiness(null)
      onBusinessSelect(null)
    }
  }

  // Format business types for display
  const formatBusinessTypes = (types: string[]) => {
    const relevantTypes = types.filter(type =>
      !['establishment', 'point_of_interest', 'premise'].includes(type)
    ).map(type =>
      type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    )
    return relevantTypes.slice(0, 2).join(', ')
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <Label htmlFor="business-search" className="flex items-center gap-2">
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>

      <div className="relative mt-1">
        <Input
          ref={inputRef}
          id="business-search"
          type="text"
          value={query}
          onChange={handleInputChange}
          onBlur={handleManualEntry}
          placeholder={placeholder}
          disabled={disabled}
          className="pr-10"
        />

        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-gray-600"></div>
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>

        {selectedBusiness && (
          <div className="absolute inset-y-0 right-8 flex items-center pr-2 pointer-events-none">
            <Check className="h-4 w-4 text-green-500" />
          </div>
        )}
      </div>

      {helperText && (
        <p className="text-xs text-gray-500 mt-1">{helperText}</p>
      )}

      {error && (
        <p className="text-xs text-red-600 mt-1">{error}</p>
      )}

      {/* Selected business confirmation with editable name */}
      {selectedBusiness && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1">
              <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm font-medium text-green-900">Selected: {selectedBusiness.name}</p>
                </div>
                <p className="text-xs text-green-700">{selectedBusiness.address}</p>
                {selectedBusiness.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                    <span className="text-xs text-green-700">
                      {selectedBusiness.rating.toFixed(1)} ({selectedBusiness.userRatingsTotal} reviews)
                    </span>
                  </div>
                )}

                {/* Editable Business Name Section */}
                <div className="mt-3 p-2 bg-white border border-green-200 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <Label className="text-xs font-medium text-green-800">Business name for SMS messages:</Label>
                    {!isEditingName && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsEditingName(true)}
                        className="h-6 px-2 text-xs text-green-600 hover:text-green-800"
                      >
                        Edit
                      </Button>
                    )}
                  </div>

                  {isEditingName ? (
                    <div className="flex gap-2">
                      <Input
                        value={editableBusinessName}
                        onChange={(e) => handleBusinessNameEdit(e.target.value)}
                        className="text-sm"
                        placeholder="Enter business name for SMS"
                      />
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          size="sm"
                          onClick={handleSaveEditedName}
                          className="h-8 px-2 text-xs"
                        >
                          <Check className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelEdit}
                          className="h-8 px-2 text-xs"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-sm text-green-900 font-medium bg-green-50 px-2 py-1 rounded">
                      "{editableBusinessName}"
                    </p>
                  )}
                  <p className="text-xs text-green-600 mt-1">
                    This is how your business name will appear in SMS messages to customers.
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-green-600">
                    ✓ Google Reviews URL configured automatically
                  </p>
                  {showTestLink && selectedBusiness.reviewUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(selectedBusiness.reviewUrl, '_blank')}
                      className="h-6 px-2 text-xs text-green-600 border-green-300 hover:bg-green-50"
                    >
                      <ExternalLink className="h-3 w-3 mr-1" />
                      Test Link
                    </Button>
                  )}
                </div>
              </div>
            </div>

            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleClearSelection}
              className="h-6 w-6 p-0 text-green-600 hover:text-green-800 hover:bg-green-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Test current Google URL if no business selected but URL exists */}
      {!selectedBusiness && showTestLink && currentGoogleUrl && (
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-blue-800 font-medium">Current Google Reviews URL</p>
              <p className="text-xs text-blue-600 mt-1">
                Test your current review link to make sure it works correctly.
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.open(currentGoogleUrl, '_blank')}
              className="text-blue-600 border-blue-300 hover:bg-blue-50"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Test Current Link
            </Button>
          </div>
        </div>
      )}

      {/* Search results dropdown */}
      {showDropdown && businesses.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {businesses.map((business) => (
            <button
              key={business.placeId}
              type="button"
              onClick={() => handleBusinessSelect(business)}
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 focus:outline-none focus:bg-gray-50"
            >
              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{business.name}</p>
                  <p className="text-sm text-gray-600 truncate">{business.address}</p>

                  <div className="flex items-center gap-4 mt-1">
                    {business.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span className="text-xs text-gray-600">
                          {business.rating.toFixed(1)}
                        </span>
                      </div>
                    )}

                    {business.userRatingsTotal && (
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-gray-400" />
                        <span className="text-xs text-gray-600">
                          {business.userRatingsTotal} reviews
                        </span>
                      </div>
                    )}
                  </div>

                  {business.types.length > 0 && (
                    <p className="text-xs text-gray-500 mt-1">
                      {formatBusinessTypes(business.types)}
                    </p>
                  )}
                </div>
              </div>
            </button>
          ))}

          {/* Manual entry option at bottom of results */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <p className="text-xs text-gray-600 mb-2">
              Don't see your business? This is common for service-area businesses and tradesmen.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowDropdown(false)
                // Trigger manual entry callback if provided
                if (onManualEntry) {
                  onManualEntry()
                }
                // Don't refocus the input as it might interfere with manual URL input state
              }}
              className="w-full text-left p-2 rounded bg-white border border-green-300 hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-1"
            >
              <div className="flex items-center gap-2">
                <div className="flex-shrink-0 w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                  <Plus className="h-3 w-3 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-green-800">Continue with "{query.trim()}"</p>
                  <p className="text-xs text-green-600">Get URL from business.google.com or Google search</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* No results message with manual entry option */}
      {showDropdown && businesses.length === 0 && query.trim().length > 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="text-center mb-3">
            <p className="text-sm text-gray-600">No businesses found for "{query.trim()}"</p>
            <p className="text-xs text-gray-500 mt-1">
              Try searching with different terms, or use manual entry below
            </p>
          </div>

          <div className="border-t pt-3">
            <p className="text-xs font-medium text-gray-700 mb-2">
              Can't find your business? This often happens with:
            </p>
            <ul className="text-xs text-gray-600 space-y-1 mb-3">
              <li>• Service-area businesses (SAB) like tradesmen</li>
              <li>• Home-based businesses</li>
              <li>• New businesses not yet indexed</li>
              <li>• Businesses with different names in Google</li>
            </ul>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowDropdown(false)
                // Focus back to input for manual entry
                inputRef.current?.focus()
              }}
              className="w-full text-green-600 border-green-300 hover:bg-green-50"
            >
              Continue with Manual Entry
            </Button>

            <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
              <p className="font-medium text-gray-700 mb-1">Next step:</p>
              <p>You'll get your Google Reviews URL from:</p>
              <p>• <strong>business.google.com</strong> → "Ask for reviews"</p>
              <p>• Or Google search → "[Your Business] reviews"</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}