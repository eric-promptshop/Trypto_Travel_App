'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { Users, Bed, Wifi, Coffee, Car, Tv, Bath } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  occupancy: {
    adults: number;
    children?: number;
    maxGuests: number;
  };
  bedConfiguration: string; // e.g., "1 King Bed", "2 Queen Beds"
  size?: string; // e.g., "320 sq ft"
  images: string[];
  amenities: string[];
  price?: {
    amount: number;
    currency: string;
    period: string; // e.g., "per night"
  };
}

interface RoomPreviewProps {
  rooms: RoomType[];
  variant?: 'default' | 'compact';
  className?: string | undefined;
  showPricing?: boolean;
}

export const RoomPreview: React.FC<RoomPreviewProps> = ({
  rooms,
  variant = 'default',
  className,
  showPricing = false,
}) => {
  if (!rooms || rooms.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      <h3 className={cn(
        'font-semibold text-gray-900',
        variant === 'compact' ? 'text-sm' : 'text-lg'
      )}>
        Room Types ({rooms.length})
      </h3>
      
      <div className="space-y-4">
        {rooms.map((room) => (
          <RoomCard
            key={room.id}
            room={room}
            variant={variant}
            showPricing={showPricing}
          />
        ))}
      </div>
    </div>
  );
};

interface RoomCardProps {
  room: RoomType;
  variant?: 'default' | 'compact';
  showPricing?: boolean;
}

const RoomCard: React.FC<RoomCardProps> = ({
  room,
  variant = 'default',
  showPricing = false,
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const getRoomAmenityIcon = (amenity: string) => {
    const normalizedAmenity = amenity.toLowerCase();
    
    if (normalizedAmenity.includes('wifi') || normalizedAmenity.includes('internet')) {
      return <Wifi size={16} />;
    }
    if (normalizedAmenity.includes('coffee') || normalizedAmenity.includes('tea')) {
      return <Coffee size={16} />;
    }
    if (normalizedAmenity.includes('parking')) {
      return <Car size={16} />;
    }
    if (normalizedAmenity.includes('tv') || normalizedAmenity.includes('television')) {
      return <Tv size={16} />;
    }
    if (normalizedAmenity.includes('bath') || normalizedAmenity.includes('shower')) {
      return <Bath size={16} />;
    }
    
    return <span className="w-4 h-4 bg-tripnav-blue rounded-full flex-shrink-0" />;
  };

  const formatPrice = (price: RoomType['price']) => {
    if (!price) return null;
    
    return `${price.currency}${price.amount} ${price.period}`;
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === room.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? room.images.length - 1 : prev - 1
    );
  };

  return (
    <div className={cn(
      'border border-gray-200 rounded-lg overflow-hidden',
      variant === 'compact' ? 'p-3' : 'p-4'
    )}>
      <div className={cn(
        'grid gap-4',
        variant === 'compact' ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 lg:grid-cols-3'
      )}>
        {/* Image Gallery */}
        {room.images.length > 0 && room.images[currentImageIndex] && (
          <div className="relative">
            <div className={cn(
              'relative rounded-lg overflow-hidden bg-gray-100',
              variant === 'compact' ? 'h-32' : 'h-48'
            )}>
              <Image
                src={room.images[currentImageIndex]}
                alt={`${room.name} - Image ${currentImageIndex + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 33vw"
              />
              
              {room.images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                    aria-label="Previous image"
                  >
                    ←
                  </button>
                  <button
                    onClick={nextImage}
                    className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70 transition-colors"
                    aria-label="Next image"
                  >
                    →
                  </button>
                  
                  <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                    {room.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => setCurrentImageIndex(index)}
                        className={cn(
                          'w-2 h-2 rounded-full transition-colors',
                          index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                        )}
                        aria-label={`Go to image ${index + 1}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Room Details */}
        <div className={cn(
          'space-y-3',
          room.images.length > 0 ? 'lg:col-span-2' : 'lg:col-span-3'
        )}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div>
              <h4 className={cn(
                'font-semibold text-gray-900',
                variant === 'compact' ? 'text-sm' : 'text-base'
              )}>
                {room.name}
              </h4>
              {room.description && (
                <p className={cn(
                  'text-gray-600 mt-1',
                  variant === 'compact' ? 'text-xs' : 'text-sm'
                )}>
                  {room.description}
                </p>
              )}
            </div>
            
            {showPricing && room.price && (
              <div className="text-right">
                <p className={cn(
                  'font-semibold text-tripnav-blue',
                  variant === 'compact' ? 'text-sm' : 'text-lg'
                )}>
                  {formatPrice(room.price)}
                </p>
              </div>
            )}
          </div>

          {/* Room Specifications */}
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-1 text-gray-600">
              <Users size={variant === 'compact' ? 14 : 16} />
              <span className={cn(
                variant === 'compact' ? 'text-xs' : 'text-sm'
              )}>
                {room.occupancy.adults} Adult{room.occupancy.adults !== 1 ? 's' : ''}
                {room.occupancy.children && room.occupancy.children > 0 && 
                  `, ${room.occupancy.children} Child${room.occupancy.children !== 1 ? 'ren' : ''}`
                }
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-gray-600">
              <Bed size={variant === 'compact' ? 14 : 16} />
              <span className={cn(
                variant === 'compact' ? 'text-xs' : 'text-sm'
              )}>
                {room.bedConfiguration}
              </span>
            </div>
            
            {room.size && (
              <Badge variant="secondary" className={cn(
                variant === 'compact' ? 'text-xs' : 'text-sm'
              )}>
                {room.size}
              </Badge>
            )}
          </div>

          {/* Amenities */}
          {room.amenities.length > 0 && (
            <div className="space-y-2">
              <p className={cn(
                'font-medium text-gray-700',
                variant === 'compact' ? 'text-xs' : 'text-sm'
              )}>
                Room Amenities:
              </p>
              <div className="flex flex-wrap gap-2">
                {room.amenities.slice(0, variant === 'compact' ? 4 : 6).map((amenity, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-1 text-gray-600"
                  >
                    <span className="text-tripnav-blue">
                      {getRoomAmenityIcon(amenity)}
                    </span>
                    <span className={cn(
                      variant === 'compact' ? 'text-xs' : 'text-sm'
                    )}>
                      {amenity}
                    </span>
                  </div>
                ))}
                {room.amenities.length > (variant === 'compact' ? 4 : 6) && (
                  <Badge variant="outline" className={cn(
                    'text-gray-500',
                    variant === 'compact' ? 'text-xs' : 'text-sm'
                  )}>
                    +{room.amenities.length - (variant === 'compact' ? 4 : 6)} more
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 