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
import { PlaceFiltersComponent, PlaceFilters } from './PlaceFilters'
import { PlaceCardWithImage } from './PlaceCardWithImage'
import { toast } from 'sonner'

// Calculate distance between two points in kilometers
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371 // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLon = (lon2 - lon1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

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
  console.log('[fetchPlaces] Called with:', { searchQuery, category, lat, lng });
  
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
    
    console.log('[fetchPlaces] Fetching from:', `/api/places/search?${params}`);
    const response = await fetch(`/api/places/search?${params}`)
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[fetchPlaces] Response error:', response.status, errorText);
      throw new Error('Failed to fetch places')
    }
    
    const data = await response.json()
    console.log('[fetchPlaces] Received data:', data);
    return data.places || []
  } catch (error) {
    console.error('[fetchPlaces] Error:', error)
    return []
  }
}

export function ModernExploreSidebar() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [pois, setPois] = useState<POI[]>([])
  const [filteredPois, setFilteredPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [filters, setFilters] = useState<PlaceFilters>({})
  const [showAIRecommendations, setShowAIRecommendations] = useState(false)
  const [aiRecommendations, setAiRecommendations] = useState<any[]>([])
  const [loadingAI, setLoadingAI] = useState(false)
  
  const debouncedSearchQuery = useDebounce(searchQuery, 500)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  const { 
    highlightPoi, 
    selectPoi, 
    selectedPoiId,
    highlightedPoiId,
    mapCenter,
    setSearchPois,
    getSelectedDay,
    addPoiToDay,
    itinerary
  } = usePlanStore()
  
  // Load AI recommendations
  const loadAIRecommendations = async () => {
    if (!itinerary) return
    
    setLoadingAI(true)
    try {
      const selectedDay = getSelectedDay()
      const existingActivities = selectedDay?.slots?.map(slot => {
        const poi = itinerary.pois.find(p => p.id === slot.poiId)
        return poi?.name || ''
      }).filter(Boolean) || []
      
      const response = await fetch('/api/explore/recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination: itinerary.destination,
          interests: [], // Could be populated from user preferences
          dayInfo: selectedDay ? {
            dayNumber: selectedDay.dayNumber,
            existingActivities
          } : undefined,
          category: selectedCategory || undefined
        })
      })
      
      if (!response.ok) throw new Error('Failed to get recommendations')
      
      const data = await response.json()
      setAiRecommendations(data.recommendations || [])
    } catch (error) {
      console.error('Error loading AI recommendations:', error)
      setError('Failed to load AI recommendations')
    } finally {
      setLoadingAI(false)
    }
  }
  
  // Load places when category or search changes
  useEffect(() => {
    const loadPlaces = async () => {
      console.log('[ModernExploreSidebar] loadPlaces called:', {
        selectedCategory,
        debouncedSearchQuery,
        mapCenter
      });
      
      if (!selectedCategory && !debouncedSearchQuery) {
        setPois([])
        setPage(1)
        setHasMore(true)
        return
      }
      
      setLoading(true)
      setError(null)
      setPage(1)
      setHasMore(true)
      
      try {
        const places = await fetchPlaces(
          debouncedSearchQuery,
          selectedCategory,
          mapCenter[0],
          mapCenter[1]
        )
        setPois(places)
        setHasMore(places.length >= 20)
      } catch (err) {
        setError('Failed to load places. Please try again.')
        setPois([])
      } finally {
        setLoading(false)
      }
    }
    
    loadPlaces()
  }, [selectedCategory, debouncedSearchQuery, mapCenter])
  
  // Apply filters to POIs
  useEffect(() => {
    let filtered = [...pois]
    
    // Filter by price range
    if (filters.priceRange) {
      filtered = filtered.filter(poi => 
        poi.price && 
        poi.price >= filters.priceRange![0] && 
        poi.price <= filters.priceRange![1]
      )
    }
    
    // Filter by minimum rating
    if (filters.minRating) {
      filtered = filtered.filter(poi => 
        poi.rating && poi.rating >= filters.minRating!
      )
    }
    
    // Filter by maximum distance
    if (filters.maxDistance && mapCenter) {
      filtered = filtered.filter(poi => {
        const distance = calculateDistance(
          mapCenter[0], mapCenter[1],
          poi.location.lat, poi.location.lng
        )
        return distance <= filters.maxDistance!
      })
    }
    
    setFilteredPois(filtered)
    // Update search POIs in store for map display
    setSearchPois(filtered)
  }, [pois, filters, mapCenter, setSearchPois])
  
  // Load more places when scrolling
  const loadMorePlaces = useCallback(async () => {
    if (loadingMore || !hasMore || (!selectedCategory && !searchQuery)) return
    
    setLoadingMore(true)
    
    try {
      // For demo purposes, we'll just show "no more results" after page 2
      // In a real app, you'd implement proper pagination in the API
      if (page >= 2) {
        setHasMore(false)
        return
      }
      
      const morePlaces = await fetchPlaces(
        searchQuery,
        selectedCategory,
        mapCenter[0],
        mapCenter[1]
      )
      
      // Filter out duplicates
      const existingIds = new Set(pois.map(p => p.id))
      const newPlaces = morePlaces.filter(p => !existingIds.has(p.id))
      
      setPois(prev => [...prev, ...newPlaces])
      setPage(prev => prev + 1)
      setHasMore(newPlaces.length >= 10)
    } catch (err) {
      console.error('Error loading more places:', err)
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, hasMore, selectedCategory, searchQuery, page, pois, mapCenter])
  
  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (loading) return
    
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting && hasMore && !loadingMore) {
        loadMorePlaces()
      }
    }
    
    observerRef.current = new IntersectionObserver(handleObserver, {
      root: null,
      rootMargin: '100px',
      threshold: 0
    })
    
    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current)
    }
    
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [loading, hasMore, loadingMore, loadMorePlaces])
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Explore</h2>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={showAIRecommendations ? "default" : "outline"}
              onClick={async () => {
                setShowAIRecommendations(!showAIRecommendations)
                if (!showAIRecommendations && aiRecommendations.length === 0) {
                  await loadAIRecommendations()
                }
              }}
              className="gap-1"
            >
              <Sparkles className="h-3 w-3" />
              AI Guide
            </Button>
            <PlaceFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
            />
          </div>
        </div>
        
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
          {/* AI Recommendations Section */}
          {showAIRecommendations && (
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-sm">AI Recommendations</h3>
              </div>
              
              {loadingAI ? (
                <div className="space-y-3">
                  {[...Array(3)].map((_, i) => (
                    <Skeleton key={`ai-${i}`} className="h-24 w-full rounded-lg" />
                  ))}
                </div>
              ) : aiRecommendations.length > 0 ? (
                <div className="space-y-3">
                  {aiRecommendations.map((rec, index) => (
                    <div 
                      key={`ai-rec-${index}`}
                      className="p-3 rounded-lg bg-purple-50 border border-purple-200 space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{rec.name}</h4>
                          <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                        </div>
                        <span className="text-xs font-medium text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
                          {rec.priceRange || '$'}
                        </span>
                      </div>
                      
                      {rec.whyRecommended && (
                        <p className="text-xs text-purple-700 italic">
                          ✨ {rec.whyRecommended}
                        </p>
                      )}
                      
                      {rec.localTip && (
                        <p className="text-xs text-gray-600">
                          💡 <span className="font-medium">Tip:</span> {rec.localTip}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between pt-2">
                        <span className="text-xs text-gray-500">
                          {rec.bestTimeToVisit} • {rec.estimatedDuration}
                        </span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs"
                          onClick={() => {
                            // Convert AI recommendation to POI format
                            const poi: POI = {
                              id: `ai-${Date.now()}-${index}`,
                              name: rec.name,
                              category: rec.category || 'attraction',
                              location: {
                                lat: mapCenter[0] + (Math.random() - 0.5) * 0.01,
                                lng: mapCenter[1] + (Math.random() - 0.5) * 0.01,
                                address: rec.location?.area || ''
                              },
                              description: rec.description,
                              rating: 4.5,
                              price: rec.priceRange?.length || 2
                            }
                            
                            const selectedDay = getSelectedDay()
                            if (selectedDay) {
                              addPoiToDay(poi, selectedDay.id)
                              toast.success(`Added ${poi.name} to Day ${selectedDay.dayNumber}`)
                            } else {
                              toast.error('Please select a day first')
                            }
                          }}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <p className="text-sm">No recommendations yet</p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={loadAIRecommendations}
                    className="mt-2"
                  >
                    Get Recommendations
                  </Button>
                </div>
              )}
              
              <div className="mt-4 border-t pt-4">
                <h3 className="font-semibold text-sm mb-3">Browse Places</h3>
              </div>
            </div>
          )}
          
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
          ) : filteredPois.length > 0 ? (
            // Place cards
            filteredPois.map((poi) => {
              const categoryConfig = CATEGORIES.find(c => c.id === poi.category)
              return (
                <PlaceCardWithImage
                  key={poi.id}
                  poi={poi}
                  isSelected={selectedPoiId === poi.id}
                  isHighlighted={highlightedPoiId === poi.id}
                  onMouseEnter={() => highlightPoi(poi.id)}
                  onMouseLeave={() => highlightPoi(null)}
                  onClick={() => selectPoi(poi.id)}
                  onAdd={() => {
                    const selectedDay = getSelectedDay()
                    if (selectedDay) {
                      addPoiToDay(poi, selectedDay.id)
                      toast.success(`Added ${poi.name} to ${selectedDay.dayNumber ? `Day ${selectedDay.dayNumber}` : 'itinerary'}`)
                    } else {
                      toast.error('Please select a day first')
                    }
                  }}
                  categoryConfig={categoryConfig ? {
                    icon: categoryConfig.icon,
                    label: categoryConfig.label,
                    color: categoryConfig.color
                  } : undefined}
                />
              )
            })
          ) : pois.length > 0 && filteredPois.length === 0 ? (
            // No results after filtering
            <div className="text-center py-8 text-gray-500">
              <p className="text-sm">No places match your filters</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({})}
                className="mt-2"
              >
                Clear filters
              </Button>
            </div>
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
          
          {/* Infinite scroll trigger */}
          {hasMore && !loading && filteredPois.length > 0 && (
            <div ref={loadMoreRef} className="h-10 flex items-center justify-center">
              {loadingMore && (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Loading more...</span>
                </div>
              )}
            </div>
          )}
          
          {/* No more results */}
          {!hasMore && filteredPois.length > 0 && (
            <p className="text-center text-sm text-gray-500 py-4">
              No more places to show
            </p>
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