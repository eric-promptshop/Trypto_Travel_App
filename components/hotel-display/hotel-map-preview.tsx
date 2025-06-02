'use client';

import React from 'react';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HotelMapPreviewProps {
  hotel: {
    name: string;
    address: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    city?: string;
    country?: string;
  };
  variant?: 'default' | 'compact';
  className?: string | undefined;
}

export const HotelMapPreview: React.FC<HotelMapPreviewProps> = ({
  hotel,
  variant = 'default',
  className,
}) => {
  // Generate Google Maps URL with encoded address
  const getGoogleMapsUrl = () => {
    if (hotel.coordinates) {
      return `https://www.google.com/maps/search/?api=1&query=${hotel.coordinates.lat},${hotel.coordinates.lng}`;
    }
    const encodedAddress = encodeURIComponent(`${hotel.name}, ${hotel.address}`);
    return `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
  };

  // Generate Apple Maps URL (for iOS devices)
  const getAppleMapsUrl = () => {
    if (hotel.coordinates) {
      return `http://maps.apple.com/?q=${hotel.coordinates.lat},${hotel.coordinates.lng}`;
    }
    const encodedAddress = encodeURIComponent(`${hotel.name}, ${hotel.address}`);
    return `http://maps.apple.com/?q=${encodedAddress}`;
  };

  // Generate Waze URL for navigation
  const getWazeUrl = () => {
    if (hotel.coordinates) {
      return `https://waze.com/ul?ll=${hotel.coordinates.lat},${hotel.coordinates.lng}&navigate=yes`;
    }
    const encodedAddress = encodeURIComponent(hotel.address);
    return `https://waze.com/ul?q=${encodedAddress}&navigate=yes`;
  };

  // Format address for display
  const getFormattedAddress = () => {
    const parts = [hotel.address];
    if (hotel.city) parts.push(hotel.city);
    if (hotel.country) parts.push(hotel.country);
    return parts.join(', ');
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Address Display */}
      <div className="flex items-start gap-3">
        <MapPin className="text-tripnav-blue mt-0.5 flex-shrink-0" size={variant === 'compact' ? 16 : 20} />
        <div className="min-w-0">
          <p className={cn(
            'text-gray-900 font-medium',
            variant === 'compact' ? 'text-sm' : 'text-base'
          )}>
            Location
          </p>
          <p className={cn(
            'text-gray-600 break-words',
            variant === 'compact' ? 'text-xs' : 'text-sm'
          )}>
            {getFormattedAddress()}
          </p>
          {hotel.coordinates && (
            <p className="text-xs text-gray-400 mt-1">
              {hotel.coordinates.lat.toFixed(6)}, {hotel.coordinates.lng.toFixed(6)}
            </p>
          )}
        </div>
      </div>

      {/* Map Service Links */}
      <div className="space-y-2">
        <p className={cn(
          'text-gray-700 font-medium',
          variant === 'compact' ? 'text-xs' : 'text-sm'
        )}>
          Open in Maps:
        </p>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size={variant === 'compact' ? 'sm' : 'default'}
            className="flex items-center gap-2 text-tripnav-blue border-tripnav-blue hover:bg-tripnav-blue hover:text-white"
            onClick={() => window.open(getGoogleMapsUrl(), '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink size={variant === 'compact' ? 12 : 14} />
            Google Maps
          </Button>
          
          <Button
            variant="outline"
            size={variant === 'compact' ? 'sm' : 'default'}
            className="flex items-center gap-2 text-gray-600 border-gray-300 hover:bg-gray-100"
            onClick={() => window.open(getAppleMapsUrl(), '_blank', 'noopener,noreferrer')}
          >
            <ExternalLink size={variant === 'compact' ? 12 : 14} />
            Apple Maps
          </Button>
          
          <Button
            variant="outline"
            size={variant === 'compact' ? 'sm' : 'default'}
            className="flex items-center gap-2 text-tripnav-orange border-tripnav-orange hover:bg-tripnav-orange hover:text-white"
            onClick={() => window.open(getWazeUrl(), '_blank', 'noopener,noreferrer')}
          >
            <Navigation size={variant === 'compact' ? 12 : 14} />
            Navigate
          </Button>
        </div>
      </div>

      {/* Distance Information (if available) */}
      {hotel.coordinates && (
        <div className="text-xs text-gray-500">
          <p>Tip: Click "Navigate" for turn-by-turn directions</p>
        </div>
      )}
    </div>
  );
};

// Component for hotel contact information
interface HotelContactInfoProps {
  contact: {
    phone?: string;
    email?: string;
    website?: string;
  };
  variant?: 'default' | 'compact';
  className?: string | undefined;
}

export const HotelContactInfo: React.FC<HotelContactInfoProps> = ({
  contact,
  variant = 'default',
  className,
}) => {
  const hasContactInfo = contact.phone || contact.email || contact.website;

  if (!hasContactInfo) {
    return null;
  }

  const formatPhoneNumber = (phone: string) => {
    // Basic phone number formatting - can be enhanced
    return phone.replace(/(\d{3})(\d{3})(\d{4})/, '($1) $2-$3');
  };

  const handlePhoneClick = (phone: string) => {
    window.location.href = `tel:${phone.replace(/\D/g, '')}`;
  };

  const handleEmailClick = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  return (
    <div className={cn('space-y-2', className)}>
      <p className={cn(
        'text-gray-700 font-medium',
        variant === 'compact' ? 'text-xs' : 'text-sm'
      )}>
        Contact Information:
      </p>
      
      <div className="space-y-2">
        {contact.phone && (
          <button
            onClick={() => handlePhoneClick(contact.phone!)}
            className={cn(
              'flex items-center gap-2 text-left text-tripnav-blue hover:underline transition-colors',
              variant === 'compact' ? 'text-xs' : 'text-sm'
            )}
          >
            <span className="text-lg">📞</span>
            <span>{formatPhoneNumber(contact.phone)}</span>
          </button>
        )}
        
        {contact.email && (
          <button
            onClick={() => handleEmailClick(contact.email!)}
            className={cn(
              'flex items-center gap-2 text-left text-tripnav-blue hover:underline transition-colors',
              variant === 'compact' ? 'text-xs' : 'text-sm'
            )}
          >
            <span className="text-lg">✉️</span>
            <span>{contact.email}</span>
          </button>
        )}
        
        {contact.website && (
          <button
            onClick={() => window.open(contact.website!, '_blank', 'noopener,noreferrer')}
            className={cn(
              'flex items-center gap-2 text-left text-tripnav-blue hover:underline transition-colors',
              variant === 'compact' ? 'text-xs' : 'text-sm'
            )}
          >
            <ExternalLink size={variant === 'compact' ? 12 : 14} />
            <span>Visit Website</span>
          </button>
        )}
      </div>
    </div>
  );
}; 