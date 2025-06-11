"use client"

import * as React from "react"
import { 
  Clock, 
  MapPin, 
  Star, 
  Filter, 
  Search, 
  Plus, 
  Minus, 
  Calendar,
  DollarSign,
  Users,
  Camera,
  Utensils,
  Mountain,
  Building,
  Music,
  Car,
  Heart,
  ChevronDown,
  SlidersHorizontal
} from "lucide-react"
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
import { useSwipeable } from 'react-swipeable'

// Activity Data Interfaces
interface Activity {
  id: string
  name: string
  description: string
  category: 'adventure' | 'cultural' | 'culinary' | 'nature' | 'entertainment' | 'shopping' | 'historical' | 'art' | 'sports' | 'nightlife'
  imageUrl: string
  imageUrls: string[]
  location: {
    address: string
    city: string
    coordinates: [number, number]
  }
  duration: {
    min: number // minutes
    max: number
    typical: number
  }
  pricing: {
    currency: string
    adult: number
    child?: number
    family?: number
    group?: number
    isFree: boolean
  }
  timeSlots: Array<{
    start: string // "09:00"
    end: string   // "17:00"
    days: string[] // ["monday", "tuesday", ...]
  }>
  difficulty: 'easy' | 'moderate' | 'challenging'
  rating: {
    overall: number
    reviewCount: number
  }
  features: {
    audioGuide: boolean
    guidedTour: boolean
    photoOpportunity: boolean
    kidfriendly: boolean
    wheelchairAccessible: boolean
    indoorActivity: boolean
    bookingRequired: boolean
  }
  tags: string[]
  popularity: number // 1-10
  seasonality: {
    bestMonths: string[]
    availability: 'year-round' | 'seasonal'
  }
}

interface ActivityFilters {
  categories: string[]
  duration: [number, number] // in hours
  priceRange: [number, number]
  difficulty: string[]
  rating: [number, number]
  features: string[]
  timePreference: string // 'morning', 'afternoon', 'evening', 'any'
}

interface SelectedActivity extends Activity {
  selectedDate: string
  selectedTimeSlot: string
  participants: {
    adults: number
    children: number
  }
  totalPrice: number
}

interface ActivitySelectorProps {
  destination: string
  tripDates: {
    startDate: Date
    endDate: Date
  }
  onActivitySelect: (activity: SelectedActivity) => void
  onActivityRemove: (activityId: string) => void
  selectedActivities: SelectedActivity[]
  participants: {
    adults: number
    children: number
  }
  disabled?: boolean
  className?: string
}

// Category Icons
const getCategoryIcon = (category: Activity['category']) => {
  const iconMap = {
    adventure: Mountain,
    cultural: Building,
    culinary: Utensils,
    nature: Mountain,
    entertainment: Music,
    shopping: Building,
    historical: Building,
    art: Camera,
    sports: Users,
    nightlife: Music
  }
  return iconMap[category] || Building
}

// Mock activity data
const mockActivities: Activity[] = [
  {
    id: '1',
    name: 'Louvre Museum Guided Tour',
    description: 'Explore the world\'s largest art museum with a professional guide. See the Mona Lisa, Venus de Milo, and other masterpieces.',
    category: 'cultural',
    imageUrl: '/api/placeholder/400/250',
    imageUrls: ['/api/placeholder/400/250', '/api/placeholder/400/250'],
    location: {
      address: 'Rue de Rivoli, 75001 Paris',
      city: 'Paris',
      coordinates: [48.8606, 2.3376]
    },
    duration: {
      min: 120,
      max: 180,
      typical: 150
    },
    pricing: {
      currency: 'EUR',
      adult: 35,
      child: 25,
      family: 120,
      isFree: false
    },
    timeSlots: [
      { start: '09:00', end: '12:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      { start: '14:00', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }
    ],
    difficulty: 'easy',
    rating: {
      overall: 4.6,
      reviewCount: 2847
    },
    features: {
      audioGuide: true,
      guidedTour: true,
      photoOpportunity: true,
      kidfriendly: true,
      wheelchairAccessible: true,
      indoorActivity: true,
      bookingRequired: true
    },
    tags: ['art', 'history', 'guided tour', 'museum'],
    popularity: 9,
    seasonality: {
      bestMonths: ['april', 'may', 'june', 'september', 'october'],
      availability: 'year-round'
    }
  },
  {
    id: '2',
    name: 'Seine River Cruise',
    description: 'Romantic boat cruise along the Seine River with stunning views of Paris landmarks including the Eiffel Tower and Notre-Dame.',
    category: 'entertainment',
    imageUrl: '/api/placeholder/400/250',
    imageUrls: ['/api/placeholder/400/250'],
    location: {
      address: 'Port de la Bourdonnais, 75007 Paris',
      city: 'Paris',
      coordinates: [48.8584, 2.2945]
    },
    duration: {
      min: 60,
      max: 120,
      typical: 75
    },
    pricing: {
      currency: 'EUR',
      adult: 18,
      child: 12,
      isFree: false
    },
    timeSlots: [
      { start: '10:00', end: '11:15', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      { start: '15:00', end: '16:15', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      { start: '19:00', end: '20:15', days: ['friday', 'saturday', 'sunday'] }
    ],
    difficulty: 'easy',
    rating: {
      overall: 4.3,
      reviewCount: 1592
    },
    features: {
      audioGuide: true,
      guidedTour: false,
      photoOpportunity: true,
      kidfriendly: true,
      wheelchairAccessible: true,
      indoorActivity: false,
      bookingRequired: false
    },
    tags: ['scenic', 'relaxing', 'sightseeing', 'river'],
    popularity: 8,
    seasonality: {
      bestMonths: ['may', 'june', 'july', 'august', 'september'],
      availability: 'year-round'
    }
  },
  {
    id: '3',
    name: 'French Cooking Class',
    description: 'Learn to cook authentic French cuisine in a hands-on cooking class. Includes market visit and wine tasting.',
    category: 'culinary',
    imageUrl: '/api/placeholder/400/250',
    imageUrls: ['/api/placeholder/400/250', '/api/placeholder/400/250'],
    location: {
      address: '15 Rue des Martyrs, 75009 Paris',
      city: 'Paris',
      coordinates: [48.8767, 2.3407]
    },
    duration: {
      min: 180,
      max: 240,
      typical: 210
    },
    pricing: {
      currency: 'EUR',
      adult: 85,
      child: 50,
      isFree: false
    },
    timeSlots: [
      { start: '10:00', end: '13:30', days: ['tuesday', 'thursday', 'saturday'] },
      { start: '18:00', end: '21:30', days: ['friday', 'saturday'] }
    ],
    difficulty: 'moderate',
    rating: {
      overall: 4.8,
      reviewCount: 346
    },
    features: {
      audioGuide: false,
      guidedTour: true,
      photoOpportunity: true,
      kidfriendly: false,
      wheelchairAccessible: false,
      indoorActivity: true,
      bookingRequired: true
    },
    tags: ['cooking', 'food', 'wine', 'local experience'],
    popularity: 7,
    seasonality: {
      bestMonths: ['march', 'april', 'may', 'september', 'october', 'november'],
      availability: 'year-round'
    }
  },
  {
    id: '4',
    name: 'Montmartre Walking Tour',
    description: 'Discover the artistic heart of Paris with a walking tour through Montmartre\'s cobblestone streets and historic sites.',
    category: 'cultural',
    imageUrl: '/api/placeholder/400/250',
    imageUrls: ['/api/placeholder/400/250'],
    location: {
      address: 'Place du Tertre, 75018 Paris',
      city: 'Paris',
      coordinates: [48.8867, 2.3431]
    },
    duration: {
      min: 120,
      max: 180,
      typical: 150
    },
    pricing: {
      currency: 'EUR',
      adult: 25,
      child: 15,
      isFree: false
    },
    timeSlots: [
      { start: '09:30', end: '12:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] },
      { start: '14:30', end: '17:00', days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] }
    ],
    difficulty: 'moderate',
    rating: {
      overall: 4.5,
      reviewCount: 923
    },
    features: {
      audioGuide: false,
      guidedTour: true,
      photoOpportunity: true,
      kidfriendly: true,
      wheelchairAccessible: false,
      indoorActivity: false,
      bookingRequired: true
    },
    tags: ['walking', 'history', 'art', 'neighborhood'],
    popularity: 8,
    seasonality: {
      bestMonths: ['april', 'may', 'june', 'july', 'august', 'september', 'october'],
      availability: 'year-round'
    }
  }
] 

// Utility Functions
const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(price)
}

const getDifficultyColor = (difficulty: Activity['difficulty']) => {
  const colorMap = {
    easy: 'bg-green-100 text-green-800',
    moderate: 'bg-yellow-100 text-yellow-800',
    challenging: 'bg-red-100 text-red-800'
  }
  return colorMap[difficulty]
}

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

// Activity Card Component
const ActivityCard: React.FC<{
  activity: Activity
  onSelect: (activity: Activity) => void
  onRemove: (activityId: string) => void
  onFavoriteToggle: (id: string) => void
  isSelected: boolean
  isFavorite: boolean
  participants: { adults: number; children: number }
  viewMode: 'grid' | 'list'
  className?: string
}> = ({ 
  activity, 
  onSelect, 
  onRemove,
  onFavoriteToggle,
  isSelected, 
  isFavorite,
  participants,
  viewMode,
  className 
}) => {
  const [isHovered, setIsHovered] = React.useState(false)
  const [swiped, setSwiped] = React.useState(false)
  const CategoryIcon = getCategoryIcon(activity.category)

  const calculateTotalPrice = () => {
    const adultPrice = activity.pricing.adult * participants.adults
    const childPrice = activity.pricing.child ? activity.pricing.child * participants.children : 0
    return adultPrice + childPrice
  }

  const handleCardClick = () => {
    if (isSelected) {
      onRemove(activity.id)
    } else {
      onSelect(activity)
    }
  }

  // Swipe handlers
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isSelected) {
        setSwiped(true)
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          navigator.vibrate?.(50)
        }
        setTimeout(() => {
          onRemove(activity.id)
          setSwiped(false)
        }, 200)
      }
    },
    trackMouse: true
  })

  return (
    <div {...swipeHandlers}>
      <Card 
        className={cn(
          "cursor-pointer transition-all duration-200 hover:shadow-lg",
          isSelected && "ring-2 ring-blue-500 bg-blue-50",
          viewMode === 'list' && "flex",
          swiped && isSelected && "bg-red-100 border-red-500 animate-pulse",
          className
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleCardClick}
      >
        <div className={cn(
          "relative",
          viewMode === 'list' ? "w-48 flex-shrink-0" : "w-full"
        )}>
          <img
            src={activity.imageUrl}
            alt={activity.name}
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
              onFavoriteToggle(activity.id)
            }}
          >
            <Heart
              className={cn(
                "h-4 w-4",
                isFavorite ? "fill-red-500 text-red-500" : "text-gray-600"
              )}
            />
          </Button>

          {/* Category Badge */}
          <div className="absolute top-2 left-2 bg-white/90 rounded px-2 py-1 flex items-center gap-1">
            <CategoryIcon className="h-3 w-3" />
            <span className="text-xs font-medium capitalize">{activity.category}</span>
          </div>

          {/* Duration Badge */}
          <div className="absolute bottom-2 left-2 bg-black/70 text-white rounded px-2 py-1 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span className="text-xs">{formatDuration(activity.duration.typical)}</span>
          </div>

          {/* Selected Indicator */}
          {isSelected && (
            <div className="absolute bottom-2 right-2 bg-blue-500 text-white rounded-full p-1">
              <Minus className="h-3 w-3" />
            </div>
          )}
          
          {!isSelected && (
            <div className="absolute bottom-2 right-2 bg-white/80 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Plus className="h-3 w-3" />
            </div>
          )}
        </div>

        <div className={cn(
          "p-4",
          viewMode === 'list' && "flex-1"
        )}>
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <h3 className="font-semibold text-lg leading-tight mb-1">
                {activity.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2">
                {activity.description}
              </p>
            </div>
            <div className="text-right ml-4">
              <div className="flex items-center gap-1">
                {activity.pricing.isFree ? (
                  <span className="font-bold text-lg text-green-600">Free</span>
                ) : (
                  <span className="font-bold text-lg">
                    {formatPrice(calculateTotalPrice(), activity.pricing.currency)}
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-600">total price</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <MapPin className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600 truncate">
                {activity.location.address.split(',')[0]}
              </span>
            </div>
            
            <Badge className={getDifficultyColor(activity.difficulty)}>
              {activity.difficulty}
            </Badge>
          </div>

          <div className="flex items-center justify-between mb-3">
            <StarRating 
              rating={activity.rating.overall} 
              size="sm"
              className="text-sm"
            />
            <span className="text-xs text-gray-500">
              {activity.rating.reviewCount} reviews
            </span>
          </div>

          {/* Features */}
          <div className="flex flex-wrap gap-1 mb-3">
            {activity.features.guidedTour && (
              <Badge variant="secondary" className="text-xs">Guided Tour</Badge>
            )}
            {activity.features.audioGuide && (
              <Badge variant="secondary" className="text-xs">Audio Guide</Badge>
            )}
            {activity.features.kidfriendly && (
              <Badge variant="secondary" className="text-xs">Kid Friendly</Badge>
            )}
            {activity.features.wheelchairAccessible && (
              <Badge variant="secondary" className="text-xs">Accessible</Badge>
            )}
            {activity.features.bookingRequired && (
              <Badge variant="outline" className="text-xs">Booking Required</Badge>
            )}
          </div>

          {/* Time Slots Preview */}
          <div className="text-xs text-gray-600">
            {(() => {
              if (Array.isArray(activity.timeSlots) && activity.timeSlots.length > 0) {
                const first = activity.timeSlots[0];
                const last = activity.timeSlots[activity.timeSlots.length - 1];
                const start = (first && typeof first.start === 'string') ? first.start : '--:--';
                const end = (last && typeof last.end === 'string') ? last.end : '--:--';
                return `Available: ${start} - ${end}`;
              }
              return 'Available: --:--';
            })()}
          </div>
        </div>

        {/* Swipe-to-delete visual cue */}
        {isSelected && swiped && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-100 bg-opacity-80 z-10">
            <span className="text-red-600 font-bold text-lg">Deleting...</span>
          </div>
        )}
      </Card>
    </div>
  )
}

// Category Filter Component
const CategoryFilter: React.FC<{
  selectedCategories: string[]
  onCategoryChange: (categories: string[]) => void
  className?: string
}> = ({ selectedCategories, onCategoryChange, className }) => {
  const categories = [
    { value: 'cultural', label: 'Cultural', icon: Building },
    { value: 'adventure', label: 'Adventure', icon: Mountain },
    { value: 'culinary', label: 'Culinary', icon: Utensils },
    { value: 'nature', label: 'Nature', icon: Mountain },
    { value: 'entertainment', label: 'Entertainment', icon: Music },
    { value: 'shopping', label: 'Shopping', icon: Building },
    { value: 'historical', label: 'Historical', icon: Building },
    { value: 'art', label: 'Art', icon: Camera },
    { value: 'sports', label: 'Sports', icon: Users },
    { value: 'nightlife', label: 'Nightlife', icon: Music }
  ]

  const handleCategoryToggle = (category: string) => {
    if (selectedCategories.includes(category)) {
      onCategoryChange(selectedCategories.filter(c => c !== category))
    } else {
      onCategoryChange([...selectedCategories, category])
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <Label className="text-sm font-medium">Categories</Label>
      <div className="grid grid-cols-2 gap-2">
        {categories.map(({ value, label, icon: Icon }) => (
          <div key={value} className="flex items-center space-x-2">
            <Checkbox
              id={`category-${value}`}
              checked={selectedCategories.includes(value)}
              onCheckedChange={() => handleCategoryToggle(value)}
            />
            <Label
              htmlFor={`category-${value}`}
              className="flex items-center gap-2 cursor-pointer text-sm"
            >
              <Icon className="h-3 w-3" />
              {label}
            </Label>
          </div>
        ))}
      </div>
    </div>
  )
}

// Activity Search Component
const ActivitySearch: React.FC<{
  searchTerm: string
  onSearchChange: (term: string) => void
  activities: Activity[]
  className?: string
}> = ({ searchTerm, onSearchChange, activities, className }) => {
  const [suggestions, setSuggestions] = React.useState<Activity[]>([])
  const [showSuggestions, setShowSuggestions] = React.useState(false)

  React.useEffect(() => {
    if (searchTerm.length > 1) {
      const filtered = activities.filter(activity =>
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      ).slice(0, 5)
      setSuggestions(filtered)
      setShowSuggestions(true)
    } else {
      setSuggestions([])
      setShowSuggestions(false)
    }
  }, [searchTerm, activities])

  return (
    <div className={cn("relative", className)}>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search activities..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
          {suggestions.map((activity) => (
            <div
              key={activity.id}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => {
                onSearchChange(activity.name)
                setShowSuggestions(false)
              }}
            >
              <div className="flex items-center gap-3">
                <img
                  src={activity.imageUrl}
                  alt={activity.name}
                  className="w-10 h-10 rounded object-cover"
                />
                <div>
                  <p className="font-medium text-sm">{activity.name}</p>
                  <p className="text-xs text-gray-600 capitalize">{activity.category}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Main Activity Selector Component
export const ActivitySelector: React.FC<ActivitySelectorProps> = ({
  destination,
  tripDates,
  onActivitySelect,
  onActivityRemove,
  selectedActivities,
  participants,
  disabled = false,
  className
}) => {
  // State management
  const [searchTerm, setSearchTerm] = React.useState('')
  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = React.useState<'popularity' | 'price' | 'rating' | 'duration'>('popularity')
  const [favorites, setFavorites] = React.useState<string[]>([])
  const [filters, setFilters] = React.useState<ActivityFilters>({
    categories: [],
    duration: [0, 8], // hours
    priceRange: [0, 200],
    difficulty: [],
    rating: [0, 5],
    features: [],
    timePreference: 'any'
  })

  // Filter and search logic
  const filteredAndSortedActivities = React.useMemo(() => {
    let filtered = mockActivities.filter(activity => {
      // Search filter
      const matchesSearch = searchTerm === '' || 
        activity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        activity.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))

      // Category filter
      const matchesCategory = filters.categories.length === 0 || 
        filters.categories.includes(activity.category)

      // Duration filter (convert to hours)
      const durationHours = activity.duration.typical / 60
      const matchesDuration = durationHours >= filters.duration[0] && 
        durationHours <= filters.duration[1]

      // Price filter
      const price = activity.pricing.adult * participants.adults + 
        (activity.pricing.child || 0) * participants.children
      const matchesPrice = price >= filters.priceRange[0] && 
        price <= filters.priceRange[1]

      // Difficulty filter
      const matchesDifficulty = filters.difficulty.length === 0 || 
        filters.difficulty.includes(activity.difficulty)

      // Rating filter
      const matchesRating = activity.rating.overall >= filters.rating[0] && 
        activity.rating.overall <= filters.rating[1]

      return matchesSearch && matchesCategory && matchesDuration && 
        matchesPrice && matchesDifficulty && matchesRating
    })

    // Sort activities
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price':
          const priceA = a.pricing.adult * participants.adults + (a.pricing.child || 0) * participants.children
          const priceB = b.pricing.adult * participants.adults + (b.pricing.child || 0) * participants.children
          return priceA - priceB
        case 'rating':
          return b.rating.overall - a.rating.overall
        case 'duration':
          return a.duration.typical - b.duration.typical
        case 'popularity':
        default:
          return b.popularity - a.popularity
      }
    })

    return filtered
  }, [searchTerm, filters, sortBy, participants])

  // Event handlers
  const handleActivitySelect = (activity: Activity) => {
    // Get the first available time slot or default to '09:00'
    const defaultTimeSlot: string = Array.isArray(activity.timeSlots) && activity.timeSlots.length > 0 && activity.timeSlots[0] ? activity.timeSlots[0].start : '09:00'
    // For demo purposes, we'll select the first available time slot
    const selectedActivity: SelectedActivity = {
      ...activity,
      selectedDate: tripDates.startDate instanceof Date && !isNaN(tripDates.startDate.getTime())
        ? tripDates.startDate.toISOString().split('T')[0] || ''
        : '',
      selectedTimeSlot: defaultTimeSlot,
      participants,
      totalPrice: activity.pricing.adult * participants.adults + 
        (activity.pricing.child || 0) * participants.children
    }
    // Prevent duplicate add
    if (selectedActivities.some(sa => sa.id === activity.id)) {
      if (typeof window !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate?.([30, 50, 30]) // error feedback
      }
      return
    }
    onActivitySelect(selectedActivity)
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate?.(30) // success feedback
    }
  }

  const handleFavoriteToggle = (id: string) => {
    setFavorites(prev => 
      prev.includes(id) 
        ? prev.filter(fav => fav !== id)
        : [...prev, id]
    )
  }

  const updateFilters = (newFilters: Partial<ActivityFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }))
  }

  const clearFilters = () => {
    setFilters({
      categories: [],
      duration: [0, 8],
      priceRange: [0, 200],
      difficulty: [],
      rating: [0, 5],
      features: [],
      timePreference: 'any'
    })
    setSearchTerm('')
  }

  const isActivitySelected = (activityId: string) => {
    return selectedActivities.some(sa => sa.id === activityId)
  }

  if (disabled) {
    return (
      <div className={cn("opacity-50 pointer-events-none", className)}>
        <p className="text-center text-gray-500 py-8">
          Activity selection is currently disabled
        </p>
      </div>
    )
  }

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Select Activities</h2>
          <p className="text-gray-600">
            Choose activities for your trip to {destination}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {selectedActivities.length} selected
          </span>
          <Badge variant="outline">
            {filteredAndSortedActivities.length} available
          </Badge>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <ActivitySearch
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
              activities={mockActivities}
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popularity">Popularity</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
                <SelectItem value="duration">Duration</SelectItem>
              </SelectContent>
            </Select>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Filters
                  {Object.values(filters).some(f => Array.isArray(f) ? f.length > 0 : f !== 'any') && (
                    <Badge variant="secondary" className="ml-2">!</Badge>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Activity Filters</SheetTitle>
                  <SheetDescription>
                    Refine your activity search with these filters
                  </SheetDescription>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  <CategoryFilter
                    selectedCategories={filters.categories}
                    onCategoryChange={(categories) => updateFilters({ categories })}
                  />
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Duration (hours)</Label>
                    <Slider
                      value={filters.duration}
                      onValueChange={(value) => updateFilters({ duration: value as [number, number] })}
                      max={8}
                      min={0}
                      step={0.5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>{filters.duration[0]}h</span>
                      <span>{filters.duration[1]}h</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Price Range (EUR)</Label>
                    <Slider
                      value={filters.priceRange}
                      onValueChange={(value) => updateFilters({ priceRange: value as [number, number] })}
                      max={200}
                      min={0}
                      step={5}
                      className="mt-2"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>€{filters.priceRange[0]}</span>
                      <span>€{filters.priceRange[1]}</span>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={clearFilters} className="flex-1">
                      Clear All
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="grid">Grid</TabsTrigger>
                <TabsTrigger value="list">List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Activity Grid/List */}
      <div className={cn(
        "gap-6",
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3" 
          : "flex flex-col space-y-4"
      )}>
        {filteredAndSortedActivities.map((activity) => (
          <ActivityCard
            key={activity.id}
            activity={activity}
            onSelect={handleActivitySelect}
            onRemove={onActivityRemove}
            onFavoriteToggle={handleFavoriteToggle}
            isSelected={isActivitySelected(activity.id)}
            isFavorite={favorites.includes(activity.id)}
            participants={participants}
            viewMode={viewMode}
          />
        ))}
      </div>

      {/* Empty State */}
      {filteredAndSortedActivities.length === 0 && (
        <div className="text-center py-12">
          <Building className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No activities found
          </h3>
          <p className="text-gray-600 mb-4">
            Try adjusting your search or filter criteria
          </p>
          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  )
} 