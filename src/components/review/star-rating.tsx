'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

interface StarRatingProps {
  onRatingSelect: (rating: number) => void
  selectedRating: number | null
}

export function StarRating({ onRatingSelect, selectedRating }: StarRatingProps) {
  const [hoveredRating, setHoveredRating] = useState<number | null>(null)

  const handleStarClick = (rating: number) => {
    onRatingSelect(rating)
  }

  const handleStarHover = (rating: number) => {
    setHoveredRating(rating)
  }

  const handleStarLeave = () => {
    setHoveredRating(null)
  }

  return (
    <div className="flex justify-center gap-2">
      {[1, 2, 3, 4, 5].map((rating) => {
        const isActive = hoveredRating
          ? rating <= hoveredRating
          : selectedRating
          ? rating <= selectedRating
          : false

        return (
          <button
            key={rating}
            onClick={() => handleStarClick(rating)}
            onMouseEnter={() => handleStarHover(rating)}
            onMouseLeave={handleStarLeave}
            className={`
              p-2 rounded-full transition-all duration-200 transform
              hover:scale-110 active:scale-95
              focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
              ${isActive ? 'text-yellow-400' : 'text-gray-300'}
            `}
            aria-label={`Rate ${rating} star${rating !== 1 ? 's' : ''}`}
          >
            <Star
              className={`w-12 h-12 transition-all duration-200 ${
                isActive ? 'fill-current' : 'fill-none'
              }`}
              strokeWidth={2}
            />
          </button>
        )
      })}
    </div>
  )
}