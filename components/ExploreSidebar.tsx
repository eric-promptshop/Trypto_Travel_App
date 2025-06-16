"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  MapPin, 
  Star, 
  DollarSign,
  Coffee,
  Utensils,
  ShoppingBag,
  Camera,
  Building,
  Trees,
  Car,
  X,
  ChevronDown
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { usePlanStore, POI } from '@/store/planStore'
import { AddToDayButton } from './AddToDayButton'

// Category configuration
const CATEGORIES = [
  { id: 'restaurant', label: 'Restaurants', icon: Utensils, color: 'text-orange-600' },
  { id: 'attraction', label: 'Attractions', icon: Camera, color: 'text-blue-600' },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag, color: 'text-purple-600' },
  { id: 'hotel', label: 'Hotels', icon: Building, color: 'text-green-600' },
  { id: 'nature', label: 'Nature', icon: Trees, color: 'text-emerald-600' },
  { id: 'transport', label: 'Transport', icon: Car, color: 'text-gray-600' },
  { id: 'cafe', label: 'Cafes', icon: Coffee, color: 'text-amber-600' }
]

interface ExploreSidebarProps {
  isDrawer?: boolean
  onClose?: () => void
}

export function ExploreSidebar({ isDrawer = false, onClose }: ExploreSidebarProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'rating' | 'distance' | 'price'>('rating')
  const [pois, setPois] = useState<POI[]>([])
  const [loading, setLoading] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [page, setPage] = useState(1)
  
  const observerRef = useRef<IntersectionObserver | null>(null)
  const loadMoreRef = useRef<HTMLDivElement>(null)
  
  const { 
    highlightPoi, 
    selectPoi, 
    selectedPoiId,
    highlightedPoiId,
    mapCenter,
    itinerary 
  } = usePlanStore()
  
  // Fetch POIs (mock implementation - replace with actual API)
  const fetchPois = useCallback(async (pageNum: number, category?: string | null, search?: string) => {
    setLoading(true)
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock data generation
      const mockPois: POI[] = Array.from({ length: 10 }, (_, i) => {
        const index = (pageNum - 1) * 10 + i
        const categories = ['restaurant', 'attraction', 'shopping', 'hotel'] as const
        const selectedCat = category || categories[index % categories.length]
        
        return {
          id: `poi-${index}`,
          name: `${selectedCat.charAt(0).toUpperCase() + selectedCat.slice(1)} ${index + 1}`,
          category: selectedCat as POI['category'],
          location: {
            lat: mapCenter[0] + (Math.random() - 0.5) * 0.05,
            lng: mapCenter[1] + (Math.random() - 0.5) * 0.05,
            address: `${index + 1} Example Street`
          },
          rating: 3.5 + Math.random() * 1.5,
          price: Math.floor(Math.random() * 4) + 1,
          description: `A wonderful ${selectedCat} in the heart of the city.`,
          tags: ['popular', 'recommended']
        }
      })
      
      if (pageNum === 1) {
        setPois(mockPois)
      } else {
        setPois(prev => [...prev, ...mockPois])
      }
      
      // Simulate end of data
      if (pageNum >= 5) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Error fetching POIs:', error)
    } finally {
      setLoading(false)
    }
  }, [mapCenter])
  
  // Initial load
  useEffect(() => {
    fetchPois(1, selectedCategory, searchQuery)
  }, [selectedCategory])
  
  // Search debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1)
      setHasMore(true)
      fetchPois(1, selectedCategory, searchQuery)
    }, 300)
    
    return () => clearTimeout(timer)
  }, [searchQuery])
  
  // Infinite scroll setup
  useEffect(() => {
    if (loading) return
    
    const handleObserver = (entries: IntersectionObserverEntry[]) => {
      const target = entries[0]
      if (target.isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1)
        fetchPois(page + 1, selectedCategory, searchQuery)
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
  }, [loading, hasMore, page, selectedCategory, searchQuery])
  
  // Sort POIs
  const sortedPois = [...pois].sort((a, b) => {
    switch (sortBy) {
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      case 'price':
        return (a.price || 0) - (b.price || 0)
      case 'distance':
        // Calculate distance from map center
        const distA = Math.sqrt(
          Math.pow(a.location.lat - mapCenter[0], 2) + 
          Math.pow(a.location.lng - mapCenter[1], 2)
        )
        const distB = Math.sqrt(
          Math.pow(b.location.lat - mapCenter[0], 2) + 
          Math.pow(b.location.lng - mapCenter[1], 2)
        )
        return distA - distB
      default:
        return 0
    }
  })
  
  return (
    <motion.div
      initial={isDrawer ? { x: -320 } : false}
      animate={isDrawer ? { x: 0 } : false}
      exit={isDrawer ? { x: -320 } : false}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className={cn(
        "flex flex-col bg-white",
        isDrawer ? "fixed left-0 top-0 h-full w-80 shadow-xl z-50" : "w-full h-full"
      )}
    >
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Explore</h2>
          {isDrawer && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search places..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Sort dropdown */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Sort by:</span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as typeof sortBy)}>
            <SelectTrigger className="w-32 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Rating</SelectItem>
              <SelectItem value="distance">Distance</SelectItem>
              <SelectItem value="price">Price</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {/* Categories */}
      <div className="px-4 py-3 border-b">
        <ScrollArea className="w-full" orientation="horizontal">
          <div className="flex gap-2 pb-1">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="flex-shrink-0"
            >
              All
            </Button>
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <Button
                  key={cat.id}
                  variant={selectedCategory === cat.id ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat.id)}
                  className="flex-shrink-0 gap-1"
                >
                  <Icon className={cn("h-3 w-3", cat.color)} />
                  {cat.label}
                </Button>
              )
            })}
          </div>
        </ScrollArea>
      </div>
      
      {/* POI List */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {sortedPois.map((poi) => (
            <POICard
              key={poi.id}
              poi={poi}
              isSelected={selectedPoiId === poi.id}
              isHighlighted={highlightedPoiId === poi.id}
              onMouseEnter={() => highlightPoi(poi.id)}
              onMouseLeave={() => highlightPoi(null)}
              onClick={() => selectPoi(poi.id)}
            />
          ))}
          
          {/* Loading indicator */}
          {loading && (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-32 w-full" />
              ))}
            </div>
          )}
          
          {/* Infinite scroll trigger */}
          {hasMore && !loading && (
            <div ref={loadMoreRef} className="h-10" />
          )}
          
          {/* No more results */}
          {!hasMore && pois.length > 0 && (
            <p className="text-center text-sm text-gray-500 py-4">
              No more places to show
            </p>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  )
}

// POI Card Component
interface POICardProps {
  poi: POI
  isSelected: boolean
  isHighlighted: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
}

function POICard({ 
  poi, 
  isSelected, 
  isHighlighted, 
  onMouseEnter, 
  onMouseLeave, 
  onClick 
}: POICardProps) {
  const category = CATEGORIES.find(c => c.id === poi.category)
  const Icon = category?.icon || MapPin
  
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        "relative rounded-lg border p-4 cursor-pointer transition-all",
        isSelected && "border-blue-500 bg-blue-50",
        isHighlighted && !isSelected && "border-orange-400 bg-orange-50",
        !isSelected && !isHighlighted && "border-gray-200 hover:border-gray-300"
      )}
    >
      {/* Mini map indicator */}
      <div className="absolute -right-1 -top-1 w-4 h-4 bg-white rounded-full shadow-sm flex items-center justify-center">
        <div className={cn(
          "w-2 h-2 rounded-full",
          isHighlighted ? "bg-orange-500" : "bg-blue-500"
        )} />
      </div>
      
      <div className="flex gap-3">
        {/* Icon */}
        <div className={cn(
          "w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0",
          isHighlighted ? "bg-orange-100" : "bg-gray-100"
        )}>
          <Icon className={cn("h-5 w-5", category?.color || "text-gray-600")} />
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 truncate">{poi.name}</h3>
          
          {/* Rating and price */}
          <div className="flex items-center gap-3 text-sm mt-1">
            {poi.rating && (
              <div className="flex items-center gap-1">
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
                <span>{poi.rating.toFixed(1)}</span>
              </div>
            )}
            {poi.price && (
              <div className="flex items-center">
                {[...Array(4)].map((_, i) => (
                  <DollarSign
                    key={i}
                    className={cn(
                      "h-3 w-3",
                      i < poi.price ? "text-gray-700" : "text-gray-300"
                    )}
                  />
                ))}
              </div>
            )}
          </div>
          
          {/* Description */}
          {poi.description && (
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {poi.description}
            </p>
          )}
          
          {/* Tags */}
          {poi.tags && poi.tags.length > 0 && (
            <div className="flex gap-1 mt-2">
              {poi.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
        
        {/* Add button */}
        <AddToDayButton poi={poi} />
      </div>
    </motion.div>
  )
}