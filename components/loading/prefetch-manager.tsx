'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useLoadingPriorityQueue, LoadingTask, LoadingPriority } from './loading-priority-queue';

export interface PrefetchConfig {
  adjacentDays: number; // Number of adjacent days to prefetch
  prefetchRadius: number; // Prefetch items N positions away from current
  maxPrefetchItems: number; // Maximum items to prefetch at once
  prefetchDelay: number; // Delay before starting prefetch (ms)
  viewportMargin: string; // Intersection observer margin
  throttleMs: number; // Throttle scroll events
}

export interface ItineraryDay {
  id: string;
  date: string;
  hotels: any[];
  flights: any[];
  activities: any[];
  images: string[];
}

export interface PrefetchableItem {
  id: string;
  type: 'hotel' | 'flight' | 'activity' | 'image' | 'day';
  dayId: string;
  priority: LoadingPriority;
  loadFn: () => Promise<void>;
  estimatedSize?: number; // In bytes
  dependencies?: string[];
}

const DEFAULT_CONFIG: PrefetchConfig = {
  adjacentDays: 2,
  prefetchRadius: 3,
  maxPrefetchItems: 10,
  prefetchDelay: 1000,
  viewportMargin: '200px',
  throttleMs: 100,
};

export class PrefetchManager {
  private config: PrefetchConfig;
  private currentDayIndex = 0;
  private totalDays = 0;
  private prefetchQueue: Map<string, PrefetchableItem> = new Map();
  private prefetchedItems: Set<string> = new Set();
  private intersectionObserver?: IntersectionObserver;
  private prefetchTimeouts: Map<string, NodeJS.Timeout> = new Map();
  private loadingQueue: any; // LoadingPriorityQueue instance
  private userInteractionData = {
    viewTime: new Map<string, number>(),
    scrollDirection: 'down' as 'up' | 'down',
    lastScrollTime: 0,
    averageViewTime: 3000, // Default 3 seconds
  };

  constructor(config: Partial<PrefetchConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  setLoadingQueue(queue: any): void {
    this.loadingQueue = queue;
  }

  // Update current day and trigger adjacent prefetching
  updateCurrentDay(dayIndex: number, totalDays: number): void {
    const oldIndex = this.currentDayIndex;
    this.currentDayIndex = dayIndex;
    this.totalDays = totalDays;

    // Determine scroll direction
    if (dayIndex > oldIndex) {
      this.userInteractionData.scrollDirection = 'down';
    } else if (dayIndex < oldIndex) {
      this.userInteractionData.scrollDirection = 'up';
    }

    this.userInteractionData.lastScrollTime = Date.now();
    this.schedulePrefetch();
  }

  // Add items to prefetch queue
  addPrefetchItems(items: PrefetchableItem[]): void {
    items.forEach(item => {
      this.prefetchQueue.set(item.id, item);
    });
  }

  // Remove items from prefetch queue
  removePrefetchItems(itemIds: string[]): void {
    itemIds.forEach(id => {
      this.prefetchQueue.delete(id);
      const timeout = this.prefetchTimeouts.get(id);
      if (timeout) {
        clearTimeout(timeout);
        this.prefetchTimeouts.delete(id);
      }
    });
  }

  // Track user interaction patterns
  trackViewTime(itemId: string, startTime: number, endTime: number): void {
    const viewTime = endTime - startTime;
    this.userInteractionData.viewTime.set(itemId, viewTime);
    
    // Update average view time
    const allViewTimes = Array.from(this.userInteractionData.viewTime.values());
    this.userInteractionData.averageViewTime = 
      allViewTimes.reduce((sum, time) => sum + time, 0) / allViewTimes.length;
  }

  // Schedule prefetching with delay
  private schedulePrefetch(): void {
    // Clear existing prefetch timeouts
    this.prefetchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.prefetchTimeouts.clear();

    const timeout = setTimeout(() => {
      this.executePrefetch();
    }, this.config.prefetchDelay);

    this.prefetchTimeouts.set('main', timeout);
  }

  // Execute prefetching logic
  private executePrefetch(): void {
    if (!this.loadingQueue) return;

    const itemsToPrefetch = this.selectItemsToPrefetch();
    
    itemsToPrefetch.forEach(item => {
      if (!this.prefetchedItems.has(item.id)) {
        const task: LoadingTask = {
          id: `prefetch_${item.id}`,
          priority: this.adjustPriorityBasedOnContext(item),
          dependencies: item.dependencies || [],
          load: async () => {
            await item.loadFn();
            this.prefetchedItems.add(item.id);
          },
        };

        this.loadingQueue.addTask(task);
      }
    });
  }

  // Select items to prefetch based on various factors
  private selectItemsToPrefetch(): PrefetchableItem[] {
    const items: PrefetchableItem[] = [];
    
    // 1. Adjacent days
    const adjacentDayItems = this.getAdjacentDayItems();
    items.push(...adjacentDayItems);

    // 2. Items in viewport or near viewport
    const nearbyItems = this.getNearbyItems();
    items.push(...nearbyItems);

    // 3. High-priority items based on user patterns
    const priorityItems = this.getPriorityItems();
    items.push(...priorityItems);

    // Remove duplicates and sort by priority
    const uniqueItems = Array.from(
      new Map(items.map(item => [item.id, item])).values()
    );

    // Sort by priority and user patterns
    uniqueItems.sort((a, b) => {
      const aPriority = this.calculatePrefetchScore(a);
      const bPriority = this.calculatePrefetchScore(b);
      return bPriority - aPriority;
    });

    // Limit to max prefetch items
    return uniqueItems.slice(0, this.config.maxPrefetchItems);
  }

  // Get items from adjacent days
  private getAdjacentDayItems(): PrefetchableItem[] {
    const items: PrefetchableItem[] = [];
    const { adjacentDays } = this.config;

    for (let offset = 1; offset <= adjacentDays; offset++) {
      // Next days
      const nextDayIndex = this.currentDayIndex + offset;
      if (nextDayIndex < this.totalDays) {
        const nextDayItems = this.getItemsForDay(nextDayIndex);
        items.push(...nextDayItems);
      }

      // Previous days (if scrolling up or user pattern suggests)
      if (this.userInteractionData.scrollDirection === 'up' || offset === 1) {
        const prevDayIndex = this.currentDayIndex - offset;
        if (prevDayIndex >= 0) {
          const prevDayItems = this.getItemsForDay(prevDayIndex);
          items.push(...prevDayItems);
        }
      }
    }

    return items;
  }

  // Get items near current viewport
  private getNearbyItems(): PrefetchableItem[] {
    const items: PrefetchableItem[] = [];
    const { prefetchRadius } = this.config;

    // This would typically integrate with intersection observer data
    // For now, we'll simulate getting items near current position
    Array.from(this.prefetchQueue.values())
      .filter(item => {
        // Simulate distance calculation
        const itemDayIndex = this.getDayIndexForItem(item);
        const distance = Math.abs(itemDayIndex - this.currentDayIndex);
        return distance <= prefetchRadius;
      })
      .forEach(item => items.push(item));

    return items;
  }

  // Get high-priority items based on user patterns
  private getPriorityItems(): PrefetchableItem[] {
    return Array.from(this.prefetchQueue.values())
      .filter(item => {
        // Prioritize items that are typically viewed longer
        const estimatedViewTime = this.estimateViewTime(item);
        return estimatedViewTime > this.userInteractionData.averageViewTime * 0.8;
      })
      .slice(0, 5); // Limit high-priority items
  }

  // Calculate prefetch score for an item
  private calculatePrefetchScore(item: PrefetchableItem): number {
    let score = 0;

    // Base priority
    const priorityWeights = {
      critical: 1000,
      high: 500,
      medium: 100,
      low: 50,
      background: 10,
    };
    score += priorityWeights[item.priority];

    // Distance from current day
    const dayDistance = Math.abs(this.getDayIndexForItem(item) - this.currentDayIndex);
    score -= dayDistance * 20;

    // Item type priority
    const typeWeights = {
      hotel: 100,
      flight: 80,
      activity: 60,
      image: 40,
      day: 120,
    };
    score += typeWeights[item.type];

    // User interaction patterns
    const estimatedViewTime = this.estimateViewTime(item);
    score += (estimatedViewTime / 1000) * 10; // 10 points per second

    // Size consideration (smaller items get higher priority)
    if (item.estimatedSize) {
      score -= Math.log(item.estimatedSize / 1024) * 5; // Penalty for larger items
    }

    return Math.max(0, score);
  }

  // Adjust priority based on current context
  private adjustPriorityBasedOnContext(item: PrefetchableItem): LoadingPriority {
    const baseScore = this.calculatePrefetchScore(item);
    
    if (baseScore > 800) return 'high';
    if (baseScore > 400) return 'medium';
    if (baseScore > 100) return 'low';
    return 'background';
  }

  // Helper methods
  private getItemsForDay(dayIndex: number): PrefetchableItem[] {
    return Array.from(this.prefetchQueue.values())
      .filter(item => this.getDayIndexForItem(item) === dayIndex);
  }

  private getDayIndexForItem(item: PrefetchableItem): number {
    // This would typically be calculated based on item.dayId
    // For now, return a mock value
    return parseInt(item.dayId.replace('day-', '')) || 0;
  }

  private estimateViewTime(item: PrefetchableItem): number {
    // Get actual view time if available
    const actualViewTime = this.userInteractionData.viewTime.get(item.id);
    if (actualViewTime) return actualViewTime;

    // Estimate based on item type
    const estimatedTimes = {
      hotel: 5000,
      flight: 3000,
      activity: 4000,
      image: 2000,
      day: 8000,
    };

    return estimatedTimes[item.type] || this.userInteractionData.averageViewTime;
  }

  // Cleanup
  cleanup(): void {
    this.prefetchTimeouts.forEach(timeout => clearTimeout(timeout));
    this.prefetchTimeouts.clear();
    this.intersectionObserver?.disconnect();
  }
}

// React hook for prefetch management
export function usePrefetchManager(config?: Partial<PrefetchConfig>) {
  const [manager] = useState(() => new PrefetchManager(config));
  const { addTask, removeTask, updatePriority, clear } = useLoadingPriorityQueue();
  const mountedRef = useRef(true);

  // Connect manager to loading queue
  useEffect(() => {
    manager.setLoadingQueue({ addTask, removeTask, updatePriority, clear });
  }, [manager, addTask, removeTask, updatePriority, clear]);

  const updateCurrentDay = useCallback((dayIndex: number, totalDays: number) => {
    manager.updateCurrentDay(dayIndex, totalDays);
  }, [manager]);

  const addPrefetchItems = useCallback((items: PrefetchableItem[]) => {
    manager.addPrefetchItems(items);
  }, [manager]);

  const removePrefetchItems = useCallback((itemIds: string[]) => {
    manager.removePrefetchItems(itemIds);
  }, [manager]);

  const trackViewTime = useCallback((itemId: string, startTime: number, endTime: number) => {
    manager.trackViewTime(itemId, startTime, endTime);
  }, [manager]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      manager.cleanup();
    };
  }, [manager]);

  return {
    updateCurrentDay,
    addPrefetchItems,
    removePrefetchItems,
    trackViewTime,
  };
}

// Hook for tracking item view time
export function useViewTimeTracker(itemId: string, onViewTimeUpdate?: (viewTime: number) => void) {
  const startTimeRef = useRef<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const startTracking = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsVisible(true);
  }, []);

  const stopTracking = useCallback(() => {
    if (startTimeRef.current) {
      const endTime = Date.now();
      const viewTime = endTime - startTimeRef.current;
      onViewTimeUpdate?.(viewTime);
      startTimeRef.current = null;
    }
    setIsVisible(false);
  }, [onViewTimeUpdate]);

  // Auto track on mount/unmount
  useEffect(() => {
    startTracking();
    return stopTracking;
  }, [startTracking, stopTracking]);

  return {
    isVisible,
    startTracking,
    stopTracking,
  };
} 