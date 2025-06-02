'use client';

import React from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export interface AirlineInfoProps {
  airline: string;
  flightNumber: string;
  aircraft?: string;
  class: 'economy' | 'business' | 'first';
  variant?: 'default' | 'compact';
  className?: string | undefined;
  showLogo?: boolean;
}

// Common airline mappings - in a real app this would come from a database
const AIRLINE_INFO = {
  'American Airlines': {
    code: 'AA',
    logo: '/images/airlines/american-airlines.png',
    color: '#CC0000',
  },
  'Delta Air Lines': {
    code: 'DL',
    logo: '/images/airlines/delta.png',
    color: '#003366',
  },
  'United Airlines': {
    code: 'UA',
    logo: '/images/airlines/united.png',
    color: '#0039A6',
  },
  'Southwest Airlines': {
    code: 'WN',
    logo: '/images/airlines/southwest.png',
    color: '#304CB2',
  },
  'JetBlue Airways': {
    code: 'B6',
    logo: '/images/airlines/jetblue.png',
    color: '#0B3D91',
  },
  'Alaska Airlines': {
    code: 'AS',
    logo: '/images/airlines/alaska.png',
    color: '#01426A',
  },
  'Lufthansa': {
    code: 'LH',
    logo: '/images/airlines/lufthansa.png',
    color: '#05164D',
  },
  'British Airways': {
    code: 'BA',
    logo: '/images/airlines/british-airways.png',
    color: '#075AAA',
  },
  'Air France': {
    code: 'AF',
    logo: '/images/airlines/air-france.png',
    color: '#002157',
  },
  'Emirates': {
    code: 'EK',
    logo: '/images/airlines/emirates.png',
    color: '#FF0000',
  },
  'Qatar Airways': {
    code: 'QR',
    logo: '/images/airlines/qatar.png',
    color: '#5C0633',
  },
  'Singapore Airlines': {
    code: 'SQ',
    logo: '/images/airlines/singapore.png',
    color: '#003876',
  },
  'Cathay Pacific': {
    code: 'CX',
    logo: '/images/airlines/cathay-pacific.png',
    color: '#00643C',
  },
  'Japan Airlines': {
    code: 'JL',
    logo: '/images/airlines/jal.png',
    color: '#FF0000',
  },
  'All Nippon Airways': {
    code: 'NH',
    logo: '/images/airlines/ana.png',
    color: '#1E3A8A',
  },
} as const;

export const AirlineInfo: React.FC<AirlineInfoProps> = ({
  airline,
  flightNumber,
  aircraft,
  class: flightClass,
  variant = 'default',
  className,
  showLogo = true,
}) => {
  const isCompact = variant === 'compact';
  const airlineData = AIRLINE_INFO[airline as keyof typeof AIRLINE_INFO];

  const getClassBadgeStyle = (flightClass: AirlineInfoProps['class']) => {
    switch (flightClass) {
      case 'first':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'business':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'economy':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getClassDisplayName = (flightClass: AirlineInfoProps['class']) => {
    switch (flightClass) {
      case 'first':
        return 'First Class';
      case 'business':
        return 'Business Class';
      case 'economy':
        return 'Economy Class';
      default:
        return 'Economy Class';
    }
  };

  return (
    <div className={cn('flex items-center gap-3', className)}>
      {/* Airline Logo */}
      {showLogo && airlineData?.logo && (
        <div className={cn(
          'relative bg-white rounded-lg border border-gray-200 p-2 flex-shrink-0',
          isCompact ? 'w-8 h-8 p-1' : 'w-12 h-12 p-2'
        )}>
          <Image
            src={airlineData.logo}
            alt={`${airline} logo`}
            fill
            className="object-contain"
            sizes="48px"
          />
        </div>
      )}

      {/* Airline Details */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <h3 className={cn(
            'font-semibold text-tripnav-blue truncate',
            isCompact ? 'text-sm' : 'text-base'
          )}>
            {airline}
          </h3>
          
          {airlineData?.code && (
            <Badge variant="outline" className={cn(
              'text-xs font-mono',
              isCompact ? 'text-xs px-1 py-0' : 'text-xs'
            )}>
              {airlineData.code}
            </Badge>
          )}
        </div>

        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            'font-medium text-gray-900',
            isCompact ? 'text-sm' : 'text-base'
          )}>
            Flight {flightNumber}
          </span>
          
          {aircraft && (
            <span className={cn(
              'text-gray-600',
              isCompact ? 'text-xs' : 'text-sm'
            )}>
              • {aircraft}
            </span>
          )}
        </div>

        <div className="mt-1">
          <Badge 
            variant="outline" 
            className={cn(
              'text-xs font-medium capitalize',
              getClassBadgeStyle(flightClass),
              isCompact ? 'text-xs px-1 py-0' : 'text-xs'
            )}
          >
            {getClassDisplayName(flightClass)}
          </Badge>
        </div>
      </div>
    </div>
  );
};

// Compact inline version for use in timelines
interface InlineAirlineInfoProps {
  airline: string;
  flightNumber: string;
  class: 'economy' | 'business' | 'first';
  size?: 'sm' | 'md';
  className?: string | undefined;
}

export const InlineAirlineInfo: React.FC<InlineAirlineInfoProps> = ({
  airline,
  flightNumber,
  class: flightClass,
  size = 'md',
  className,
}) => {
  const airlineData = AIRLINE_INFO[airline as keyof typeof AIRLINE_INFO];

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className={cn(
        'font-semibold text-tripnav-blue',
        size === 'sm' ? 'text-sm' : 'text-base'
      )}>
        {airlineData?.code || airline} {flightNumber}
      </span>
      
      <Badge variant="outline" className={cn(
        'text-xs font-medium capitalize',
        size === 'sm' ? 'text-xs px-1 py-0' : 'text-xs',
        flightClass === 'first' && 'bg-yellow-100 text-yellow-800 border-yellow-200',
        flightClass === 'business' && 'bg-blue-100 text-blue-800 border-blue-200',
        flightClass === 'economy' && 'bg-gray-100 text-gray-800 border-gray-200'
      )}>
        {flightClass}
      </Badge>
    </div>
  );
};

// Airline code lookup utility
export const getAirlineInfo = (airline: string) => {
  return AIRLINE_INFO[airline as keyof typeof AIRLINE_INFO] || null;
};

// Generate placeholder logo for unknown airlines
export const generateAirlinePlaceholder = (airline: string) => {
  const initials = airline
    .split(' ')
    .map(word => word.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
  
  return {
    initials,
    color: '#1f5582', // TripNav blue as default
  };
}; 