"use client"

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Plus, Star, MapPin } from 'lucide-react'
import type { POI } from '@/store/planStore'

interface PlaceCardWithImageProps {
  poi: POI & { reviews?: number }
  isSelected: boolean
  isHighlighted: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  onAdd?: () => void
  categoryConfig?: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    color: string
  }
}

export function PlaceCardWithImage({ 
  poi, 
  isSelected, 
  isHighlighted, 
  onMouseEnter, 
  onMouseLeave, 
  onClick,
  onAdd,
  categoryConfig
}: PlaceCardWithImageProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)
  
  const Icon = categoryConfig?.icon || MapPin
  
  // Format price with dollar signs
  const priceDisplay = poi.price ? '$'.repeat(poi.price) : ''
  
  useEffect(() => {
    const fetchImage = async () => {
      setImageLoading(true)
      try {
        // Build search query for better image results
        const searchQuery = `${poi.name} ${poi.location?.address || ''}`
        const response = await fetch(
          `/api/images/location?location=${encodeURIComponent(searchQuery)}&width=160&height=160`
        )
        const data = await response.json()
        
        if (data.url) {
          setImageUrl(data.url)
        }
      } catch (error) {
        console.error('Error fetching image for POI:', error)
        // Use fallback image
        setImageUrl(`https://source.unsplash.com/160x160/?${encodeURIComponent(poi.name)},${poi.category}`)
      } finally {
        setImageLoading(false)
      }
    }
    
    fetchImage()
  }, [poi.name, poi.location?.address, poi.category])
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        "relative rounded-lg border bg-white p-3 cursor-pointer transition-all",
        isSelected && "ring-2 ring-blue-500 border-blue-500",
        isHighlighted && !isSelected && "ring-2 ring-orange-400 border-orange-400",
        !isSelected && !isHighlighted && "border-gray-200 hover:border-gray-300 hover:shadow-sm"
      )}
    >
      <div className="flex gap-3">
        {/* Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {imageLoading ? (
            <div className="w-full h-full animate-pulse bg-gray-200" />
          ) : imageUrl ? (
            <img 
              src={imageUrl} 
              alt={poi.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Icon className={cn("h-8 w-8", categoryConfig?.color || "text-gray-400")} />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-1">{poi.name}</h3>
          
          {/* Rating and reviews */}
          {poi.rating && (
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                <span className="text-xs font-medium">{poi.rating.toFixed(1)}</span>
              </div>
              {poi.reviews && (
                <span className="text-xs text-gray-500">({poi.reviews.toLocaleString()})</span>
              )}
            </div>
          )}
          
          {/* Category and price */}
          <div className="flex items-center gap-2 mt-1">
            <Icon className={cn("h-3 w-3", categoryConfig?.color)} />
            <span className="text-xs text-gray-600">{categoryConfig?.label || poi.category}</span>
            {priceDisplay && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs font-medium">{priceDisplay}</span>
              </>
            )}
          </div>
          
          {/* Address */}
          {poi.location?.address && (
            <p className="text-xs text-gray-500 line-clamp-1 mt-1">
              {poi.location.address}
            </p>
          )}
        </div>
        
        {/* Add button */}
        {onAdd && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              onAdd()
            }}
            className="absolute top-2 right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors"
          >
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </motion.div>
  )
}