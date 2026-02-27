import { Star } from 'lucide-react'

interface RatingDisplayProps {
  rating: number
  maxRating?: number
  showNumber?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function RatingDisplay({
  rating,
  maxRating = 5,
  showNumber = true,
  size = 'md',
  className = ''
}: RatingDisplayProps) {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  }

  const getRatingColor = (starIndex: number) => {
    if (starIndex <= rating) {
      // Filled stars
      if (rating <= 2) {
        return 'text-red-500'
      } else if (rating <= 3) {
        return 'text-orange-500'
      } else {
        return 'text-yellow-500'
      }
    }
    // Empty stars
    return 'text-gray-300'
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: maxRating }, (_, index) => {
          const starNumber = index + 1
          const isFilled = starNumber <= rating

          return (
            <Star
              key={index}
              className={`${sizeClasses[size]} ${getRatingColor(starNumber)} ${
                isFilled ? 'fill-current' : ''
              }`}
            />
          )
        })}
      </div>

      {showNumber && (
        <span className={`font-medium ${textSizeClasses[size]} ${
          rating <= 2
            ? 'text-red-600'
            : rating <= 3
            ? 'text-orange-600'
            : 'text-yellow-600'
        }`}>
          {rating}/{maxRating}
        </span>
      )}
    </div>
  )
}