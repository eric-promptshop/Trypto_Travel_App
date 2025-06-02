'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// Base skeleton component
interface SkeletonProps {
  className?: string;
  variant?: 'default' | 'circular' | 'rectangular';
  animation?: 'pulse' | 'wave' | 'none';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'default',
  animation = 'pulse',
}) => {
  return (
    <div
      className={cn(
        'bg-gray-200',
        variant === 'circular' && 'rounded-full',
        variant === 'rectangular' && 'rounded-md',
        variant === 'default' && 'rounded-md',
        animation === 'pulse' && 'animate-pulse',
        animation === 'wave' && 'animate-shimmer',
        className
      )}
    />
  );
};

// Hotel card skeleton
export const HotelCardSkeleton: React.FC<{ variant?: 'compact' | 'default' | 'detailed' }> = ({
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  return (
    <div className={cn(
      'border border-gray-200 rounded-lg overflow-hidden bg-white',
      isCompact ? 'p-4' : 'p-6'
    )}>
      <div className={cn(
        'grid gap-4',
        isCompact ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-3'
      )}>
        {/* Image skeleton */}
        <div className="relative">
          <Skeleton className={cn(
            'w-full rounded-lg',
            isCompact ? 'h-40' : 'h-48 md:h-56'
          )} />
        </div>

        {/* Content skeleton */}
        <div className={cn(
          'space-y-3',
          !isCompact && 'md:col-span-2'
        )}>
          {/* Title and rating */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className={cn(
                'h-6',
                isCompact ? 'w-48' : 'w-64'
              )} />
              <div className="flex items-center gap-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} variant="circular" className="w-4 h-4" />
                ))}
              </div>
            </div>
            
            {/* Address */}
            <div className="flex items-start gap-2">
              <Skeleton variant="circular" className="w-4 h-4 mt-0.5" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>

          {/* Check-in/Check-out */}
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-24" />
          </div>

          {/* Description */}
          {!isCompact && (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          )}

          {/* Amenities */}
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: isCompact ? 4 : 8 }).map((_, i) => (
              <div key={i} className="flex items-center gap-1">
                <Skeleton variant="circular" className="w-4 h-4" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed sections */}
      {isDetailed && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="border-t border-gray-200 pt-4">
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Flight card skeleton
export const FlightCardSkeleton: React.FC<{ variant?: 'compact' | 'default' | 'detailed' }> = ({
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';
  const isDetailed = variant === 'detailed';

  return (
    <div className={cn(
      'border border-gray-200 rounded-lg overflow-hidden bg-white',
      isCompact ? 'p-4' : 'p-6'
    )}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Skeleton className={cn(
              'h-6',
              isCompact ? 'w-32' : 'w-40'
            )} />
            <Skeleton className="h-5 w-20" />
          </div>
          <div className="flex items-center gap-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="h-6 w-24" />
      </div>

      {/* Progress bar */}
      {!isCompact && (
        <div className="mb-4">
          <Skeleton className="h-2 w-full rounded-full" />
        </div>
      )}

      {/* Flight timeline */}
      <div className="space-y-4">
        <div className="border border-gray-200 rounded-lg p-4">
          {/* Flight header */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Skeleton variant="circular" className="w-5 h-5" />
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-16" />
            </div>
            <Skeleton className="h-4 w-20" />
          </div>

          {/* Timeline */}
          <div className="hidden sm:block">
            <div className="flex items-center justify-between">
              {/* Departure */}
              <div className="flex-1 text-left space-y-1">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-3 w-24" />
              </div>

              {/* Flight line */}
              <div className="flex-1 flex items-center justify-center px-4">
                <div className="flex items-center w-full">
                  <Skeleton variant="circular" className="w-3 h-3" />
                  <Skeleton className="flex-1 h-0.5 mx-2" />
                  <Skeleton variant="circular" className="w-3 h-3" />
                </div>
              </div>

              {/* Arrival */}
              <div className="flex-1 text-right space-y-1">
                <Skeleton className="h-6 w-16 ml-auto" />
                <Skeleton className="h-4 w-12 ml-auto" />
                <Skeleton className="h-4 w-20 ml-auto" />
                <Skeleton className="h-3 w-24 ml-auto" />
              </div>
            </div>
          </div>

          {/* Mobile timeline */}
          <div className="sm:hidden space-y-3">
            <div className="flex items-start gap-3">
              <Skeleton variant="circular" className="w-3 h-3 mt-1" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
            <div className="flex items-center gap-2 pl-6">
              <Skeleton variant="circular" className="w-4 h-4" />
              <Skeleton className="h-3 w-20" />
            </div>
            <div className="flex items-start gap-3">
              <Skeleton variant="circular" className="w-3 h-3 mt-1" />
              <div className="flex-1 space-y-1">
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-32" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed sections */}
      {isDetailed && (
        <div className="mt-6 space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="border-t border-gray-200 pt-4">
              <Skeleton className="h-5 w-32 mb-3" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// Day card skeleton
export const DayCardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Day header */}
      <div className="space-y-3">
        <Skeleton className="h-8 w-48" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* Activities */}
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>

      {/* Hotel section */}
      <div className="mt-6">
        <Skeleton className="h-6 w-32 mb-4" />
        <HotelCardSkeleton variant="compact" />
      </div>
    </div>
  );
};

// Image gallery skeleton
export const ImageGallerySkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="space-y-4">
      <Skeleton className="h-6 w-32" />
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    </div>
  );
};

// Map skeleton
export const MapSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('relative bg-gray-100 rounded-lg overflow-hidden', className)}>
      <Skeleton className="w-full h-full" />
      
      {/* Map controls skeleton */}
      <div className="absolute top-4 right-4 space-y-2">
        <Skeleton className="w-8 h-8 rounded" />
        <Skeleton className="w-8 h-8 rounded" />
      </div>
      
      {/* Map markers skeleton */}
      <div className="absolute top-1/4 left-1/3">
        <Skeleton variant="circular" className="w-6 h-6" />
      </div>
      <div className="absolute top-2/3 right-1/3">
        <Skeleton variant="circular" className="w-6 h-6" />
      </div>
      <div className="absolute bottom-1/4 left-1/2">
        <Skeleton variant="circular" className="w-6 h-6" />
      </div>
    </div>
  );
};

// Navigation skeleton
export const NavigationSkeleton: React.FC = () => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2">
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="flex-shrink-0 text-center">
          <Skeleton variant="circular" className="w-12 h-12 mx-auto mb-2" />
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-12 mt-1" />
        </div>
      ))}
    </div>
  );
}; 