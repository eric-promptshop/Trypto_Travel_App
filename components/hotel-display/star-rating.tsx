"use client"

import React, { useState } from 'react'
import { Star, StarHalf } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface StarRatingProps {
  rating: number
  maxStars?: number
  size?: 'sm' | 'md' | 'lg'
  interactive?: boolean
  showRating?: boolean
  className?: string | undefined
  onChange?: (newRating: number) => void
}

export const StarRating: React.FC<StarRatingProps> = ({
  rating,
  maxStars = 5,
  size = 'md',
  interactive = false,
  showRating = true,
  className,
  onChange
}) => {
  const [hoverRating, setHoverRating] = useState<number | null>(null)

  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }

  const effectiveRating = hoverRating !== null ? hoverRating : rating

  const handleStarClick = (starIndex: number) => {
    if (interactive && onChange) {
      const newRating = starIndex + 1
      onChange(newRating)
    }
  }

  const handleStarHover = (starIndex: number) => {
    if (interactive) {
      setHoverRating(starIndex + 1)
    }
  }

  const handleMouseLeave = () => {
    if (interactive) {
      setHoverRating(null)
    }
  }

  const renderStar = (index: number) => {
    const starValue = index + 1
    const filled = effectiveRating >= starValue
    const halfFilled = effectiveRating >= starValue - 0.5 && effectiveRating < starValue

    return (
      <div
        key={index}
        className={cn(
          'relative inline-block transition-transform duration-150',
          interactive && 'cursor-pointer hover:scale-110'
        )}
        onClick={() => handleStarClick(index)}
        onMouseEnter={() => handleStarHover(index)}
        role={interactive ? 'button' : undefined}
        tabIndex={interactive ? 0 : undefined}
        aria-label={interactive ? `Rate ${starValue} star${starValue > 1 ? 's' : ''}` : undefined}
        onKeyDown={(e) => {
          if (interactive && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault()
            handleStarClick(index)
          }
        }}
      >
        {/* Background star (empty) */}
        <Star 
          className={cn(
            sizeClasses[size],
            'text-gray-300'
          )}
        />
        
        {/* Filled star overlay */}
        {(filled || halfFilled) && (
          <Star 
            className={cn(
              sizeClasses[size],
              'absolute top-0 left-0 text-yellow-400 fill-current',
              halfFilled && 'opacity-50'
            )}
            style={halfFilled ? { clipPath: 'inset(0 50% 0 0)' } : undefined}
          />
        )}
      </div>
    )
  }

  return (
    <div 
      className={cn('flex items-center gap-1', className)}
      onMouseLeave={handleMouseLeave}
      role={interactive ? 'radiogroup' : 'img'}
      aria-label={interactive ? 'Star rating' : `${rating} out of ${maxStars} stars`}
    >
      <div className="flex items-center">
        {Array.from({ length: maxStars }, (_, index) => renderStar(index))}
      </div>
      
      {showRating && (
        <span className={cn(
          'ml-1 font-medium text-gray-700',
          textSizeClasses[size]
        )}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

export default StarRating 