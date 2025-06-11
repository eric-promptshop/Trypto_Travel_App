import Image from 'next/image'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  priority?: boolean
  className?: string
  containerClassName?: string
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  fill?: boolean
  style?: React.CSSProperties
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

// Mobile-optimized default sizes
const MOBILE_SIZES = {
  default: '(max-width: 640px) 100vw, (max-width: 768px) 80vw, (max-width: 1024px) 50vw, 33vw',
  fullWidth: '100vw',
  card: '(max-width: 640px) 100vw, (max-width: 768px) 50vw, 33vw',
  thumbnail: '(max-width: 640px) 50vw, (max-width: 768px) 33vw, 25vw',
  hero: '100vw'
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className,
  containerClassName,
  sizes = MOBILE_SIZES.default,
  quality = 75, // Lower quality for mobile to save bandwidth
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  fill = false,
  style,
  objectFit = 'cover'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)

  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }

  // Generate blur data URL if not provided
  const defaultBlurDataURL = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='

  if (fill) {
    return (
      <div className={cn('relative overflow-hidden', containerClassName)}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          quality={quality}
          priority={priority}
          placeholder={placeholder}
          blurDataURL={blurDataURL || defaultBlurDataURL}
          onLoad={handleLoad}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className
          )}
          style={{
            objectFit,
            ...style
          }}
        />
        {isLoading && placeholder === 'empty' && (
          <div className="absolute inset-0 bg-gray-200 animate-pulse" />
        )}
      </div>
    )
  }

  return (
    <div className={cn('relative', containerClassName)}>
      <Image
        src={src}
        alt={alt}
        width={width || 800}
        height={height || 600}
        sizes={sizes}
        quality={quality}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={blurDataURL || defaultBlurDataURL}
        onLoad={handleLoad}
        className={cn(
          'transition-opacity duration-300',
          isLoading ? 'opacity-0' : 'opacity-100',
          className
        )}
        style={style}
      />
      {isLoading && placeholder === 'empty' && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
    </div>
  )
}

// Export preset configurations for common use cases
export const ImagePresets = {
  hero: {
    sizes: MOBILE_SIZES.hero,
    quality: 85,
    priority: true
  },
  card: {
    sizes: MOBILE_SIZES.card,
    quality: 75,
    priority: false
  },
  thumbnail: {
    sizes: MOBILE_SIZES.thumbnail,
    quality: 70,
    priority: false
  }
} 