'use client';

import React from 'react';
import Image from 'next/image';
import { MapPin, Star, Calendar, Users } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// Import our hotel display components
import { StarRating } from './star-rating';
import { AmenityList } from './amenity-icons';
import { CollapsibleSection, AmenitiesSection, PoliciesSection } from './collapsible-section';
import { HotelMapPreview, HotelContactInfo } from './hotel-map-preview';
import { RoomPreview } from './room-preview';

export interface Hotel {
  id: string;
  name: string;
  address: string;
  city?: string;
  country?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  rating: number;
  category?: string; // e.g., "Luxury", "Business", "Budget"
  images: string[];
  checkIn: string;
  checkOut: string;
  amenities: string[];
  description?: string;
  policies?: {
    checkIn?: string;
    checkOut?: string;
    cancellation?: string;
    pets?: string;
    children?: string;
    additionalInfo?: string[];
  };
  contact?: {
    phone?: string;
    email?: string;
    website?: string;
  };
  rooms?: Array<{
    id: string;
    name: string;
    description?: string;
    occupancy: {
      adults: number;
      children?: number;
      maxGuests: number;
    };
    bedConfiguration: string;
    size?: string;
    images: string[];
    amenities: string[];
    price?: {
      amount: number;
      currency: string;
      period: string;
    };
  }>;
}

interface HotelCardProps {
  hotel: Hotel;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string | undefined;
  showRooms?: boolean;
  showMap?: boolean;
  showContact?: boolean;
  showPolicies?: boolean;
  onHotelClick?: (hotel: Hotel) => void;
}

export const HotelCard: React.FC<HotelCardProps> = ({
  hotel,
  variant = 'default',
  className,
  showRooms = true,
  showMap = true,
  showContact = true,
  showPolicies = true,
  onHotelClick,
}) => {
  const getHotelTierBadge = (rating: number) => {
    if (rating >= 4.5) return { label: 'Luxury', color: 'bg-yellow-100 text-yellow-800' };
    if (rating >= 3.5) return { label: 'Premium', color: 'bg-blue-100 text-blue-800' };
    if (rating >= 2.5) return { label: 'Standard', color: 'bg-green-100 text-green-800' };
    return { label: 'Budget', color: 'bg-gray-100 text-gray-800' };
  };

  const tierBadge = getHotelTierBadge(hotel.rating);
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  return (
    <Card 
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-lg',
        onHotelClick && 'cursor-pointer',
        className
      )}
      onClick={() => onHotelClick?.(hotel)}
    >
      <CardHeader className={cn(
        'pb-4',
        isCompact ? 'p-4' : 'p-6'
      )}>
        {/* Hotel Header */}
        <div className="space-y-3">
          {/* Main Image and Basic Info */}
          <div className={cn(
            'grid gap-4',
            isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
          )}>
            {/* Hotel Image */}
            {hotel.images.length > 0 && hotel.images[0] && (
              <div className="relative">
                <div className={cn(
                  'relative rounded-lg overflow-hidden bg-gray-100',
                  isCompact ? 'h-40' : 'h-48 md:h-56'
                )}>
                  <Image
                    src={hotel.images[0]}
                    alt={hotel.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
                  />
                  {hotel.category && (
                    <Badge 
                      className={cn(
                        'absolute top-2 left-2',
                        tierBadge.color
                      )}
                    >
                      {hotel.category}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            {/* Hotel Details */}
            <div className={cn(
              'space-y-3',
              hotel.images.length > 0 ? 'md:col-span-2' : 'md:col-span-3'
            )}>
              {/* Name and Rating */}
              <div className="space-y-2">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                  <h3 className={cn(
                    'font-bold text-gray-900',
                    isCompact ? 'text-lg' : 'text-xl'
                  )}>
                    {hotel.name}
                  </h3>
                  <div className="flex items-center gap-2">
                    <StarRating 
                      rating={hotel.rating} 
                      size={isCompact ? 'sm' : 'md'} 
                    />
                    <span className={cn(
                      'font-semibold text-tripnav-blue',
                      isCompact ? 'text-sm' : 'text-base'
                    )}>
                      {hotel.rating.toFixed(1)}
                    </span>
                  </div>
                </div>

                {/* Address */}
                <div className="flex items-start gap-2">
                  <MapPin className="text-gray-400 mt-0.5 flex-shrink-0" size={16} />
                  <p className={cn(
                    'text-gray-600',
                    isCompact ? 'text-sm' : 'text-base'
                  )}>
                    {hotel.address}
                    {hotel.city && `, ${hotel.city}`}
                    {hotel.country && `, ${hotel.country}`}
                  </p>
                </div>
              </div>

              {/* Check-in/Check-out */}
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Check-in: {hotel.checkIn}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Check-out: {hotel.checkOut}</span>
                </div>
              </div>

              {/* Description */}
              {hotel.description && !isCompact && (
                <p className="text-gray-700 text-sm line-clamp-2">
                  {hotel.description}
                </p>
              )}

              {/* Key Amenities Preview */}
              {hotel.amenities.length > 0 && (
                <div className="pt-2">
                  <AmenityList 
                    amenities={hotel.amenities.slice(0, isCompact ? 4 : 8)} 
                    layout="horizontal"
                    size={isCompact ? 'sm' : 'md'}
                  />
                  {hotel.amenities.length > (isCompact ? 4 : 8) && (
                    <p className="text-xs text-gray-500 mt-1">
                      +{hotel.amenities.length - (isCompact ? 4 : 8)} more amenities
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>

      {/* Detailed Content (for detailed variant) */}
      {isDetailed && (
        <CardContent className="pt-0 space-y-4">
          {/* Full Amenities */}
          {hotel.amenities.length > 0 && (
            <AmenitiesSection 
              amenities={hotel.amenities}
              variant={isCompact ? 'compact' : 'default'}
            />
          )}

          {/* Room Types */}
          {showRooms && hotel.rooms && hotel.rooms.length > 0 && (
            <CollapsibleSection 
              title="Room Types"
              icon={<span className="text-lg">🛏️</span>}
              defaultOpen={false}
            >
              <RoomPreview 
                rooms={hotel.rooms}
                variant={isCompact ? 'compact' : 'default'}
              />
            </CollapsibleSection>
          )}

          {/* Map and Location */}
          {showMap && (
            <CollapsibleSection 
              title="Location & Directions"
              icon={<MapPin size={20} />}
              defaultOpen={false}
            >
              <HotelMapPreview 
                hotel={{
                  name: hotel.name,
                  address: hotel.address,
                  ...(hotel.coordinates && { coordinates: hotel.coordinates }),
                  ...(hotel.city && { city: hotel.city }),
                  ...(hotel.country && { country: hotel.country }),
                }}
                variant={isCompact ? 'compact' : 'default'}
              />
            </CollapsibleSection>
          )}

          {/* Contact Information */}
          {showContact && hotel.contact && (
            <CollapsibleSection 
              title="Contact Information"
              icon={<span className="text-lg">📞</span>}
              defaultOpen={false}
            >
              <HotelContactInfo 
                contact={hotel.contact}
                variant={isCompact ? 'compact' : 'default'}
              />
            </CollapsibleSection>
          )}

          {/* Policies */}
          {showPolicies && hotel.policies && (
            <PoliciesSection 
              policies={hotel.policies}
              variant={isCompact ? 'compact' : 'default'}
            />
          )}
        </CardContent>
      )}
    </Card>
  );
}; 