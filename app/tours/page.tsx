'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  Search, 
  Filter, 
  MapPin, 
  Calendar, 
  Users, 
  DollarSign,
  Globe,
  Clock,
  ChevronDown,
  Loader2,
  Grid3X3,
  List,
  Map as MapIcon,
  X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import dynamic from 'next/dynamic'

// Lazy load components for better performance
const TourCard = dynamic(() => import('@/components/tours/TourCard').then(mod => mod.TourCard), {
  loading: () => <div className="h-96 animate-pulse bg-gray-200 rounded-lg" />
})
const TourFilters = dynamic(() => import('@/components/tours/TourFilters').then(mod => mod.TourFilters))
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAnalytics } from '@/lib/analytics/analytics-service'

// Tour categories
const CATEGORIES = [
  { value: 'all', label: 'All Tours', icon: Globe },
  { value: 'adventure', label: 'Adventure', icon: MapPin },
  { value: 'cultural', label: 'Cultural', icon: MapPin },
  { value: 'food', label: 'Food & Wine', icon: MapPin },
  { value: 'nature', label: 'Nature', icon: MapPin },
  { value: 'city', label: 'City Tours', icon: MapPin },
  { value: 'water', label: 'Water Activities', icon: MapPin },
]

// Popular destinations
const POPULAR_DESTINATIONS = [
  'Paris, France',
  'Rome, Italy',
  'Tokyo, Japan',
  'New York, USA',
  'Barcelona, Spain',
  'Dubai, UAE',
  'London, UK',
  'Sydney, Australia'
]

interface Tour {
  id: string
  name: string
  description: string
  destination: string
  city: string
  country: string
  price: number
  currency: string
  duration: number
  images: string[]
  rating: number
  reviews: number
  operatorName: string
  featured: boolean
  instantBooking: boolean
  category: string
}

export default function TourLibraryPage() {
  const router = useRouter()
  const { track } = useAnalytics()
  const [tours, setTours] = useState<Tour[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedDestination, setSelectedDestination] = useState('')
  const [priceRange, setPriceRange] = useState([0, 500])
  const [duration, setDuration] = useState<string>('all')
  const [sortBy, setSortBy] = useState('featured')
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showFilters, setShowFilters] = useState(false)

  // Track page view
  useEffect(() => {
    track('tour_library_viewed', {
      initial_category: selectedCategory,
      initial_destination: selectedDestination
    })
  }, [])

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput)
      setPage(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchInput])

  // Fetch tours
  const fetchTours = useCallback(async () => {
    setLoading(true)
    
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '12',
        ...(searchQuery && { search: searchQuery }),
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
        ...(selectedDestination && { destination: selectedDestination }),
        minPrice: priceRange[0].toString(),
        maxPrice: priceRange[1].toString(),
        ...(duration !== 'all' && { duration }),
        sortBy
      })

      const response = await fetch(`/api/tours/public?${params}`, {
        // Add cache headers for better performance
        headers: {
          'Cache-Control': 'max-age=60, stale-while-revalidate=300',
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to fetch tours')
      }

      const data = await response.json()
      setTours(data.tours || [])
      setTotalPages(Math.ceil(data.total / 12))
      
    } catch (error) {
      console.error('Error fetching tours:', error)
      toast.error('Failed to load tours')
      // Load demo data as fallback
      setTours(generateDemoTours())
    } finally {
      setLoading(false)
    }
  }, [page, searchQuery, selectedCategory, selectedDestination, priceRange, duration, sortBy])

  useEffect(() => {
    fetchTours()
  }, [fetchTours])

  // Generate demo tours
  const generateDemoTours = (): Tour[] => {
    const demoTours: Tour[] = []
    const tourNames = [
      'Historic City Walking Tour',
      'Sunset Boat Cruise',
      'Food Market Experience',
      'Mountain Adventure Trek',
      'Cultural Heritage Tour',
      'Wine Tasting Journey',
      'Photography Workshop',
      'Beach & Snorkel Tour'
    ]

    POPULAR_DESTINATIONS.forEach((destination, destIndex) => {
      tourNames.slice(0, 3).forEach((name, nameIndex) => {
        demoTours.push({
          id: `demo-${destIndex}-${nameIndex}`,
          name: `${destination} ${name}`,
          description: `Experience the best of ${destination} with our expert local guides. This carefully curated tour offers unique insights and unforgettable moments.`,
          destination,
          city: destination.split(',')[0],
          country: destination.split(',')[1]?.trim() || '',
          price: 50 + Math.floor(Math.random() * 200),
          currency: 'USD',
          duration: 2 + Math.floor(Math.random() * 6),
          images: [`https://source.unsplash.com/400x300/?${destination},tourism`],
          rating: 4.0 + Math.random() * 1.0,
          reviews: Math.floor(Math.random() * 300) + 20,
          operatorName: `${destination.split(',')[0]} Tours`,
          featured: Math.random() > 0.7,
          instantBooking: Math.random() > 0.5,
          category: ['adventure', 'cultural', 'food', 'nature'][Math.floor(Math.random() * 4)]
        })
      })
    })

    return demoTours
  }

  const handleTourClick = (tourId: string) => {
    const tour = tours.find(t => t.id === tourId)
    track('tour_card_clicked', {
      tour_id: tourId,
      tour_name: tour?.name,
      tour_price: tour?.price,
      tour_operator: tour?.operatorName,
      source: 'tour_library',
      search_query: searchQuery,
      category: selectedCategory,
      destination: selectedDestination
    })
    router.push(`/tours/${tourId}`)
  }

  const handleStartPlanning = (tour: Tour) => {
    track('tour_start_planning_clicked', {
      tour_id: tour.id,
      tour_name: tour.name,
      tour_price: tour.price,
      tour_operator: tour.operatorName,
      source: 'tour_library',
      destination: tour.destination
    })
    // Store tour in session storage
    sessionStorage.setItem('selectedTour', JSON.stringify(tour))
    // Redirect to planning page
    router.push(`/plan?destination=${encodeURIComponent(tour.destination)}`)
  }

  // Track search
  useEffect(() => {
    if (searchQuery) {
      const timeoutId = setTimeout(() => {
        track('tour_search_performed', {
          search_query: searchQuery,
          category: selectedCategory,
          destination: selectedDestination,
          results_count: tours.length
        })
      }, 500) // Debounce search tracking
      return () => clearTimeout(timeoutId)
    }
  }, [searchQuery, selectedCategory, selectedDestination, tours.length, track])

  // Track filter changes
  const handleCategoryChange = (newCategory: string) => {
    setSelectedCategory(newCategory)
    track('tour_filter_changed', {
      filter_type: 'category',
      filter_value: newCategory,
      previous_value: selectedCategory
    })
  }

  const handleDestinationSelect = (destination: string) => {
    setSelectedDestination(destination)
    setPage(1)
    track('tour_filter_changed', {
      filter_type: 'destination',
      filter_value: destination
    })
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    track('tour_sort_changed', {
      sort_by: newSort,
      previous_sort: sortBy
    })
  }

  // Add structured data for tour listing
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "Tours and Travel Experiences",
    "description": "Discover curated tours and experiences from trusted local operators worldwide",
    "numberOfItems": tours.length,
    "itemListElement": tours.map((tour, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "item": {
        "@type": "Product",
        "name": tour.name,
        "description": tour.description,
        "image": tour.images[0],
        "offers": {
          "@type": "Offer",
          "price": tour.price,
          "priceCurrency": tour.currency
        },
        "aggregateRating": {
          "@type": "AggregateRating",
          "ratingValue": tour.rating,
          "reviewCount": tour.reviews
        }
      }
    }))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Add structured data script */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 md:py-16">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4">
            Tour Template Library
          </h1>
          <p className="text-lg sm:text-xl mb-6 md:mb-8 text-blue-100">
            Browse reusable tour templates to inspire your perfect trip. Select any template to customize and plan your journey.
          </p>
          
          {/* Search Bar */}
          <div className="bg-white rounded-lg shadow-lg p-2 max-w-3xl">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search tours or destinations..."
                  className="pl-10 h-12 border-0 text-gray-900"
                />
              </div>
              <Select value={selectedCategory} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-full md:w-48 h-12 border-0 text-gray-900">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                size="lg" 
                className="h-12 px-8 bg-blue-600 hover:bg-blue-700"
                onClick={() => setPage(1)}
              >
                Search Tours
              </Button>
            </div>
          </div>

          {/* Popular Destinations */}
          <div className="mt-6 md:mt-8">
            <p className="text-sm mb-3 text-blue-100">Popular destinations:</p>
            <div className="flex flex-wrap gap-2">
              {POPULAR_DESTINATIONS.slice(0, 6).map(dest => (
                <Button
                  key={dest}
                  variant="outline"
                  size="sm"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs sm:text-sm"
                  onClick={() => handleDestinationSelect(dest)}
                >
                  {dest}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Filters and Results */}
      <section className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        {/* Filter Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2 sm:gap-4 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="gap-2"
              size="sm"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </Button>
            
            {/* Mobile tour count */}
            <Badge variant="secondary" className="sm:hidden">{tours.length} tours</Badge>
            
            <div className="hidden md:flex items-center gap-2">
              <Badge variant="secondary">{tours.length} tours</Badge>
              {selectedDestination && (
                <Badge 
                  variant="outline" 
                  className="gap-1 cursor-pointer"
                  onClick={() => setSelectedDestination('')}
                >
                  {selectedDestination}
                  <X className="h-3 w-3" />
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Sort */}
            <Select value={sortBy} onValueChange={handleSortChange}>
              <SelectTrigger className="flex-1 sm:flex-none sm:w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="featured">Featured</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="price_high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="popular">Most Popular</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode */}
            <div className="hidden md:flex items-center gap-1 border rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="p-2"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="p-2"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                className="p-2"
              >
                <MapIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Filters Sidebar (collapsible) */}
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="mb-6"
          >
            <TourFilters
              priceRange={priceRange}
              onPriceChange={setPriceRange}
              duration={duration}
              onDurationChange={setDuration}
              onApplyFilters={() => setPage(1)}
            />
          </motion.div>
        )}

        {/* Results Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-4 space-y-2">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              </Card>
            ))}
          </div>
        ) : tours.length === 0 ? (
          <div className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No tours found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your filters or search criteria</p>
            <Button 
              variant="outline"
              onClick={() => {
                setSearchQuery('')
                setSelectedCategory('all')
                setSelectedDestination('')
                setPriceRange([0, 500])
                setDuration('all')
                setPage(1)
              }}
            >
              Clear all filters
            </Button>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {tours.map(tour => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    onClick={() => handleTourClick(tour.id)}
                    onStartPlanning={() => handleStartPlanning(tour)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'list' && (
              <div className="space-y-4">
                {tours.map(tour => (
                  <TourCard
                    key={tour.id}
                    tour={tour}
                    variant="list"
                    onClick={() => handleTourClick(tour.id)}
                    onStartPlanning={() => handleStartPlanning(tour)}
                  />
                ))}
              </div>
            )}

            {viewMode === 'map' && (
              <div className="h-[600px] bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-600">Map view coming soon</p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center mt-8 gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <div className="flex items-center gap-1">
                  {[...Array(Math.min(5, totalPages))].map((_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  )
}