'use client'

import React, { useState, useEffect, useRef, Suspense } from 'react'
import dynamic from 'next/dynamic'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/skeleton'

interface LazyComponentProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  rootMargin?: string
  threshold?: number | number[]
  className?: string
  minHeight?: string | number
  onVisible?: () => void
}

export function LazyComponent({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.01,
  className,
  minHeight = 200,
  onVisible
}: LazyComponentProps) {
  const [isVisible, setIsVisible] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVisible) {
            setIsVisible(true)
            onVisible?.()
            observer.disconnect()
          }
        })
      },
      {
        rootMargin,
        threshold
      }
    )

    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
    }
  }, [isVisible, rootMargin, threshold, onVisible])

  return (
    <div
      ref={containerRef}
      className={cn('relative', className)}
      style={{ minHeight }}
    >
      {isVisible ? (
        <Suspense fallback={fallback || <DefaultFallback minHeight={minHeight} />}>
          {children}
        </Suspense>
      ) : (
        fallback || <DefaultFallback minHeight={minHeight} />
      )}
    </div>
  )
}

// Default fallback component
function DefaultFallback({ minHeight }: { minHeight: string | number }) {
  return (
    <div className="w-full" style={{ minHeight }}>
      <Skeleton className="w-full h-full" />
    </div>
  )
}

// Helper function for creating lazy loaded components with custom loading
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options?: {
    fallback?: React.ReactNode
    ssr?: boolean
  }
) {
  return dynamic(importFn, {
    loading: () => options?.fallback || <DefaultFallback minHeight={200} />,
    ssr: options?.ssr ?? false
  })
}

// Pre-built lazy components for common heavy components
export const LazyMap = createLazyComponent(
  () => import('@/components/interactive-map').then(mod => ({ default: mod.InteractiveMap })),
  { 
    fallback: (
      <div className="w-full h-[400px] bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
    ssr: false 
  }
)

export const LazyLeafletMap = createLazyComponent(
  () => import('@/components/LeafletMapLoader').then(mod => ({ default: mod.LeafletMapLoader })),
  { 
    fallback: (
      <div className="w-full h-[400px] bg-gray-100 animate-pulse flex items-center justify-center">
        <p className="text-gray-500">Loading map...</p>
      </div>
    ),
    ssr: false 
  }
)

// Utility to preload components when user is likely to need them
export function preloadComponent(
  importFn: () => Promise<any>
) {
  if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn()
    })
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      importFn()
    }, 1)
  }
} 