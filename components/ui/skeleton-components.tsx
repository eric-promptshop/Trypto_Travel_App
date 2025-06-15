import React from 'react'
import { cn } from '@/lib/utils'

interface SkeletonProps {
  type?: 'map' | 'gallery' | 'chat' | 'day-selector' | 'itinerary'
  className?: string
}

export function Skeleton({ type = 'itinerary', className }: SkeletonProps) {
  if (type === 'map') {
    return (
      <div className={cn("h-full w-full bg-gray-100 animate-pulse relative", className)}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <div className="w-12 h-12 bg-gray-300 rounded-full mx-auto mb-2 animate-pulse" />
            <div className="h-4 bg-gray-300 rounded w-24 mx-auto animate-pulse" />
          </div>
        </div>
      </div>
    )
  }

  if (type === 'gallery') {
    return (
      <div className={cn("space-y-4 p-4", className)}>
        <div className="h-4 bg-gray-200 rounded w-32 animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="aspect-video bg-gray-200 rounded-lg animate-pulse" />
        ))}
      </div>
    )
  }

  if (type === 'chat') {
    return (
      <div className={cn("flex flex-col h-full bg-white", className)}>
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 animate-pulse" />
            </div>
          </div>
        </div>
        <div className="flex-1 p-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse" />
                <div className="flex-1 bg-gray-100 rounded-lg p-3">
                  <div className="h-3 bg-gray-200 rounded w-full animate-pulse mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-3/4 animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (type === 'day-selector') {
    return (
      <div className={cn("p-4 space-y-4", className)}>
        <div className="bg-gray-100 rounded-lg p-3">
          <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-2" />
          <div className="h-4 bg-gray-200 rounded w-48 animate-pulse" />
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  // Default itinerary skeleton
  return (
    <div className={cn("space-y-6", className)}>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse mb-4" />
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
          <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
        </div>
      </div>
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex gap-4">
            <div className="w-16 h-16 bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex-1">
              <div className="h-5 bg-gray-200 rounded w-32 animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse mb-2" />
              <div className="h-4 bg-gray-200 rounded w-2/3 animate-pulse" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}