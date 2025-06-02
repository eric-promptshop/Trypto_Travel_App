'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { 
  useNetworkCondition, 
  useAdaptiveImageQuality, 
  estimateImageLoadTime,
  NetworkCondition 
} from './network-detection';

export interface ImageSource {
  src: string;
  quality: 'low' | 'medium' | 'high' | 'original';
  width: number;
  height: number;
  sizeKB?: number;
}

export interface AdaptiveImageProps {
  sources: ImageSource[];
  alt: string;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  onLoad?: () => void;
  onError?: (error: Error) => void;
  onQualityChange?: (quality: string) => void;
  fallbackSrc?: string;
  maxRetries?: number;
  enableProgressive?: boolean;
  aspectRatio?: number;
}

interface LoadingState {
  isLoading: boolean;
  hasLoaded: boolean;
  hasError: boolean;
  currentQuality: string;
  retryCount: number;
  loadStartTime: number;
  estimatedLoadTime: number;
}

export const AdaptiveImage: React.FC<AdaptiveImageProps> = ({
  sources,
  alt,
  className,
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onError,
  onQualityChange,
  fallbackSrc,
  maxRetries = 3,
  enableProgressive = true,
  aspectRatio,
}) => {
  const networkCondition = useNetworkCondition();
  const { 
    recommendedQuality, 
    shouldPreload, 
    shouldUseProgressive 
  } = useAdaptiveImageQuality();

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    hasLoaded: false,
    hasError: false,
    currentQuality: 'low',
    retryCount: 0,
    loadStartTime: 0,
    estimatedLoadTime: 0,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout>();
  const loadTimeoutRef = useRef<NodeJS.Timeout>();

  // Get the appropriate image source based on quality
  const getImageSource = useCallback((quality: string): ImageSource | null => {
    const source = sources.find(s => s.quality === quality);
    if (source) return source;

    // Fallback to available qualities in order of preference
    const fallbackOrder = ['high', 'medium', 'low', 'original'];
    for (const fallbackQuality of fallbackOrder) {
      const fallback = sources.find(s => s.quality === fallbackQuality);
      if (fallback) return fallback;
    }

    return null;
  }, [sources]);

  // Get the progressive loading sequence
  const getProgressiveSequence = useCallback((): string[] => {
    if (!enableProgressive || !shouldUseProgressive) {
      return [recommendedQuality];
    }

    const availableQualities = sources.map(s => s.quality);
    const sequence: string[] = [];

    // Start with low quality if available
    if (availableQualities.includes('low')) {
      sequence.push('low');
    }

    // Add target quality if it's different
    if (recommendedQuality !== 'low') {
      sequence.push(recommendedQuality);
    }

    return sequence.length > 0 ? sequence : [recommendedQuality];
  }, [sources, recommendedQuality, enableProgressive, shouldUseProgressive]);

  // Load next quality in the sequence
  const loadNextQuality = useCallback((currentIndex: number = -1) => {
    const sequence = getProgressiveSequence();
    const nextIndex = currentIndex + 1;

    if (nextIndex >= sequence.length) {
      return; // No more qualities to load
    }

    const targetQuality = sequence[nextIndex];
    if (!targetQuality) return; // Safety check
    
    const imageSource = getImageSource(targetQuality);

    if (!imageSource) {
      if (fallbackSrc) {
        setLoadingState(prev => ({
          ...prev,
          currentQuality: 'fallback',
          isLoading: false,
          hasError: true,
        }));
      }
      return;
    }

    const estimatedTime = estimateImageLoadTime(
      imageSource.sizeKB || 100, 
      networkCondition
    );

    setLoadingState(prev => ({
      ...prev,
      isLoading: true,
      hasError: false,
      currentQuality: targetQuality,
      loadStartTime: Date.now(),
      estimatedLoadTime: estimatedTime,
    }));

    // Set timeout for load failure detection
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    loadTimeoutRef.current = setTimeout(() => {
      handleLoadError(new Error('Load timeout'), currentIndex);
    }, Math.max(estimatedTime * 2, 10000)); // 2x estimated time or 10s max
  }, [
    getProgressiveSequence, 
    getImageSource, 
    networkCondition, 
    fallbackSrc
  ]);

  // Handle successful image load
  const handleLoadSuccess = useCallback((currentIndex: number) => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    const sequence = getProgressiveSequence();
    const isLastInSequence = currentIndex >= sequence.length - 1;

    setLoadingState(prev => ({
      ...prev,
      isLoading: !isLastInSequence,
      hasLoaded: true,
      hasError: false,
      retryCount: 0,
    }));

    onLoad?.();
    onQualityChange?.(loadingState.currentQuality);

    // Load next quality if this wasn't the final one
    if (!isLastInSequence) {
      setTimeout(() => {
        loadNextQuality(currentIndex);
      }, 100); // Small delay between quality upgrades
    }
  }, [getProgressiveSequence, onLoad, onQualityChange, loadingState.currentQuality, loadNextQuality]);

  // Handle image load error with retry logic
  const handleLoadError = useCallback((error: Error, currentIndex: number) => {
    if (loadTimeoutRef.current) {
      clearTimeout(loadTimeoutRef.current);
    }

    const canRetry = loadingState.retryCount < maxRetries;
    
    if (canRetry) {
      const retryDelay = Math.min(1000 * Math.pow(2, loadingState.retryCount), 5000);
      
      setLoadingState(prev => ({
        ...prev,
        retryCount: prev.retryCount + 1,
        isLoading: false,
      }));

      retryTimeoutRef.current = setTimeout(() => {
        loadNextQuality(currentIndex - 1); // Retry current quality
      }, retryDelay);
    } else {
      setLoadingState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true,
      }));

      onError?.(error);

      // Try fallback if available
      if (fallbackSrc && currentIndex > 0) {
        setLoadingState(prev => ({
          ...prev,
          currentQuality: 'fallback',
          hasError: false,
        }));
      }
    }
  }, [loadingState.retryCount, maxRetries, loadNextQuality, onError, fallbackSrc]);

  // Start loading on mount or when conditions change
  useEffect(() => {
    if (!loadingState.hasLoaded || 
        loadingState.currentQuality !== recommendedQuality) {
      loadNextQuality(-1);
    }
  }, [recommendedQuality, loadNextQuality, loadingState.hasLoaded, loadingState.currentQuality]);

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      if (loadTimeoutRef.current) {
        clearTimeout(loadTimeoutRef.current);
      }
    };
  }, []);

  // Get current image source
  const currentSource = loadingState.currentQuality === 'fallback' 
    ? null 
    : getImageSource(loadingState.currentQuality);
  
  const imageSrc = currentSource?.src || fallbackSrc;

  if (!imageSrc) {
    return (
      <div 
        className={cn(
          'bg-gray-200 flex items-center justify-center text-gray-500',
          className
        )}
        style={{ aspectRatio }}
      >
        <span className="text-sm">No image available</span>
      </div>
    );
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      {/* Main image */}
      <Image
        src={imageSrc}
        alt={alt}
        width={currentSource?.width || 800}
        height={currentSource?.height || 600}
        priority={priority || shouldPreload}
        placeholder={placeholder}
        {...(blurDataURL && { blurDataURL })}
        className={cn(
          'transition-opacity duration-300',
          loadingState.isLoading && 'opacity-70',
          loadingState.hasError && 'opacity-50'
        )}
        onLoad={() => {
          const sequence = getProgressiveSequence();
          const currentIndex = sequence.indexOf(loadingState.currentQuality);
          handleLoadSuccess(currentIndex);
        }}
        onError={(e) => {
          const sequence = getProgressiveSequence();
          const currentIndex = sequence.indexOf(loadingState.currentQuality);
          handleLoadError(new Error('Image failed to load'), currentIndex);
        }}
        style={{ aspectRatio }}
      />

      {/* Loading overlay */}
      {loadingState.isLoading && (
        <div className="absolute inset-0 bg-gray-100 bg-opacity-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-6 h-6 border-2 border-tripnav-navy border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <div className="text-xs text-gray-600">
              Loading {loadingState.currentQuality} quality...
            </div>
            {loadingState.retryCount > 0 && (
              <div className="text-xs text-gray-500 mt-1">
                Retry {loadingState.retryCount}/{maxRetries}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error overlay */}
      {loadingState.hasError && !fallbackSrc && (
        <div className="absolute inset-0 bg-red-50 bg-opacity-90 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-600 mb-2">⚠️</div>
            <div className="text-xs text-red-700">Failed to load image</div>
            <button
              onClick={() => {
                setLoadingState(prev => ({
                  ...prev,
                  hasError: false,
                  retryCount: 0,
                }));
                loadNextQuality(-1);
              }}
              className="text-xs text-red-600 underline mt-1 hover:text-red-800"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Quality indicator (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="absolute top-1 right-1 bg-black bg-opacity-75 text-white text-xs px-1 py-0.5 rounded">
          {loadingState.currentQuality}
          {loadingState.isLoading && ' (loading)'}
          {loadingState.hasError && ' (error)'}
        </div>
      )}
    </div>
  );
};

// Hook for creating image sources from base URL
export function useImageSources(
  baseUrl: string,
  options: {
    qualities?: ('low' | 'medium' | 'high' | 'original')[];
    width: number;
    height: number;
    format?: 'webp' | 'jpg' | 'png' | 'auto';
    cloudName?: string; // Cloudinary cloud name (optional, uses demo if not provided)
    useCloudinaryFetch?: boolean; // Set to true to fetch external URLs via Cloudinary
  }
): ImageSource[] {
  const { 
    qualities = ['low', 'medium', 'high'], 
    width, 
    height, 
    format = 'auto',
    cloudName = 'demo', // Default to Cloudinary demo account
    useCloudinaryFetch = true, // Default to fetch mode for demo purposes
  } = options;

  return qualities.map(quality => {
    let qualityValue = 80;
    let sizeKB = 150; // Default estimate

    switch (quality) {
      case 'low':
        qualityValue = 30;
        sizeKB = 50;
        break;
      case 'medium':
        qualityValue = 60;
        sizeKB = 100;
        break;
      case 'high':
        qualityValue = 80;
        sizeKB = 200;
        break;
      case 'original':
        qualityValue = 95;
        sizeKB = 400;
        break;
    }

    let transformedUrl: string;

    if (useCloudinaryFetch) {
      // Fetch mode: Transform external images via Cloudinary
      const transformations = [
        `w_${width}`,
        `h_${height}`,
        'c_fill', // Crop and fill to exact dimensions
        `q_${qualityValue}`,
        `f_${format}`, // Auto format selection (WebP when supported)
      ].join(',');
      
      transformedUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/${transformations}/${encodeURIComponent(baseUrl)}`;
    } else {
      // Direct mode: Assume baseUrl is already a Cloudinary URL or public ID
      const transformations = [
        `w_${width}`,
        `h_${height}`,
        'c_fill',
        `q_${qualityValue}`,
        `f_${format}`,
      ].join(',');
      
      if (baseUrl.includes('cloudinary.com')) {
        // If it's already a full Cloudinary URL, inject transformations
        transformedUrl = baseUrl.replace(
          /\/image\/upload\//,
          `/image/upload/${transformations}/`
        );
      } else {
        // Treat as public ID
        transformedUrl = `https://res.cloudinary.com/${cloudName}/image/upload/${transformations}/${baseUrl}`;
      }
    }

    return {
      src: transformedUrl,
      quality,
      width,
      height,
      sizeKB,
    };
  });
}

export default AdaptiveImage; 