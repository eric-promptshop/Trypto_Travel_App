'use client'

import React, { useState, useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

interface ResponsiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  className?: string
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
}

// Default sizes for responsive images
const DEFAULT_SIZES = '(max-width: 640px) 100vw, (max-width: 768px) 80vw, (max-width: 1024px) 50vw, 33vw'

// Breakpoints for srcset generation
const BREAKPOINTS = [375, 640, 768, 1024, 1280, 1920]

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  sizes = DEFAULT_SIZES,
  priority = false,
  className,
  placeholder = 'blur',
  blurDataURL,
  onLoad
}: ResponsiveImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const imgRef = useRef<HTMLImageElement>(null)

  // Generate srcset for different sizes
  const generateSrcSet = (baseSrc: string, format?: string) => {
    const extension = format || baseSrc.split('.').pop()
    const baseUrl = baseSrc.replace(/\.[^/.]+$/, '')
    
    return BREAKPOINTS
      .map(bp => `${baseUrl}-${bp}w.${extension} ${bp}w`)
      .join(', ')
  }

  // Use Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !imgRef.current) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.01
      }
    )

    observer.observe(imgRef.current)

    return () => {
      observer.disconnect()
    }
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  // Generate placeholder styles
  const placeholderStyles = placeholder === 'blur' && blurDataURL
    ? { backgroundImage: `url(${blurDataURL})`, backgroundSize: 'cover' }
    : {}

  // Calculate aspect ratio for placeholder
  const aspectRatio = width && height ? height / width : undefined
  const paddingBottom = aspectRatio ? `${aspectRatio * 100}%` : undefined

  return (
    <div 
      className={cn(
        'relative overflow-hidden bg-gray-100',
        className
      )}
      style={{
        paddingBottom: paddingBottom,
        ...placeholderStyles
      }}
    >
      {/* Main image */}
      {isInView && (
        <picture>
          {/* WebP format for modern browsers */}
          <source
            type="image/webp"
            srcSet={generateSrcSet(src, 'webp')}
            sizes={sizes}
          />
          
          {/* Fallback to original format */}
          <source
            srcSet={generateSrcSet(src)}
            sizes={sizes}
          />
          
          {/* Fallback img tag */}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            width={width}
            height={height}
            loading={priority ? 'eager' : 'lazy'}
            decoding="async"
            onLoad={handleLoad}
            className={cn(
              'absolute inset-0 w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
        </picture>
      )}
      
      {/* Loading placeholder */}
      {!isLoaded && placeholder === 'blur' && blurDataURL && (
        <div 
          className="absolute inset-0 animate-pulse"
          style={{
            backgroundImage: `url(${blurDataURL})`,
            backgroundSize: 'cover',
            filter: 'blur(20px)',
            transform: 'scale(1.1)'
          }}
        />
      )}
      
      {/* Skeleton loader for empty placeholder */}
      {!isLoaded && placeholder === 'empty' && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
} 