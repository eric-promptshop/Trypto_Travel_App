"use client"

import * as React from "react"
import { Heart, MapPin, Star, ChevronDown, Filter, SlidersHorizontal, Eye, Users, Wifi, Car, Coffee, Dumbbell, Waves, Calendar, DollarSign } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface Accommodation {
  id: string
  name: string
  starRating: 1 | 2 | 3 | 4 | 5
  type: 'hotel' | 'resort' | 'apartment' | 'guesthouse' | 'hostel' | 'villa'
  description: string
  imageUrl: string
  imageUrls: string[]
  location: {
    address: string
    city: string
    coordinates: [number, number] // [lat, lng]
  }
  pricing: {
    currency: string
    pricePerNight: number
    totalPrice: number
    taxesAndFees: number
    discountPercent?: number
  }
  amenities: string[]
  features: {
    freeWifi: boolean
    parking: boolean
    breakfast: boolean
    gym: boolean
    pool: boolean
    spa: boolean
    airConditioning: boolean
    petFriendly: boolean
    businessCenter: boolean
    roomService: boolean
  }
  roomTypes: Array<{
    id: string
    name: string
    capacity: number
    bedConfiguration: string
    size: string
    pricePerNight: number
  }>
  ratings: {
    overall: number
    cleanliness: number
    service: number
    location: number
    value: number
    reviewCount: number
  }
  policies: {
    checkIn: string
    checkOut: string
    cancellation: string
    deposit?: string
  }
  availability: boolean
  distanceFromCenter?: number
}

interface AccommodationFilters {
  starRating: number[]
  type: string[]
  priceRange: [number, number]
  amenities: string[]
  guestRating: [number, number]
  distanceFromCenter: number
}

interface AccommodationSelectorProps {
  destination: string
  checkInDate?: Date
  checkOutDate?: Date
  guests: number
  onAccommodationSelect: (accommodation: Accommodation) => void
  selectedAccommodation?: Accommodation | undefined
  onFiltersChange?: (filters: AccommodationFilters) => void
  disabled?: boolean
  className?: string
}

// Mock accommodation data - in real app, this would come from API
const mockAccommodations: Accommodation[] = [
  {
    id: '1',
    name: 'The Grand Palace Hotel',
    starRating: 5,
    type: 'hotel',
    description: 'Luxury 5-star hotel in the heart of the city with stunning views and world-class amenities.',
    imageUrl: '/api/placeholder/400/250',
    imageUrls: ['/api/placeholder/400/250', '/api/placeholder/400/250', '/api/placeholder/400/250'],
    location: {
      address: '123 Grand Avenue',
      city: 'Paris',
      coordinates: [48.8566, 2.3522]
    },
    pricing: {
      currency: 'EUR',
      pricePerNight: 350,
      totalPrice: 1050,
      taxesAndFees: 105,
      discountPercent: 15
    },
    amenities: ['Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Room Service'],
    features: {
      freeWifi: true,
      parking: true,
      breakfast: true,
      gym: true,
      pool: true,
      spa: true,
      airConditioning: true,
      petFriendly: false,
      businessCenter: true,
      roomService: true
    },
    roomTypes: [
      {
        id: 'deluxe',
        name: 'Deluxe Room',
        capacity: 2,
        bedConfiguration: '1 King Bed',
        size: '35 sqm',
        pricePerNight: 350
      },
      {
        id: 'suite',
        name: 'Executive Suite',
        capacity: 4,
        bedConfiguration: '1 King Bed + Sofa Bed',
        size: '55 sqm',
        pricePerNight: 550
      }
    ],
    ratings: {
      overall: 4.6,
      cleanliness: 4.7,
      service: 4.5,
      location: 4.8,
      value: 4.2,
      reviewCount: 1247
    },
    policies: {
      checkIn: '15:00',
      checkOut: '11:00',
      cancellation: 'Free cancellation until 24 hours before check-in'
    },
    availability: true,
    distanceFromCenter: 0.5
  },
  {
    id: '2',
    name: 'Modern City Apartment',
    starRating: 4,
    type: 'apartment',
    description: 'Stylish modern apartment with full kitchen and great location near public transport.',
    imageUrl: '/api/placeholder/400/250',
    imageUrls: ['/api/placeholder/400/250', '/api/placeholder/400/250'],
    location: {
      address: '456 Metro Street',
      city: 'Paris',
      coordinates: [48.8566, 2.3522]
    },
    pricing: {
      currency: 'EUR',
      pricePerNight: 180,
      totalPrice: 540,
      taxesAndFees: 54
    },
    amenities: ['Free WiFi', 'Kitchen', 'Washing Machine', 'Balcony'],
    features: {
      freeWifi: true,
      parking: false,
      breakfast: false,
      gym: false,
      pool: false,
      spa: false,
      airConditioning: true,
      petFriendly: true,
      businessCenter: false,
      roomService: false
    },
    roomTypes: [
      {
        id: 'apartment',
        name: '1-Bedroom Apartment',
        capacity: 4,
        bedConfiguration: '1 Queen Bed + Sofa Bed',
        size: '65 sqm',
        pricePerNight: 180
      }
    ],
    ratings: {
      overall: 4.3,
      cleanliness: 4.4,
      service: 4.1,
      location: 4.5,
      value: 4.6,
      reviewCount: 892
    },
    policies: {
      checkIn: '16:00',
      checkOut: '10:00',
      cancellation: 'Free cancellation until 48 hours before check-in'
    },
    availability: true,
    distanceFromCenter: 1.2
  },
  {
    id: '3',
    name: 'Budget Traveler Inn',
    starRating: 3,
    type: 'hostel',
    description: 'Clean and comfortable hostel perfect for budget travelers with shared and private rooms.',
    imageUrl: '/api/placeholder/400/250',
    imageUrls: ['/api/placeholder/400/250'],
    location: {
      address: '789 Backpacker Lane',
      city: 'Paris',
      coordinates: [48.8566, 2.3522]
    },
    pricing: {
      currency: 'EUR',
      pricePerNight: 45,
      totalPrice: 135,
      taxesAndFees: 13.5
    },
    amenities: ['Free WiFi', 'Shared Kitchen', 'Laundry', 'Common Room'],
    features: {
      freeWifi: true,
      parking: false,
      breakfast: true,
      gym: false,
      pool: false,
      spa: false,
      airConditioning: false,
      petFriendly: false,
      businessCenter: false,
      roomService: false
    },
    roomTypes: [
      {
        id: 'private',
        name: 'Private Room',
        capacity: 2,
        bedConfiguration: '1 Double Bed',
        size: '15 sqm',
        pricePerNight: 45
      },
      {
        id: 'shared',
        name: 'Shared Dormitory',
        capacity: 6,
        bedConfiguration: '6 Bunk Beds',
        size: '25 sqm',
        pricePerNight: 25
      }
    ],
    ratings: {
      overall: 4.1,
      cleanliness: 4.0,
      service: 4.2,
      location: 4.3,
      value: 4.5,
      reviewCount: 567
    },
    policies: {
      checkIn: '14:00',
      checkOut: '11:00',
      cancellation: 'Non-refundable'
    },
    availability: true,
    distanceFromCenter: 2.1
  }
]

// Star Rating Component
const StarRating: React.FC<{
  rating: number
  maxRating?: number
  size?: 'sm' | 'md' | 'lg'
  showValue?: boolean
  className?: string
}> = ({ rating, maxRating = 5, size = 'md', showValue = true, className }) => {
  const sizeClasses = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {Array.from({ length: maxRating }, (_, i) => (
        <Star
          key={i}
          className={cn(
            sizeClasses[size],
            i < Math.floor(rating) 
              ? "fill-yellow-400 text-yellow-400" 
              : i < rating 
                ? "fill-yellow-200 text-yellow-400" 
                : "text-gray-300"
          )}
        />
      ))}
      {showValue && (
        <span className="text-sm text-gray-600 ml-1">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  )
}

// Star Rating Filter Component
const StarRatingFilter: React.FC<{
  selectedRatings: number[]
  onRatingChange: (ratings: number[]) => void
  className?: string
}> = ({ selectedRatings, onRatingChange, className }) => {
  const handleRatingToggle = (rating: number) => {
    if (selectedRatings.includes(rating)) {
      onRatingChange(selectedRatings.filter(r => r !== rating))
    } else {
      onRatingChange([...selectedRatings, rating])
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">Star Rating</Label>
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((rating) => (
          <div key={rating} className="flex items-center space-x-2">
            <Checkbox
              id={`rating-${rating}`}
              checked={selectedRatings.includes(rating)}
              onCheckedChange={() => handleRatingToggle(rating)}
            />
            <Label
              htmlFor={`rating-${rating}`}
              className="flex items-center gap-2 cursor-pointer"
            >
              <StarRating rating={rating} showValue={false} size="sm" />
              <span className="text-sm">{rating} stars</span>
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

// Accommodation Card Component
const AccommodationCard: React.FC<{
  accommodation: Accommodation
  onSelect: (accommodation: Accommodation) => void
  onFavoriteToggle: (id: string) => void
  isFavorite: boolean
  isSelected: boolean
  viewMode: 'grid' | 'list'
  showComparison?: boolean
  className?: string
}> = ({ 
  accommodation, 
  onSelect, 
  onFavoriteToggle, 
  isFavorite, 
  isSelected, 
  viewMode,
  showComparison = false,
  className 
}) => {
  const [isHovered, setIsHovered] = React.useState(false)

  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  const getDiscountedPrice = () => {
    if (accommodation.pricing.discountPercent) {
      return accommodation.pricing.pricePerNight * (1 - accommodation.pricing.discountPercent / 100)
    }
    return accommodation.pricing.pricePerNight
  }

  const cardContent = (
    <Card 
      className={cn(
        "cursor-pointer transition-all duration-200 hover:shadow-lg",
        isSelected && "ring-2 ring-blue-500",
        viewMode === 'list' && "flex",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onSelect(accommodation)}
    >
      <div className={cn(
        "relative",
        viewMode === 'list' ? "w-48 flex-shrink-0" : "w-full"
      )}>
        <img
          src={accommodation.imageUrl}
          alt={accommodation.name}
          className={cn(
            "object-cover",
            viewMode === 'list' ? "w-full h-32" : "w-full h-48"
          )}
        />
        
        {/* Favorite Button */}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-8 w-8 p-0 bg-white/80 hover:bg-white"
          onClick={(e) => {
            e.stopPropagation()
            onFavoriteToggle(accommodation.id)
          }}
        >
          <Heart
            className={cn(
              "h-4 w-4",
              isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
            )}
          />
        </Button>

        {/* Discount Badge */}
        {accommodation.pricing.discountPercent && (
          <Badge className="absolute top-2 left-2 bg-red-500 text-white">
            -{accommodation.pricing.discountPercent}%
          </Badge>
        )}

        {/* Star Rating Badge */}
        <div className="absolute bottom-2 left-2 bg-white/90 rounded px-2 py-1">
          <StarRating 
            rating={accommodation.starRating} 
            showValue={false} 
            size="sm"
          />
        </div>
      </div>

      <div className={cn(
        "p-4",
        viewMode === 'list' && "flex-1"
      )}>
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-lg leading-tight">
              {accommodation.name}
            </h3>
            <p className="text-sm text-gray-600 capitalize">
              {accommodation.type}
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              {accommodation.pricing.discountPercent && (
                <span className="text-sm text-gray-500 line-through">
                  {formatPrice(accommodation.pricing.pricePerNight, accommodation.pricing.currency)}
                </span>
              )}
              <span className="font-bold text-lg">
                {formatPrice(getDiscountedPrice(), accommodation.pricing.currency)}
              </span>
            </div>
            <p className="text-xs text-gray-600">per night</p>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-2">
          <MapPin className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-600">
            {accommodation.location.address}
          </span>
          {accommodation.distanceFromCenter && (
            <span className="text-xs text-gray-500">
              ({accommodation.distanceFromCenter}km from center)
            </span>
          )}
        </div>

        <div className="flex items-center gap-4 mb-3">
          <StarRating 
            rating={accommodation.ratings.overall} 
            size="sm"
          />
          <span className="text-sm text-gray-600">
            ({accommodation.ratings.reviewCount} reviews)
          </span>
        </div>

        <p className="text-sm text-gray-700 mb-3 line-clamp-2">
          {accommodation.description}
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-1 mb-3">
          {accommodation.amenities.slice(0, 4).map((amenity) => (
            <Badge key={amenity} variant="secondary" className="text-xs">
              {amenity}
            </Badge>
          ))}
          {accommodation.amenities.length > 4 && (
            <Badge variant="outline" className="text-xs">
              +{accommodation.amenities.length - 4} more
            </Badge>
          )}
        </div>

        {/* Key Features */}
        <div className="flex gap-2 text-xs text-gray-600">
          {accommodation.features.freeWifi && <Wifi className="h-4 w-4" />}
          {accommodation.features.parking && <Car className="h-4 w-4" />}
          {accommodation.features.breakfast && <Coffee className="h-4 w-4" />}
          {accommodation.features.gym && <Dumbbell className="h-4 w-4" />}
          {accommodation.features.pool && <Waves className="h-4 w-4" />}
        </div>

        {viewMode === 'list' && (
          <div className="mt-3 pt-3 border-t">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">
                Total: {formatPrice(accommodation.pricing.totalPrice, accommodation.pricing.currency)}
                <span className="text-xs block">+ {formatPrice(accommodation.pricing.taxesAndFees, accommodation.pricing.currency)} taxes</span>
              </div>
              <Button
                className="h-8"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelect(accommodation)
                }}
              >
                Select
              </Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  )

  if (showComparison) {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <div>
            {cardContent}
          </div>
        </DialogTrigger>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{accommodation.name}</DialogTitle>
            <DialogDescription>
              Detailed accommodation information and booking options
            </DialogDescription>
          </DialogHeader>
          <AccommodationDetails accommodation={accommodation} onSelect={onSelect} />
        </DialogContent>
      </Dialog>
    )
  }

  return cardContent
}

// Accommodation Details Component
const AccommodationDetails: React.FC<{
  accommodation: Accommodation
  onSelect: (accommodation: Accommodation) => void
}> = ({ accommodation, onSelect }) => {
  const formatPrice = (price: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0
    }).format(price)
  }

  return (
    <div className="space-y-6">
      {/* Image Gallery */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2">
          <img
            src={accommodation.imageUrls[0] || accommodation.imageUrl}
            alt={accommodation.name}
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
        <div className="space-y-2">
          {accommodation.imageUrls.slice(1, 3).map((url, index) => (
            <img
              key={index}
              src={url}
              alt={`${accommodation.name} ${index + 2}`}
              className="w-full h-[calc(50%-4px)] object-cover rounded-lg"
            />
          ))}
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold text-lg mb-2">Overview</h3>
          <p className="text-gray-700 mb-4">{accommodation.description}</p>
          
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm">{accommodation.location.address}, {accommodation.location.city}</span>
            </div>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm">Up to {Math.max(...accommodation.roomTypes.map(r => r.capacity))} guests</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="font-semibold text-lg mb-2">Pricing</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span>Price per night</span>
              <span className="font-semibold">
                {formatPrice(accommodation.pricing.pricePerNight, accommodation.pricing.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center mb-2">
              <span>Total (3 nights)</span>
              <span className="font-semibold">
                {formatPrice(accommodation.pricing.totalPrice, accommodation.pricing.currency)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm text-gray-600">
              <span>Taxes & fees</span>
              <span>
                {formatPrice(accommodation.pricing.taxesAndFees, accommodation.pricing.currency)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Ratings */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Guest Ratings</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {Object.entries({
            'Overall': accommodation.ratings.overall,
            'Cleanliness': accommodation.ratings.cleanliness,
            'Service': accommodation.ratings.service,
            'Location': accommodation.ratings.location,
            'Value': accommodation.ratings.value
          }).map(([category, rating]) => (
            <div key={category} className="text-center">
              <div className="text-2xl font-bold text-blue-600">{rating.toFixed(1)}</div>
              <div className="text-sm text-gray-600">{category}</div>
            </div>
          ))}
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Based on {accommodation.ratings.reviewCount} reviews
        </p>
      </div>

      {/* Amenities */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Amenities</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {accommodation.amenities.map((amenity) => (
            <div key={amenity} className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-sm">{amenity}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Room Types */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Room Options</h3>
        <div className="space-y-3">
          {accommodation.roomTypes.map((room) => (
            <div key={room.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-medium">{room.name}</h4>
                  <p className="text-sm text-gray-600">{room.bedConfiguration}</p>
                  <p className="text-sm text-gray-600">{room.size} • Sleeps {room.capacity}</p>
                </div>
                <div className="text-right">
                  <div className="font-semibold">
                    {formatPrice(room.pricePerNight, accommodation.pricing.currency)}
                  </div>
                  <div className="text-sm text-gray-600">per night</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Policies */}
      <div>
        <h3 className="font-semibold text-lg mb-3">Policies</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p><strong>Check-in:</strong> {accommodation.policies.checkIn}</p>
            <p><strong>Check-out:</strong> {accommodation.policies.checkOut}</p>
          </div>
          <div>
            <p><strong>Cancellation:</strong> {accommodation.policies.cancellation}</p>
            {accommodation.policies.deposit && (
              <p><strong>Deposit:</strong> {accommodation.policies.deposit}</p>
            )}
          </div>
        </div>
      </div>

      {/* Select Button */}
      <div className="pt-4 border-t">
        <Button
          onClick={() => onSelect(accommodation)}
          className="w-full"
          size="lg"
        >
          Select This Accommodation
        </Button>
      </div>
    </div>
  )
}

// Main Accommodation Selector Component
export const AccommodationSelector: React.FC<AccommodationSelectorProps> = ({
  destination,
  checkInDate,
  checkOutDate,
  guests,
  onAccommodationSelect,
  selectedAccommodation,
  onFiltersChange,
  disabled = false,
  className
}) => {
  const [accommodations, setAccommodations] = React.useState<Accommodation[]>(mockAccommodations)
  const [filteredAccommodations, setFilteredAccommodations] = React.useState<Accommodation[]>(mockAccommodations)
  const [favorites, setFavorites] = React.useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [showFilters, setShowFilters] = React.useState(false)
  const [sortBy, setSortBy] = React.useState('recommended')
  const [searchQuery, setSearchQuery] = React.useState('')

  // Filters state
  const [filters, setFilters] = React.useState<AccommodationFilters>({
    starRating: [],
    type: [],
    priceRange: [0, 1000],
    amenities: [],
    guestRating: [0, 5],
    distanceFromCenter: 10
  })

  // Apply filters
  React.useEffect(() => {
    let filtered = accommodations.filter(accommodation => {
      // Star rating filter
      if (filters.starRating.length > 0 && !filters.starRating.includes(accommodation.starRating)) {
        return false
      }

      // Type filter
      if (filters.type.length > 0 && !filters.type.includes(accommodation.type)) {
        return false
      }

      // Price range filter
      if (accommodation.pricing.pricePerNight < filters.priceRange[0] || 
          accommodation.pricing.pricePerNight > filters.priceRange[1]) {
        return false
      }

      // Guest rating filter
      if (accommodation.ratings.overall < filters.guestRating[0] || 
          accommodation.ratings.overall > filters.guestRating[1]) {
        return false
      }

      // Distance filter
      if (accommodation.distanceFromCenter && accommodation.distanceFromCenter > filters.distanceFromCenter) {
        return false
      }

      // Amenities filter
      if (filters.amenities.length > 0) {
        const hasRequiredAmenities = filters.amenities.every(amenity => 
          accommodation.amenities.includes(amenity)
        )
        if (!hasRequiredAmenities) return false
      }

      // Search query
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          accommodation.name.toLowerCase().includes(searchLower) ||
          accommodation.description.toLowerCase().includes(searchLower) ||
          accommodation.location.address.toLowerCase().includes(searchLower) ||
          accommodation.amenities.some(amenity => amenity.toLowerCase().includes(searchLower))
        
        if (!matchesSearch) return false
      }

      return true
    })

    // Apply sorting
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.pricing.pricePerNight - b.pricing.pricePerNight)
        break
      case 'price-high':
        filtered.sort((a, b) => b.pricing.pricePerNight - a.pricing.pricePerNight)
        break
      case 'rating':
        filtered.sort((a, b) => b.ratings.overall - a.ratings.overall)
        break
      case 'distance':
        filtered.sort((a, b) => (a.distanceFromCenter || 0) - (b.distanceFromCenter || 0))
        break
      default: // recommended
        filtered.sort((a, b) => {
          // Sort by a combination of rating and value
          const aScore = a.ratings.overall * 0.6 + a.ratings.value * 0.4
          const bScore = b.ratings.overall * 0.6 + b.ratings.value * 0.4
          return bScore - aScore
        })
    }

    setFilteredAccommodations(filtered)
  }, [accommodations, filters, sortBy, searchQuery])

  // Notify parent of filter changes
  React.useEffect(() => {
    onFiltersChange?.(filters)
  }, [filters, onFiltersChange])

  const handleFavoriteToggle = (id: string) => {
    const newFavorites = new Set(favorites)
    if (newFavorites.has(id)) {
      newFavorites.delete(id)
    } else {
      newFavorites.add(id)
    }
    setFavorites(newFavorites)
  }

  const updateFilters = (newFilters: Partial<AccommodationFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      starRating: [],
      type: [],
      priceRange: [0, 1000],
      amenities: [],
      guestRating: [0, 5],
      distanceFromCenter: 10
    })
    setSearchQuery('')
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Accommodations in {destination}</h2>
          <p className="text-gray-600">
            {filteredAccommodations.length} properties available
            {checkInDate && checkOutDate && (
              <span>
                {' '} • {checkInDate.toLocaleDateString()} - {checkOutDate.toLocaleDateString()}
                {' '} • {guests} guest{guests !== 1 ? 's' : ''}
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recommended">Recommended</SelectItem>
              <SelectItem value="price-low">Price (Low to High)</SelectItem>
              <SelectItem value="price-high">Price (High to Low)</SelectItem>
              <SelectItem value="rating">Guest Rating</SelectItem>
              <SelectItem value="distance">Distance from Center</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              Grid
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              List
            </Button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search accommodations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full"
          />
        </div>
        
        <Sheet open={showFilters} onOpenChange={setShowFilters}>
          <SheetTrigger asChild>
            <Button variant="outline" className="flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4" />
              Filters
              {(filters.starRating.length > 0 || filters.type.length > 0 || filters.amenities.length > 0) && (
                <Badge variant="secondary" className="ml-1">
                  {filters.starRating.length + filters.type.length + filters.amenities.length}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-full sm:max-w-md overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Filter Accommodations</SheetTitle>
              <SheetDescription>
                Narrow down your accommodation options
              </SheetDescription>
            </SheetHeader>
            
            <div className="space-y-6 py-6">
              {/* Star Rating Filter */}
              <StarRatingFilter
                selectedRatings={filters.starRating}
                onRatingChange={(ratings) => updateFilters({ starRating: ratings })}
              />

              <Separator />

              {/* Accommodation Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Accommodation Type</Label>
                <div className="space-y-2">
                  {['hotel', 'resort', 'apartment', 'guesthouse', 'hostel', 'villa'].map((type) => (
                    <div key={type} className="flex items-center space-x-2">
                      <Checkbox
                        id={`type-${type}`}
                        checked={filters.type.includes(type)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilters({ type: [...filters.type, type] })
                          } else {
                            updateFilters({ type: filters.type.filter(t => t !== type) })
                          }
                        }}
                      />
                      <Label htmlFor={`type-${type}`} className="capitalize cursor-pointer">
                        {type}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Price Range */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Price per night: €{filters.priceRange[0]} - €{filters.priceRange[1]}
                </Label>
                <Slider
                  value={filters.priceRange}
                  onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                  max={1000}
                  min={0}
                  step={10}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Guest Rating */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Guest Rating: {filters.guestRating[0].toFixed(1)} - {filters.guestRating[1].toFixed(1)}
                </Label>
                <Slider
                  value={filters.guestRating}
                  onValueChange={(value) => updateFilters({ guestRating: value as [number, number] })}
                  max={5}
                  min={0}
                  step={0.1}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Distance from Center */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  Distance from center: {filters.distanceFromCenter}km
                </Label>
                <Slider
                  value={[filters.distanceFromCenter]}
                  onValueChange={(value) => updateFilters({ distanceFromCenter: value[0] || 0 })}
                  max={50}
                  min={0}
                  step={1}
                  className="w-full"
                />
              </div>

              <Separator />

              {/* Amenities */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Amenities</Label>
                <div className="space-y-2">
                  {['Free WiFi', 'Pool', 'Spa', 'Gym', 'Restaurant', 'Parking', 'Room Service', 'Kitchen'].map((amenity) => (
                    <div key={amenity} className="flex items-center space-x-2">
                      <Checkbox
                        id={`amenity-${amenity}`}
                        checked={filters.amenities.includes(amenity)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            updateFilters({ amenities: [...filters.amenities, amenity] })
                          } else {
                            updateFilters({ amenities: filters.amenities.filter(a => a !== amenity) })
                          }
                        }}
                      />
                      <Label htmlFor={`amenity-${amenity}`} className="cursor-pointer">
                        {amenity}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Clear Filters */}
              <Button
                variant="outline"
                onClick={clearFilters}
                className="w-full"
              >
                Clear All Filters
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Results */}
      {filteredAccommodations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">No accommodations match your criteria.</p>
          <Button
            variant="outline"
            onClick={clearFilters}
            className="mt-4"
          >
            Clear Filters
          </Button>
        </div>
      ) : (
        <div className={cn(
          viewMode === 'grid' 
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            : "space-y-4"
        )}>
          {filteredAccommodations.map((accommodation) => (
            <AccommodationCard
              key={accommodation.id}
              accommodation={accommodation}
              onSelect={onAccommodationSelect}
              onFavoriteToggle={handleFavoriteToggle}
              isFavorite={favorites.has(accommodation.id)}
              isSelected={selectedAccommodation?.id === accommodation.id}
              viewMode={viewMode}
              showComparison={true}
            />
          ))}
        </div>
      )}
    </div>
  )
} 