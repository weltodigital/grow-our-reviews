'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Search, MapPin, Star, Users, Check } from 'lucide-react'

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
}

export default function BusinessSearch({
  value,
  onBusinessSelect,
  onBusinessNameChange,
  placeholder = "Search for your business...",
  label = "Business Name",
  helperText,
  required = false,
  disabled = false
}: BusinessSearchProps) {
  const [query, setQuery] = useState(value)
  const [businesses, setBusinesses] = useState<Business[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [showDropdown, setShowDropdown] = useState(false)
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [error, setError] = useState('')

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
        throw new Error(data.error || 'Failed to search businesses')
      }

      setBusinesses(data.businesses || [])
      setShowDropdown(true)
    } catch (err: any) {
      console.error('Business search error:', err)
      setError(err.message || 'Failed to search businesses')
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
    setShowDropdown(false)
    onBusinessNameChange(business.name)
    onBusinessSelect(business)
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

      {/* Selected business confirmation */}
      {selectedBusiness && (
        <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-3">
            <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-900">{selectedBusiness.name}</p>
              <p className="text-xs text-green-700">{selectedBusiness.address}</p>
              {selectedBusiness.rating && (
                <div className="flex items-center gap-1 mt-1">
                  <Star className="h-3 w-3 text-yellow-500 fill-current" />
                  <span className="text-xs text-green-700">
                    {selectedBusiness.rating.toFixed(1)} ({selectedBusiness.userRatingsTotal} reviews)
                  </span>
                </div>
              )}
              <p className="text-xs text-green-600 mt-1">
                ✓ Google Reviews URL configured automatically
              </p>
            </div>
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
              className="w-full text-left p-3 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 focus:outline-none focus:bg-gray-50"
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
        </div>
      )}

      {/* No results message */}
      {showDropdown && businesses.length === 0 && query.trim().length > 2 && !isLoading && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center">
          <p className="text-sm text-gray-600">No businesses found for "{query.trim()}"</p>
          <p className="text-xs text-gray-500 mt-1">
            Try searching with just the business name or location
          </p>
        </div>
      )}
    </div>
  )
}