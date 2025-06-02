"use client"

import React from 'react'
import { 
  Wifi, 
  Car, 
  Coffee, 
  Dumbbell, 
  Heart, 
  UtensilsCrossed, 
  Wind, 
  Waves,
  TreePine,
  Users,
  ParkingCircle,
  Bed,
  Bath,
  Tv,
  Utensils,
  Shield,
  Truck,
  Plane,
  Building,
  MapPin,
  Clock,
  Snowflake,
  Sun,
  Scissors,
  Baby
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

// Comprehensive mapping of amenity names to icons
const AMENITY_ICON_MAP = {
  // Internet & Technology
  'wifi': Wifi,
  'internet': Wifi,
  'wi-fi': Wifi,
  'wireless internet': Wifi,
  'tv': Tv,
  'television': Tv,
  'cable tv': Tv,

  // Parking & Transportation
  'parking': Car,
  'free parking': ParkingCircle,
  'valet parking': Truck,
  'airport shuttle': Plane,
  'car rental': Car,

  // Food & Beverage
  'restaurant': UtensilsCrossed,
  'dining': Utensils,
  'breakfast': Coffee,
  'room service': Utensils,
  'bar': Coffee,
  'kitchen': Utensils,
  'kitchenette': Utensils,

  // Fitness & Recreation
  'gym': Dumbbell,
  'fitness center': Dumbbell,
  'spa': Heart,
  'pool': Waves,
  'swimming pool': Waves,
  'outdoor pool': Waves,
  'hot tub': Waves,
  'jacuzzi': Waves,
  'tennis': Users,
  'golf': TreePine,

  // Room Amenities
  'air conditioning': Wind,
  'air-conditioning': Wind,
  'ac': Wind,
  'heating': Sun,
  'refrigerator': Snowflake,
  'minibar': Coffee,
  'balcony': Building,
  'view': MapPin,
  'safe': Shield,

  // Services
  'concierge': Users,
  'front desk': Clock,
  '24-hour front desk': Clock,
  'housekeeping': Bed,
  'laundry': Scissors,
  'dry cleaning': Scissors,
  'babysitting': Baby,

  // Accessibility
  'wheelchair accessible': Shield,
  'elevator': Building,
  'non-smoking': Wind,

  // Business
  'business center': Building,
  'meeting rooms': Users,
  'conference facilities': Users,
} as const

type AmenityKey = keyof typeof AMENITY_ICON_MAP

interface AmenityIconProps {
  amenity: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  showTooltip?: boolean
}

export const AmenityIcon: React.FC<AmenityIconProps> = ({
  amenity,
  size = 'md',
  className,
  showTooltip = true
}) => {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  // Normalize amenity name for lookup
  const normalizedAmenity = amenity.toLowerCase().trim() as AmenityKey
  const IconComponent = AMENITY_ICON_MAP[normalizedAmenity]

  // If no icon found, use a generic building icon
  const FinalIcon = IconComponent || Building

  const iconElement = (
    <FinalIcon
      className={cn(
        sizeClasses[size],
        'text-[#1f5582] transition-colors duration-200',
        className
      )}
      aria-label={amenity}
    />
  )

  if (!showTooltip) {
    return iconElement
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="inline-flex items-center">
            {iconElement}
          </div>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-gray-900 text-white text-xs px-2 py-1">
          <p className="capitalize">{amenity}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

export interface AmenityListProps {
  amenities: string[];
  layout?: 'horizontal' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  className?: string | undefined;
  maxVisible?: number;
  showLabels?: boolean;
}

export const AmenityList: React.FC<AmenityListProps> = ({
  amenities,
  maxVisible,
  size = 'md',
  className,
  showLabels = false,
  layout = 'horizontal'
}) => {
  const visibleAmenities = maxVisible ? amenities.slice(0, maxVisible) : amenities
  const hiddenCount = maxVisible && amenities.length > maxVisible ? amenities.length - maxVisible : 0

  const containerClasses = layout === 'grid' 
    ? 'grid grid-cols-3 gap-2' 
    : 'flex items-center gap-2 flex-wrap'

  return (
    <div className={cn(containerClasses, className)}>
      {visibleAmenities.map((amenity, index) => (
        <div key={index} className="flex items-center gap-1">
          <AmenityIcon amenity={amenity} size={size} />
          {showLabels && (
            <span className={cn(
              'text-gray-600 capitalize',
              size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
            )}>
              {amenity}
            </span>
          )}
        </div>
      ))}
      
      {hiddenCount > 0 && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className={cn(
                'text-gray-500 font-medium cursor-help',
                size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-base' : 'text-sm'
              )}>
                +{hiddenCount} more
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-gray-900 text-white text-xs px-2 py-1 max-w-48">
              <div className="space-y-1">
                {amenities.slice(maxVisible).map((amenity, index) => (
                  <p key={index} className="capitalize">{amenity}</p>
                ))}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  )
}

export default AmenityIcon 