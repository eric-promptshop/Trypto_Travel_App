'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Plane, Clock, MapPin, Users, Luggage, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

// Import our flight display components
import { FlightTimeline } from './flight-timeline';
import { AirlineInfo } from './airline-info';
import { FlightStatus, FlightProgress } from './flight-status';
import { CollapsibleSection } from '../hotel-display/collapsible-section';

interface FlightSegment {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    time: string;
    date: string;
    timezone: string;
    gate?: string;
    terminal?: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    date: string;
    timezone: string;
    gate?: string;
    terminal?: string;
  };
  duration: string;
  aircraft?: string;
  class: 'economy' | 'business' | 'first';
  status: 'scheduled' | 'on-time' | 'delayed' | 'boarding' | 'departed' | 'in-flight' | 'arrived' | 'cancelled' | 'diverted' | 'unknown';
  delay?: string;
}

interface LayoverInfo {
  airport: string;
  city: string;
  duration: string;
  terminal?: string;
}

export interface Flight {
  id: string;
  bookingReference: string;
  type: 'outbound' | 'return' | 'multi-city';
  segments: FlightSegment[];
  layovers?: LayoverInfo[];
  passengers: {
    adults: number;
    children?: number;
    infants?: number;
  };
  totalDuration: string;
  baggage?: {
    carry: string;
    checked: string;
  };
  seatAssignments?: string[];
  specialRequests?: string[];
  bookingClass: 'economy' | 'business' | 'first';
  price?: {
    amount: number;
    currency: string;
  };
}

interface FlightCardProps {
  flight: Flight;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string | undefined;
  showProgress?: boolean;
  showDetails?: boolean;
  showBaggage?: boolean;
  onFlightClick?: (flight: Flight) => void;
}

export const FlightCard: React.FC<FlightCardProps> = ({
  flight,
  variant = 'default',
  className,
  showProgress = true,
  showDetails = true,
  showBaggage = true,
  onFlightClick,
}) => {
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  const getFlightTypeLabel = (type: Flight['type']) => {
    switch (type) {
      case 'outbound':
        return 'Outbound';
      case 'return':
        return 'Return';
      case 'multi-city':
        return 'Multi-City';
      default:
        return 'Flight';
    }
  };

  const getClassBadgeColor = (bookingClass: Flight['bookingClass']) => {
    switch (bookingClass) {
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

  const getOverallStatus = () => {
    if (flight.segments.some(segment => segment.status === 'cancelled')) {
      return 'cancelled';
    }
    if (flight.segments.some(segment => segment.status === 'delayed')) {
      return 'delayed';
    }
    if (flight.segments.every(segment => segment.status === 'arrived')) {
      return 'arrived';
    }
    if (flight.segments.some(segment => segment.status === 'in-flight')) {
      return 'in-flight';
    }
    if (flight.segments.some(segment => segment.status === 'departed')) {
      return 'departed';
    }
    if (flight.segments.some(segment => segment.status === 'boarding')) {
      return 'boarding';
    }
    return 'scheduled';
  };

  const formatPassengerInfo = () => {
    const parts = [`${flight.passengers.adults} Adult${flight.passengers.adults !== 1 ? 's' : ''}`];
    if (flight.passengers.children && flight.passengers.children > 0) {
      parts.push(`${flight.passengers.children} Child${flight.passengers.children !== 1 ? 'ren' : ''}`);
    }
    if (flight.passengers.infants && flight.passengers.infants > 0) {
      parts.push(`${flight.passengers.infants} Infant${flight.passengers.infants !== 1 ? 's' : ''}`);
    }
    return parts.join(', ');
  };

  return (
    <Card 
      className={cn(
        'overflow-hidden transition-shadow hover:shadow-lg',
        onFlightClick && 'cursor-pointer',
        className
      )}
      onClick={() => onFlightClick?.(flight)}
    >
      <CardHeader className={cn(
        'pb-4',
        isCompact ? 'p-4' : 'p-6'
      )}>
        {/* Flight Header */}
        <div className="space-y-3">
          {/* Flight Info and Status */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className={cn(
                  'font-bold text-tripnav-blue',
                  isCompact ? 'text-lg' : 'text-xl'
                )}>
                  {getFlightTypeLabel(flight.type)} Flight
                </h3>
                
                <Badge variant="outline" className={cn(
                  'font-medium',
                  getClassBadgeColor(flight.bookingClass),
                  isCompact ? 'text-xs' : 'text-sm'
                )}>
                  {flight.bookingClass} Class
                </Badge>

                {flight.price && (
                  <Badge variant="outline" className="text-tripnav-blue border-tripnav-blue">
                    {flight.price.currency}{flight.price.amount}
                  </Badge>
                )}
              </div>

              <div className="flex items-center gap-4 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar size={14} />
                  <span>Booking: {flight.bookingReference}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Users size={14} />
                  <span>{formatPassengerInfo()}</span>
                </div>
                
                <div className="flex items-center gap-1">
                  <Clock size={14} />
                  <span>Total: {flight.totalDuration}</span>
                </div>
              </div>
            </div>

            <FlightStatus 
              status={getOverallStatus()}
              variant={isCompact ? 'compact' : 'default'}
            />
          </div>

          {/* Progress Bar */}
          {showProgress && !isCompact && (
            <FlightProgress
              status={getOverallStatus()}
              departureTime={flight.segments[0]?.departure.time || ''}
              arrivalTime={flight.segments[flight.segments.length - 1]?.arrival.time || ''}
            />
          )}
        </div>
      </CardHeader>

      {/* Flight Timeline */}
      <CardContent className="pt-0">
        <FlightTimeline
          segments={flight.segments}
          {...(flight.layovers && { layovers: flight.layovers })}
          variant={isCompact ? 'compact' : 'default'}
          showTimezones={!isCompact}
        />

        {/* Detailed Information */}
        {isDetailed && (
          <div className="mt-6 space-y-4">
            {/* Airline Information for each segment */}
            <CollapsibleSection
              title="Flight Details"
              icon={<Plane size={20} />}
              defaultOpen={false}
            >
              <div className="space-y-4">
                {flight.segments.map((segment, index) => (
                  <div key={segment.id} className="border-l-2 border-tripnav-blue pl-4">
                    <div className="flex items-start justify-between gap-4">
                      <AirlineInfo
                        airline={segment.airline}
                        flightNumber={segment.flightNumber}
                        {...(segment.aircraft && { aircraft: segment.aircraft })}
                        class={segment.class}
                        variant="default"
                      />
                      <FlightStatus
                        status={segment.status}
                        {...(segment.delay && { delay: segment.delay })}
                        {...(segment.departure.gate && { gate: segment.departure.gate })}
                        variant="compact"
                      />
                    </div>
                    
                    {/* Gate and Terminal Info */}
                    {(segment.departure.gate || segment.departure.terminal || 
                      segment.arrival.gate || segment.arrival.terminal) && (
                      <div className="mt-2 text-sm text-gray-600 space-y-1">
                        {(segment.departure.gate || segment.departure.terminal) && (
                          <div>
                            Departure: {segment.departure.gate && `Gate ${segment.departure.gate}`}
                            {segment.departure.gate && segment.departure.terminal && ' • '}
                            {segment.departure.terminal && `Terminal ${segment.departure.terminal}`}
                          </div>
                        )}
                        {(segment.arrival.gate || segment.arrival.terminal) && (
                          <div>
                            Arrival: {segment.arrival.gate && `Gate ${segment.arrival.gate}`}
                            {segment.arrival.gate && segment.arrival.terminal && ' • '}
                            {segment.arrival.terminal && `Terminal ${segment.arrival.terminal}`}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CollapsibleSection>

            {/* Baggage Information */}
            {showBaggage && flight.baggage && (
              <CollapsibleSection
                title="Baggage Information"
                icon={<Luggage size={20} />}
                defaultOpen={false}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Carry-on</h4>
                    <p className="text-sm text-gray-600">{flight.baggage.carry}</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-1">Checked Baggage</h4>
                    <p className="text-sm text-gray-600">{flight.baggage.checked}</p>
                  </div>
                </div>
              </CollapsibleSection>
            )}

            {/* Seat Assignments */}
            {flight.seatAssignments && flight.seatAssignments.length > 0 && (
              <CollapsibleSection
                title="Seat Assignments"
                icon={<span className="text-lg">💺</span>}
                defaultOpen={false}
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {flight.seatAssignments.map((seat, index) => (
                    <Badge key={index} variant="outline" className="text-center justify-center">
                      {seat}
                    </Badge>
                  ))}
                </div>
              </CollapsibleSection>
            )}

            {/* Special Requests */}
            {flight.specialRequests && flight.specialRequests.length > 0 && (
              <CollapsibleSection
                title="Special Requests"
                icon={<span className="text-lg">⚠️</span>}
                defaultOpen={false}
              >
                <ul className="space-y-1">
                  {flight.specialRequests.map((request, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm">
                      <span className="w-1.5 h-1.5 bg-tripnav-orange rounded-full flex-shrink-0 mt-1.5" />
                      <span className="text-gray-700">{request}</span>
                    </li>
                  ))}
                </ul>
              </CollapsibleSection>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 