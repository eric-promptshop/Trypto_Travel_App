'use client';

import React from 'react';
import { Plane, Clock, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
    date: string;
    timezone: string;
  };
  duration: string;
  aircraft?: string;
  class: 'economy' | 'business' | 'first';
}

interface LayoverInfo {
  airport: string;
  city: string;
  duration: string;
  terminal?: string;
}

export interface FlightTimelineProps {
  segments: FlightSegment[];
  layovers?: LayoverInfo[];
  variant?: 'default' | 'compact';
  className?: string | undefined;
  showTimezones?: boolean;
}

export const FlightTimeline: React.FC<FlightTimelineProps> = ({
  segments,
  layovers = [],
  variant = 'default',
  className,
  showTimezones = true,
}) => {
  const isCompact = variant === 'compact';

  const formatTime = (time: string, timezone: string) => {
    if (!showTimezones) return time;
    return `${time} (${timezone})`;
  };

  const formatDuration = (duration: string) => {
    // Convert duration like "2h 30m" to a more readable format
    return duration.replace('h', ' hr ').replace('m', ' min');
  };

  const getClassBadgeColor = (flightClass: FlightSegment['class']) => {
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

  return (
    <div className={cn('space-y-4', className)}>
      {segments.map((segment, segmentIndex) => (
        <div key={segment.id} className="relative">
          {/* Flight Segment */}
          <div className={cn(
            'border border-gray-200 rounded-lg p-4 bg-white',
            isCompact ? 'p-3' : 'p-4'
          )}>
            {/* Flight Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-tripnav-blue">
                  <Plane size={isCompact ? 16 : 20} />
                  <span className={cn(
                    'font-semibold',
                    isCompact ? 'text-sm' : 'text-base'
                  )}>
                    {segment.airline} {segment.flightNumber}
                  </span>
                </div>
                <div className={cn(
                  'px-2 py-1 rounded border text-xs font-medium capitalize',
                  getClassBadgeColor(segment.class)
                )}>
                  {segment.class}
                </div>
              </div>
              
              <div className="flex items-center gap-1 text-gray-600">
                <Clock size={14} />
                <span className={cn(
                  'text-sm font-medium',
                  isCompact ? 'text-xs' : 'text-sm'
                )}>
                  {formatDuration(segment.duration)}
                </span>
              </div>
            </div>

            {/* Timeline Visual */}
            <div className="relative">
              {/* Desktop Timeline */}
              <div className="hidden sm:block">
                <div className="flex items-center justify-between">
                  {/* Departure */}
                  <div className="flex-1 text-left">
                    <div className={cn(
                      'font-bold text-tripnav-blue',
                      isCompact ? 'text-lg' : 'text-xl'
                    )}>
                      {segment.departure.time}
                    </div>
                    <div className={cn(
                      'text-gray-600',
                      isCompact ? 'text-xs' : 'text-sm'
                    )}>
                      {formatTime('', segment.departure.timezone)}
                    </div>
                    <div className={cn(
                      'font-medium text-gray-900',
                      isCompact ? 'text-sm' : 'text-base'
                    )}>
                      {segment.departure.airport}
                    </div>
                    <div className={cn(
                      'text-gray-600',
                      isCompact ? 'text-xs' : 'text-sm'
                    )}>
                      {segment.departure.city}
                    </div>
                    {segment.departure.date && (
                      <div className={cn(
                        'text-gray-500',
                        isCompact ? 'text-xs' : 'text-sm'
                      )}>
                        {segment.departure.date}
                      </div>
                    )}
                  </div>

                  {/* Flight Line */}
                  <div className="flex-1 flex items-center justify-center px-4">
                    <div className="flex items-center w-full">
                      <div className="w-3 h-3 bg-tripnav-blue rounded-full"></div>
                      <div className="flex-1 h-0.5 bg-gradient-to-r from-tripnav-blue to-tripnav-orange relative">
                        <Plane 
                          className="absolute top-1/2 left-1/2 transform -translate-y-1/2 -translate-x-1/2 text-tripnav-orange" 
                          size={16} 
                        />
                      </div>
                      <div className="w-3 h-3 bg-tripnav-orange rounded-full"></div>
                    </div>
                  </div>

                  {/* Arrival */}
                  <div className="flex-1 text-right">
                    <div className={cn(
                      'font-bold text-tripnav-orange',
                      isCompact ? 'text-lg' : 'text-xl'
                    )}>
                      {segment.arrival.time}
                    </div>
                    <div className={cn(
                      'text-gray-600',
                      isCompact ? 'text-xs' : 'text-sm'
                    )}>
                      {formatTime('', segment.arrival.timezone)}
                    </div>
                    <div className={cn(
                      'font-medium text-gray-900',
                      isCompact ? 'text-sm' : 'text-base'
                    )}>
                      {segment.arrival.airport}
                    </div>
                    <div className={cn(
                      'text-gray-600',
                      isCompact ? 'text-xs' : 'text-sm'
                    )}>
                      {segment.arrival.city}
                    </div>
                    {segment.arrival.date && (
                      <div className={cn(
                        'text-gray-500',
                        isCompact ? 'text-xs' : 'text-sm'
                      )}>
                        {segment.arrival.date}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Mobile Timeline */}
              <div className="sm:hidden space-y-3">
                {/* Departure */}
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-tripnav-blue rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-tripnav-blue">
                        {segment.departure.time}
                      </span>
                      {showTimezones && (
                        <span className="text-xs text-gray-600">
                          {segment.departure.timezone}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {segment.departure.airport} - {segment.departure.city}
                    </div>
                    {segment.departure.date && (
                      <div className="text-xs text-gray-500">
                        {segment.departure.date}
                      </div>
                    )}
                  </div>
                </div>

                {/* Flight Path */}
                <div className="flex items-center gap-2 pl-6">
                  <div className="flex items-center gap-1 text-tripnav-blue">
                    <Plane size={14} />
                    <span className="text-sm">
                      {formatDuration(segment.duration)}
                    </span>
                  </div>
                  {segment.aircraft && (
                    <span className="text-xs text-gray-500">
                      {segment.aircraft}
                    </span>
                  )}
                </div>

                {/* Arrival */}
                <div className="flex items-start gap-3">
                  <div className="w-3 h-3 bg-tripnav-orange rounded-full mt-1"></div>
                  <div className="flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-tripnav-orange">
                        {segment.arrival.time}
                      </span>
                      {showTimezones && (
                        <span className="text-xs text-gray-600">
                          {segment.arrival.timezone}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-medium text-gray-900">
                      {segment.arrival.airport} - {segment.arrival.city}
                    </div>
                    {segment.arrival.date && (
                      <div className="text-xs text-gray-500">
                        {segment.arrival.date}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Layover Info */}
          {layovers[segmentIndex] && (
            <div className="flex items-center justify-center py-2">
              <div className={cn(
                'bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2 text-center',
                isCompact ? 'px-2 py-1' : 'px-3 py-2'
              )}>
                <div className="flex items-center gap-1 justify-center text-yellow-700">
                  <MapPin size={14} />
                  <span className={cn(
                    'font-medium',
                    isCompact ? 'text-xs' : 'text-sm'
                  )}>
                    Layover in {layovers[segmentIndex]!.city}
                  </span>
                </div>
                <div className={cn(
                  'text-yellow-600',
                  isCompact ? 'text-xs' : 'text-sm'
                )}>
                  {layovers[segmentIndex]!.duration}
                  {layovers[segmentIndex]!.terminal && 
                    ` • Terminal ${layovers[segmentIndex]!.terminal}`
                  }
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}; 