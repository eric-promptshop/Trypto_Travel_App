"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search, 
  Filter, 
  Star, 
  MapPin, 
  DollarSign, 
  Plus, 
  Heart,
  Loader2,
  TrendingUp,
  Clock,
  Users,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'sonner'
import { useTourTracking, useTourListTracking } from '@/hooks/use-tour-tracking'

interface Tour {
  id: string
  name: string
  description: string
  location: string
  city: string
  country: string
  coordinates?: {
    lat: number
    lng: number
  }
  price: number
  currency: string
  duration: number // hours
  images: string[]
  included: string[]
  excluded: string[]
  highlights: string[]
  maxParticipants: number
  operatorName: string
  operatorId?: string
  rating: number
  reviews: number
  availability: string[]
  category: string
  matchScore: number
  featured: boolean
  verified?: boolean
  instantBooking?: boolean
  cancellationPolicy?: string
}

interface TourDiscoveryPanelProps {
  destination: string
  coordinates?: { lat: number; lng: number }
  interests?: string[]
  duration?: number
  travelers?: number
  budget?: number
  onAddTour: (tour: Tour) => void
  onTourSelect?: (tour: Tour) => void
  className?: string
}

export function TourDiscoveryPanel({
  destination,
  coordinates,
  interests = [],
  duration,
  travelers,
  budget,
  onAddTour,
  onTourSelect,
  className
}: TourDiscoveryPanelProps) {
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<'match' | 'rating' | 'price'>('match')
  const [error, setError] = useState<string | null>(null)

  const categories = [
    { id: 'all', label: 'All Places', icon: Star },
    { id: 'attractions', label: 'Attractions', icon: MapPin },
    { id: 'restaurants', label: 'Food & Drink', icon: Heart },
    { id: 'culture', label: 'Culture', icon: TrendingUp },
    { id: 'entertainment', label: 'Entertainment', icon: MapPin },
    { id: 'shopping', label: 'Shopping', icon: MapPin }
  ]

  // Fetch tours on mount and when criteria change
  useEffect(() => {
    if (destination) {
      loadPlaces()
    }
  }, [destination, interests, duration, travelers, budget, selectedCategory])

  const loadPlaces = async () => {
    setLoading(true)
    setError(null)
    
    try {
      // First, try to load operator tours
      const toursResponse = await fetch('/api/tours/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          destination,
          interests,
          duration,
          travelers,
          budget,
          category: selectedCategory === 'all' ? undefined : selectedCategory
        })
      })
      
      let operatorTours: Tour[] = []
      
      if (toursResponse.ok) {
        const toursData = await toursResponse.json()
        operatorTours = toursData.tours || []
      }
      
      // Then load Google Places to supplement
      const placesResponse = await fetch('/api/places/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: destination,
          coordinates,
          interests,
          category: selectedCategory === 'all' ? 'all' : selectedCategory,
          radius: 10000,
          limit: 50 - operatorTours.length // Limit Google results based on operator tours
        })
      })
      
      let googlePlaces: Tour[] = []
      
      if (placesResponse.ok) {
        const placesData = await placesResponse.json()
        
        if (placesData.places && placesData.places.length > 0) {
          // Convert Google Places data to tour format
          googlePlaces = placesData.places.map((place: any) => ({
            id: place.id,
            name: place.name,
            description: place.description || `Experience ${place.name} in ${destination}`,
            location: place.location?.address || destination,
            city: place.location?.city || destination,
            country: place.location?.country || 'Unknown',
            coordinates: place.location?.coordinates ? {
              lat: place.location.coordinates.latitude,
              lng: place.location.coordinates.longitude
            } : undefined,
            price: place.priceLevel ? place.priceLevel * 50 : Math.floor(Math.random() * 200) + 50,
            currency: 'USD',
            duration: place.category === 'restaurants' ? 2 : 3,
            images: place.imageUrl ? [place.imageUrl] : [`https://source.unsplash.com/400x300/?${place.category},${destination}`],
            included: ['Entry tickets', 'Experience'],
            excluded: ['Transportation', 'Personal expenses'],
            highlights: [
              place.name,
              place.location?.city || destination,
              place.category || 'attraction'
            ],
            maxParticipants: 15,
            operatorName: 'Google Places',
            rating: place.rating || 4.0,
            reviews: place.reviewCount || Math.floor(Math.random() * 100) + 10,
            availability: [
              new Date().toISOString().split('T')[0],
              new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
              new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString().split('T')[0]
            ],
            category: place.category || 'attraction',
            matchScore: place.relevanceScore || 3.0, // Lower score for Google Places
            featured: false // Only operator tours can be featured
          }))
        }
      }
      
      // Merge results, prioritizing operator tours
      const allTours = [...operatorTours, ...googlePlaces]
      
      if (allTours.length > 0) {
        setTours(allTours)
      } else {
        // Use demo data when no real data available
        const demoData = generateDemoToursForDestination(destination, selectedCategory)
        setTours(demoData)
      }
    } catch (error) {
      console.error('Error loading places:', error)
      setError('Failed to load places. Showing demo content.')
      // Use demo data on error
      const demoData = generateDemoToursForDestination(destination, selectedCategory)
      setTours(demoData)
    } finally {
      setLoading(false)
    }
  }

  // Generate demo tours based on destination
  const generateDemoToursForDestination = (dest: string, category: string): Tour[] => {
    const baseTours = [
      {
        id: '1',
        name: `${dest} Historic Walking Tour`,
        description: `Explore the historic heart of ${dest} with a knowledgeable local guide`,
        location: `Historic District, ${dest}`,
        city: dest,
        country: 'France',
        price: 45,
        currency: 'USD',
        duration: 3,
        images: [`https://source.unsplash.com/400x300/?${dest},historic`],
        included: ['Professional guide', 'Historic insights', 'Walking map'],
        excluded: ['Transportation', 'Food & drinks', 'Gratuities'],
        highlights: ['UNESCO sites', 'Local stories', 'Photo opportunities'],
        maxParticipants: 12,
        operatorName: 'City Heritage Tours',
        rating: 4.8,
        reviews: 124,
        availability: ['Today', 'Tomorrow'],
        category: 'culture',
        matchScore: 4.5,
        featured: true
      },
      {
        id: '2',
        name: `${dest} Food & Culture Experience`,
        description: `Taste authentic ${dest} cuisine while discovering local culture and traditions`,
        location: `Food Quarter, ${dest}`,
        city: dest,
        country: 'France',
        price: 75,
        currency: 'USD',
        duration: 4,
        images: [`https://source.unsplash.com/400x300/?${dest},food`],
        included: ['Food tastings', 'Cultural guide', 'Recipe cards'],
        excluded: ['Full meals', 'Transportation', 'Drinks'],
        highlights: ['Local markets', 'Traditional recipes', 'Chef interactions'],
        maxParticipants: 8,
        operatorName: 'Taste Local',
        rating: 4.9,
        reviews: 89,
        availability: ['Tomorrow'],
        category: 'restaurants',
        matchScore: 4.2,
        featured: false
      },
      {
        id: '3',
        name: `${dest} Attraction Pass`,
        description: `Skip-the-line access to ${dest}'s most popular attractions and landmarks`,
        location: `City Center, ${dest}`,
        city: dest,
        country: 'France',
        price: 95,
        currency: 'USD',
        duration: 6,
        images: [`https://source.unsplash.com/400x300/?${dest},landmarks`],
        included: ['Skip-the-line tickets', 'Audio guide', 'Transportation'],
        excluded: ['Personal guide', 'Food', 'Souvenirs'],
        highlights: ['Priority access', 'Multiple attractions', 'Audio commentary'],
        maxParticipants: 25,
        operatorName: 'Premium Access',
        rating: 4.6,
        reviews: 256,
        availability: ['Today', 'Tomorrow'],
        category: 'attractions',
        matchScore: 4.0,
        featured: false
      }
    ]

    // Filter by category if specified
    if (category !== 'all') {
      return baseTours.filter(tour => tour.category === category)
    }
    
    return baseTours
  }

  // Filter and sort tours
  const filteredTours = tours
    .filter(tour => {
      const matchesSearch = tour.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           tour.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = selectedCategory === 'all' || tour.category === selectedCategory
      return matchesSearch && matchesCategory
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'rating':
          return b.rating - a.rating
        case 'price':
          return a.price - b.price
        case 'match':
        default:
          return b.matchScore - a.matchScore
      }
    })
  
  // Tour tracking hooks
  const { trackTourInteraction } = useTourTracking()
  const { registerTourRef } = useTourListTracking(
    filteredTours, 
    'discovery_panel', 
    searchQuery
  )

  const handleAddTour = async (tour: Tour) => {
    try {
      // Generate lead when tour is added (only for verified operator tours)
      if (tour.operatorName !== 'Google Places' && tour.operatorName !== 'Local Partner') {
        const leadResponse = await fetch('/api/tours/generate-lead', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tourId: tour.id,
            tourName: tour.name,
            operatorName: tour.operatorName,
            operatorId: tour.operatorId,
            travelerInfo: {
              travelers: travelers || 2,
              preferredDate: tour.availability[0] // First available date
            },
            itineraryContext: {
              destination,
              duration: duration || 7,
              totalBudget: budget,
              travelDates: {
                startDate: new Date().toISOString().split('T')[0],
                endDate: new Date(Date.now() + (duration || 7) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
              },
              interests
            },
            leadSource: 'skeleton_itinerary'
          })
        })

        if (leadResponse.ok) {
          const leadData = await leadResponse.json()
          console.log('Lead generated:', leadData)
        }
      }
      
      // Track the interaction
      await trackTourInteraction(tour, 'add_to_itinerary', {
        destination,
        source: 'discovery_panel'
      })

      onAddTour(tour)
      toast.success(`Added "${tour.name}" to your itinerary!`)
    } catch (error) {
      console.error('Error adding place:', error)
      toast.error('Failed to add place. Please try again.')
    }
  }

  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg">Discover Places</CardTitle>
          <Badge variant="secondary" className="text-xs">
            {destination}
          </Badge>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search places & experiences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-9"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 mt-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                <Filter className="h-3 w-3" />
                {categories.find(c => c.id === selectedCategory)?.label}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>Category</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {categories.map(category => (
                <DropdownMenuItem
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className="gap-2"
                >
                  <category.icon className="h-4 w-4" />
                  {category.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2">
                Sort: {sortBy === 'match' ? 'Best Match' : sortBy === 'rating' ? 'Rating' : 'Price'}
                <ChevronDown className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSortBy('match')}>
                Best Match
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('rating')}>
                Highest Rated
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('price')}>
                Lowest Price
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-gray-400 mb-3" />
            <p className="text-sm text-gray-500">Finding amazing places for you...</p>
          </div>
        ) : error ? (
          <div className="text-center py-12">
            <p className="text-sm text-red-600 mb-3">{error}</p>
            <Button variant="outline" size="sm" onClick={loadPlaces}>
              Try Again
            </Button>
          </div>
        ) : filteredTours.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500 mb-2">No places found</p>
            <p className="text-xs text-gray-400">Try adjusting your search or filters</p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {filteredTours.map((tour, index) => (
              <TourCard
                key={tour.id}
                tour={tour}
                position={index + 1}
                onAdd={() => handleAddTour(tour)}
                onSelect={() => onTourSelect?.(tour)}
                registerRef={registerTourRef}
              />
            ))}
          </AnimatePresence>
        )}
      </CardContent>
      
      {/* Browse More Tours Link */}
      <div className="border-t p-4">
        <Button 
          variant="outline" 
          className="w-full group"
          onClick={() => {
            // Save current itinerary state before navigating
            if (typeof window !== 'undefined') {
              sessionStorage.setItem('returnToItinerary', 'true')
              sessionStorage.setItem('itineraryDestination', destination)
              window.location.href = `/tours?destination=${encodeURIComponent(destination)}`
            }
          }}
        >
          <span>Browse Template Library for {destination}</span>
          <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Button>
      </div>
    </Card>
  )
}

// Tour Card Component (based on PlaceCardWithImage pattern)
function TourCard({ 
  tour, 
  position,
  onAdd,
  onSelect,
  registerRef 
}: { 
  tour: Tour
  position: number
  onAdd: () => void
  onSelect?: () => void
  registerRef: (tourId: string, element: HTMLElement | null) => void
}) {
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(true)

  useEffect(() => {
    const loadImage = async () => {
      if (tour.images && tour.images.length > 0) {
        setImageUrl(tour.images[0])
        setImageLoading(false)
      } else {
        // Fallback to search-based image
        try {
          const response = await fetch(
            `/api/images/location?location=${encodeURIComponent(tour.name + ' ' + tour.location)}&width=120&height=80`
          )
          const data = await response.json()
          setImageUrl(data.url || `https://source.unsplash.com/120x80/?${encodeURIComponent(tour.category)},tour`)
        } catch {
          setImageUrl(`https://source.unsplash.com/120x80/?${encodeURIComponent(tour.category)},tour`)
        }
        setImageLoading(false)
      }
    }
    loadImage()
  }, [tour.images, tour.name, tour.location, tour.category])

  return (
    <motion.div
      ref={(el) => registerRef(tour.id, el)}
      data-tour-id={tour.id}
      data-position={position}
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: 1.02 }}
      className="relative rounded-lg border bg-white p-3 cursor-pointer transition-all hover:shadow-md group"
      onClick={onSelect}
    >
      <div className="flex gap-3">
        {/* Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
          {imageLoading ? (
            <div className="w-full h-full animate-pulse bg-gray-200" />
          ) : (
            <img 
              src={imageUrl || ''}
              alt={tour.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          )}
          {tour.featured && (
            <div className="absolute top-1 left-1">
              <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700 px-1">
                Featured
              </Badge>
            </div>
          )}
          {tour.operatorName !== 'Google Places' && tour.operatorName !== 'Local Partner' && (
            <div className="absolute top-1 right-1">
              <Badge variant="secondary" className="text-xs bg-green-100 text-green-700 px-1">
                Verified Tour
              </Badge>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-tight">
            {tour.name}
          </h3>
          
          {/* Rating and reviews */}
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs font-medium">{tour.rating.toFixed(1)}</span>
            </div>
            <span className="text-xs text-gray-500">({tour.reviews})</span>
          </div>
          
          {/* Details */}
          <div className="flex items-center gap-2 mt-1 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{tour.duration}h</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              <span>Max {tour.maxParticipants}</span>
            </div>
          </div>
          
          {/* Price and operator */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col">
              <span className="text-xs text-gray-500">by {tour.operatorName}</span>
              {tour.availability && tour.availability.length > 0 && (
                <span className="text-xs text-green-600 font-medium">
                  Available {new Date(tour.availability[0]).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
            <div className="text-right">
              <div className="flex items-center gap-1 font-medium justify-end">
                <DollarSign className="h-3 w-3" />
                <span className="text-sm">{tour.price}</span>
                <span className="text-xs text-gray-500">{tour.currency}</span>
              </div>
              {tour.instantBooking && (
                <Badge variant="outline" className="text-xs px-1 py-0 mt-1 border-green-300 text-green-700">
                  Instant Booking
                </Badge>
              )}
            </div>
          </div>
        </div>
        
        {/* Add button */}
        <Button
          size="sm"
          onClick={(e) => {
            e.stopPropagation()
            onAdd()
          }}
          className="absolute top-2 right-2 h-8 w-8 p-0 bg-blue-600 hover:bg-blue-700 opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Highlights preview */}
      {tour.highlights && tour.highlights.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100">
          <div className="flex flex-wrap gap-1">
            {tour.highlights.slice(0, 3).map((highlight, index) => (
              <Badge key={index} variant="outline" className="text-xs px-2 py-0">
                {highlight}
              </Badge>
            ))}
            {tour.highlights.length > 3 && (
              <Badge variant="outline" className="text-xs px-2 py-0">
                +{tour.highlights.length - 3} more
              </Badge>
            )}
          </div>
        </div>
      )}
    </motion.div>
  )
} 