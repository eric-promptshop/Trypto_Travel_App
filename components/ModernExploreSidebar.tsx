"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Search,
  Palette,
  Building2,
  Wine,
  Coffee,
  UtensilsCrossed,
  Hotel,
  Camera,
  ShoppingBag,
  Sparkles,
  Car,
  Plus,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { usePlanStore, POI } from '@/store/planStore'
import Image from 'next/image'
import { useDebounce } from '@/hooks/useDebounce'

// Category configuration matching the design
const CATEGORIES = [
  { id: 'art-museums', label: 'Art & Museums', icon: Building2, color: 'text-purple-600' },
  { id: 'bars-nightlife', label: 'Bars & Nightlife', icon: Wine, color: 'text-pink-600' },
  { id: 'cafe-bakery', label: 'Cafe & Bakery', icon: Coffee, color: 'text-amber-600' },
  { id: 'restaurants', label: 'Restaurants', icon: UtensilsCrossed, color: 'text-orange-600' },
  { id: 'hotels', label: 'Hotels', icon: Hotel, color: 'text-green-600' },
  { id: 'attractions', label: 'Attractions', icon: Camera, color: 'text-blue-600' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-purple-600' },
  { id: 'beauty-fashion', label: 'Beauty & Fashion', icon: Sparkles, color: 'text-pink-600' },
  { id: 'transport', label: 'Transport', icon: Car, color: 'text-gray-600' }
]

// Fetch places from API
async function fetchPlaces(
  searchQuery?: string, 
  category?: string | null,
  lat?: number,
  lng?: number
): Promise<POI[]> {
  try {
    const params = new URLSearchParams()
    
    if (searchQuery) {
      params.append('query', searchQuery)
    }
    if (category) {
      params.append('category', category)
    }
    if (lat && lng) {
      params.append('lat', lat.toString())
      params.append('lng', lng.toString())
    }
    params.append('limit', '20')
    
    const response = await fetch(`/api/places/search?${params}`)
    
    if (!response.ok) {
      throw new Error('Failed to fetch places')
    }
    
    const data = await response.json()
    return data.places || []
  } catch (error) {
    console.error('Error fetching places:', error)
    return []
  }
}

export function ModernExploreSidebar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  
  const { 
    highlightPoi, 
    selectPoi, 
    selectedPoiId,
    highlightedPoiId,
    mapCenter
  } = usePlanStore()
  
  // Load places when category or search changes
  useEffect(() => {
    const loadPlaces = async () => {
      if (!selectedCategory && !debouncedSearchQuery) {
        setPois([])
        return
      }
      
      setLoading(true)
      setError(null)
      
      try {
        const places = await fetchPlaces(
          debouncedSearchQuery,
          selectedCategory,
          mapCenter[0],
          mapCenter[1]
        )
        setPois(places)
      } catch (err) {
        setError('Failed to load places. Please try again.')
        setPois([])
      } finally {
        setLoading(false)
      }
    }
    
    loadPlaces()
  }, [selectedCategory, debouncedSearchQuery, mapCenter])
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-3">
        <h2 className="text-xl font-semibold">Explore</h2>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search a place"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-gray-50 border-gray-200"
          />
        </div>
      </div>
      
      {/* Categories Grid */}
      <div className="px-4 pb-4">
        <div className="grid grid-cols-3 gap-2">
          {CATEGORIES.map((category) => {
            const Icon = category.icon
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  "flex flex-col items-center gap-2 p-3 rounded-lg transition-all",
                  selectedCategory === category.id
                    ? "bg-gray-100 shadow-sm"
                    : "hover:bg-gray-50"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center",
                  selectedCategory === category.id ? "bg-white" : "bg-gray-100"
                )}>
                  <Icon className={cn("h-5 w-5", category.color)} />
                </div>
                <span className="text-xs font-medium text-gray-700 text-center leading-tight">
                  {category.label}
                </span>
              </button>
            )
          })}
        </div>
      </div>
      
      {/* Places List */}
      <ScrollArea className="flex-1 px-4">
        <div className="space-y-3 pb-4">
          {loading ? (
            // Loading skeletons
            <>
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full rounded-lg" />
              ))}
            </>
          ) : error ? (
            // Error state
            <div className="text-center py-8">
              <p className="text-sm text-red-600 mb-2">{error}</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setError(null)
                  // Retry logic
                  if (selectedCategory || searchQuery) {
                    const loadPlaces = async () => {
                      setLoading(true)
                      try {
                        const places = await fetchPlaces(
                          searchQuery,
                          selectedCategory,
                          mapCenter[0],
                          mapCenter[1]
                        )
                        setPois(places)
                      } catch (err) {
                        setError('Failed to load places. Please try again.')
                      } finally {
                        setLoading(false)
                      }
                    }
                    loadPlaces()
                  }
                }}
              >
                Try Again
              </Button>
            </div>
          ) : pois.length > 0 ? (
            // Place cards
            pois.map((poi) => (
              <PlaceCard
                key={poi.id}
                poi={poi}
                isSelected={selectedPoiId === poi.id}
                isHighlighted={highlightedPoiId === poi.id}
                onMouseEnter={() => highlightPoi(poi.id)}
                onMouseLeave={() => highlightPoi(null)}
                onClick={() => selectPoi(poi.id)}
              />
            ))
          ) : selectedCategory || searchQuery ? (
            // Empty state
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No places found</p>
              {searchQuery && (
                <p className="text-xs mt-1">Try a different search term</p>
              )}
            </div>
          ) : (
            // Select category prompt
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">Select a category or search for places</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  )
}

// Place Card Component
interface PlaceCardProps {
  poi: POI & { image?: string; reviews?: number }
  isSelected: boolean
  isHighlighted: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
}

function PlaceCard({ 
  poi, 
  isSelected, 
  isHighlighted, 
  onMouseEnter, 
  onMouseLeave, 
  onClick 
}: PlaceCardProps) {
  const categoryConfig = CATEGORIES.find(c => c.id === poi.category)
  const Icon = categoryConfig?.icon || Camera
  
  // Format price with dollar signs
  const priceDisplay = poi.price ? '$'.repeat(poi.price) : ''
  
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
          {poi.image ? (
            <img 
              src={poi.image} 
              alt={poi.name}
              className="w-full h-full object-cover"
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
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-yellow-600">★</span>
              <span className="text-xs font-medium">{poi.rating?.toFixed(1)}</span>
            </div>
            {poi.reviews && (
              <span className="text-xs text-gray-500">({poi.reviews.toLocaleString()})</span>
            )}
          </div>
          
          {/* Category and price */}
          <div className="flex items-center gap-2 mt-1">
            <Icon className={cn("h-3 w-3", categoryConfig?.color)} />
            <span className="text-xs text-gray-600">{categoryConfig?.label}</span>
            {priceDisplay && (
              <>
                <span className="text-xs text-gray-400">•</span>
                <span className="text-xs font-medium">{priceDisplay}</span>
              </>
            )}
          </div>
        </div>
        
        {/* Add button */}
        <button
          className="absolute top-2 right-2 w-8 h-8 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center justify-center transition-colors"
          onClick={(e) => {
            e.stopPropagation()
            // Add to day logic here
          }}
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  )
}