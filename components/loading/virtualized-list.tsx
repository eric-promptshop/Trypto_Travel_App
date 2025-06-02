'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  containerHeight: number;
  renderItem: (item: T, index: number, isVisible: boolean) => React.ReactNode;
  overscan?: number; // Number of items to render outside viewport
  className?: string;
  onScroll?: (scrollTop: number) => void;
  getItemKey?: (item: T, index: number) => string | number;
}

export function VirtualizedList<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className,
  onScroll,
  getItemKey = (_item: T, index: number) => index,
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout>();
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    // Add overscan
    const startIndex = Math.max(0, visibleStart - overscan);
    const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

    return { startIndex, endIndex, visibleStart, visibleEnd };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Handle scroll events with throttling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const newScrollTop = event.currentTarget.scrollTop;
    setScrollTop(newScrollTop);
    setIsScrolling(true);
    
    onScroll?.(newScrollTop);

    // Clear existing timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // Set scrolling to false after delay
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
    }, 150);
  }, [onScroll]);

  // Calculate total height and offset
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn('overflow-auto', className)}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      {/* Total height container */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          {visibleItems.map((item, relativeIndex) => {
            const absoluteIndex = visibleRange.startIndex + relativeIndex;
            const isVisible = absoluteIndex >= visibleRange.visibleStart && 
                            absoluteIndex <= visibleRange.visibleEnd;
            
            return (
              <div
                key={getItemKey(item, absoluteIndex)}
                style={{ height: itemHeight }}
                className={cn(
                  'transition-opacity duration-200',
                  isScrolling && !isVisible && 'opacity-50'
                )}
              >
                {renderItem(item, absoluteIndex, isVisible)}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// Hook for managing virtualized list state
export interface UseVirtualizedListOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
  throttleMs?: number;
}

export function useVirtualizedList<T>(
  items: T[],
  options: UseVirtualizedListOptions
) {
  const [scrollTop, setScrollTop] = useState(0);
  const [isScrolling, setIsScrolling] = useState(false);
  const throttleTimeoutRef = useRef<NodeJS.Timeout>();

  const { itemHeight, containerHeight, overscan = 5, throttleMs = 16 } = options;

  // Calculate visible range
  const visibleRange = useMemo(() => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = Math.min(
      visibleStart + Math.ceil(containerHeight / itemHeight),
      items.length - 1
    );

    const startIndex = Math.max(0, visibleStart - overscan);
    const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

    return { startIndex, endIndex, visibleStart, visibleEnd };
  }, [scrollTop, itemHeight, containerHeight, items.length, overscan]);

  // Throttled scroll handler
  const handleScroll = useCallback((newScrollTop: number) => {
    if (throttleTimeoutRef.current) {
      clearTimeout(throttleTimeoutRef.current);
    }

    throttleTimeoutRef.current = setTimeout(() => {
      setScrollTop(newScrollTop);
    }, throttleMs);

    setIsScrolling(true);
    
    // Clear scrolling state after delay
    setTimeout(() => setIsScrolling(false), 150);
  }, [throttleMs]);

  // Get visible items
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex + 1);
  }, [items, visibleRange.startIndex, visibleRange.endIndex]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (throttleTimeoutRef.current) {
        clearTimeout(throttleTimeoutRef.current);
      }
    };
  }, []);

  return {
    visibleRange,
    visibleItems,
    scrollTop,
    isScrolling,
    handleScroll,
    totalHeight: items.length * itemHeight,
    offsetY: visibleRange.startIndex * itemHeight,
  };
}

// Intersection Observer hook for detecting when items enter/leave viewport
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
) {
  const [entries, setEntries] = useState<Map<Element, IntersectionObserverEntry>>(
    new Map()
  );
  const observerRef = useRef<IntersectionObserver>();

  const observe = useCallback((element: Element) => {
    if (!observerRef.current) {
      observerRef.current = new IntersectionObserver((entries) => {
        setEntries(prev => {
          const newMap = new Map(prev);
          entries.forEach(entry => {
            newMap.set(entry.target, entry);
          });
          return newMap;
        });
      }, options);
    }

    observerRef.current.observe(element);

    return () => {
      observerRef.current?.unobserve(element);
    };
  }, [options]);

  const unobserve = useCallback((element: Element) => {
    observerRef.current?.unobserve(element);
    setEntries(prev => {
      const newMap = new Map(prev);
      newMap.delete(element);
      return newMap;
    });
  }, []);

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
    };
  }, []);

  return { entries, observe, unobserve };
}

// Component for lazy loading individual items
interface LazyItemProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  rootMargin?: string;
  threshold?: number;
  onVisible?: () => void;
  once?: boolean;
}

export const LazyItem: React.FC<LazyItemProps> = ({
  children,
  fallback,
  className,
  rootMargin = '50px',
  threshold = 0.1,
  onVisible,
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  const { observe, unobserve } = useIntersectionObserver({
    rootMargin,
    threshold,
  });

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const cleanup = observe(element);

    return cleanup;
  }, [observe]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        
        if (entry.isIntersecting) {
          setIsVisible(true);
          setHasBeenVisible(true);
          onVisible?.();

          if (once) {
            unobserve(element);
          }
        } else {
          if (!once) {
            setIsVisible(false);
          }
        }
      },
      { rootMargin, threshold }
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [rootMargin, threshold, onVisible, once, unobserve]);

  const shouldRender = once ? hasBeenVisible : isVisible;

  return (
    <div ref={elementRef} className={className}>
      {shouldRender ? children : fallback}
    </div>
  );
}; 