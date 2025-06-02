'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';

// Import our loading system components
import { 
  VirtualizedList, 
  LazyItem, 
  useIntersectionObserver 
} from './virtualized-list';
import { 
  HotelCardSkeleton, 
  FlightCardSkeleton, 
  DayCardSkeleton,
  MapSkeleton,
  NavigationSkeleton 
} from './skeleton-components';
import { 
  useLoadingPriorityQueue, 
  LoadingPriority 
} from './loading-priority-queue';
import { 
  usePrefetchManager, 
  PrefetchableItem,
  useViewTimeTracker 
} from './prefetch-manager';

export interface ProgressiveLoadingConfig {
  enableVirtualization?: boolean;
  enablePrefetch?: boolean;
  itemHeight?: number;
  containerHeight?: number;
  prefetchRadius?: number;
  maxConcurrentLoads?: number;
  skeletonVariant?: 'default' | 'compact' | 'detailed';
  loadingThreshold?: number; // Percentage of viewport to trigger loading
}

export interface LoadableItineraryItem {
  id: string;
  type: 'day' | 'hotel' | 'flight' | 'activity';
  dayId: string;
  data?: any;
  isLoaded?: boolean;
  isLoading?: boolean;
  error?: Error | null;
  priority?: LoadingPriority;
  estimatedSize?: number;
  loadFn: () => Promise<any>;
  renderFn: (data: any, isLoading: boolean) => React.ReactNode;
  skeletonFn?: () => React.ReactNode;
}

const DEFAULT_CONFIG: ProgressiveLoadingConfig = {
  enableVirtualization: true,
  enablePrefetch: true,
  itemHeight: 400,
  containerHeight: 600,
  prefetchRadius: 3,
  maxConcurrentLoads: 3,
  skeletonVariant: 'default',
  loadingThreshold: 0.1,
};

interface ProgressiveLoaderProps {
  items: LoadableItineraryItem[];
  config?: Partial<ProgressiveLoadingConfig>;
  className?: string;
  onItemLoad?: (item: LoadableItineraryItem) => void;
  onItemError?: (item: LoadableItineraryItem, error: Error) => void;
  onVisibilityChange?: (itemId: string, isVisible: boolean) => void;
}

export const ProgressiveLoader: React.FC<ProgressiveLoaderProps> = ({
  items,
  config: userConfig = {},
  className,
  onItemLoad,
  onItemError,
  onVisibilityChange,
}) => {
  const config = useMemo(() => ({ ...DEFAULT_CONFIG, ...userConfig }), [userConfig]);
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [loadedData, setLoadedData] = useState<Map<string, any>>(new Map());
  const [loadingItems, setLoadingItems] = useState<Set<string>>(new Set());
  const [errors, setErrors] = useState<Map<string, Error>>(new Map());

  // Initialize loading systems
  const { 
    state: queueState, 
    addTask, 
    updateVisibility 
  } = useLoadingPriorityQueue(config.maxConcurrentLoads);
  
  const {
    updateCurrentDay,
    addPrefetchItems,
    trackViewTime,
  } = usePrefetchManager({
    adjacentDays: 2,
    prefetchRadius: config.prefetchRadius || 3,
    maxPrefetchItems: 10,
  });

  // Create prefetchable items from loadable items
  const prefetchItems = useMemo((): PrefetchableItem[] => {
    return items.map(item => ({
      id: item.id,
      type: item.type,
      dayId: item.dayId,
      priority: item.priority || 'medium',
      ...(item.estimatedSize && { estimatedSize: item.estimatedSize }),
      loadFn: async () => {
        try {
          const data = await item.loadFn();
          setLoadedData(prev => new Map(prev).set(item.id, data));
          onItemLoad?.(item);
        } catch (error) {
          const err = error as Error;
          setErrors(prev => new Map(prev).set(item.id, err));
          onItemError?.(item, err);
          throw error;
        }
      },
    }));
  }, [items, onItemLoad, onItemError]);

  // Update prefetch items when items change
  useEffect(() => {
    if (config.enablePrefetch) {
      addPrefetchItems(prefetchItems);
    }
  }, [prefetchItems, addPrefetchItems, config.enablePrefetch]);

  // Handle item visibility changes
  const handleVisibilityChange = useCallback((itemId: string, isVisible: boolean) => {
    updateVisibility(itemId, isVisible);
    onVisibilityChange?.(itemId, isVisible);

    // Trigger loading for visible items
    if (isVisible) {
      const item = items.find(i => i.id === itemId);
      if (item && !loadedData.has(itemId) && !loadingItems.has(itemId)) {
        setLoadingItems(prev => new Set(prev).add(itemId));
        
        addTask({
          id: itemId,
          priority: item.priority || 'high', // Visible items get high priority
          load: async () => {
            try {
              const data = await item.loadFn();
              setLoadedData(prev => new Map(prev).set(itemId, data));
              setLoadingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
              });
              onItemLoad?.(item);
            } catch (error) {
              const err = error as Error;
              setErrors(prev => new Map(prev).set(itemId, err));
              setLoadingItems(prev => {
                const newSet = new Set(prev);
                newSet.delete(itemId);
                return newSet;
              });
              onItemError?.(item, err);
              throw error;
            }
          },
        });
      }
    }
  }, [items, loadedData, loadingItems, updateVisibility, addTask, onVisibilityChange, onItemLoad, onItemError]);

  // Render individual item
  const renderItem = useCallback((item: LoadableItineraryItem, index: number, isVisible: boolean) => {
    const data = loadedData.get(item.id);
    const isLoading = loadingItems.has(item.id) || queueState.loading.has(item.id);
    const error = errors.get(item.id);

    // Show skeleton while loading
    if (isLoading || (!data && !error)) {
      if (item.skeletonFn) {
        return item.skeletonFn();
      }
      
      // Default skeletons based on type
      switch (item.type) {
        case 'hotel':
          return <HotelCardSkeleton variant={config.skeletonVariant || 'default'} />;
        case 'flight':
          return <FlightCardSkeleton variant={config.skeletonVariant || 'default'} />;
        case 'day':
          return <DayCardSkeleton />;
        default:
          return <div className="animate-pulse bg-gray-200 h-32 rounded-lg" />;
      }
    }

    // Show error state
    if (error) {
      return (
        <div className="border border-red-200 rounded-lg p-4 bg-red-50">
          <h3 className="text-red-800 font-medium">Failed to load {item.type}</h3>
          <p className="text-red-600 text-sm mt-1">{error.message}</p>
          <button 
            className="mt-2 text-red-700 underline text-sm"
            onClick={() => {
              setErrors(prev => {
                const newMap = new Map(prev);
                newMap.delete(item.id);
                return newMap;
              });
              handleVisibilityChange(item.id, true);
            }}
          >
            Retry
          </button>
        </div>
      );
    }

    // Render loaded content
    return (
      <LazyItem
        key={item.id}
        onVisible={() => handleVisibilityChange(item.id, true)}
        rootMargin={`${Math.round(config.loadingThreshold! * 100)}%`}
        className="w-full"
      >
        <ViewTimeTracker
          itemId={item.id}
          onViewTimeUpdate={(viewTime) => trackViewTime(item.id, Date.now() - viewTime, Date.now())}
        >
          {item.renderFn(data, isLoading)}
        </ViewTimeTracker>
      </LazyItem>
    );
  }, [
    loadedData, 
    loadingItems, 
    queueState.loading, 
    errors, 
    config.skeletonVariant, 
    config.loadingThreshold,
    handleVisibilityChange,
    trackViewTime
  ]);

  // Virtualized rendering
  if (config.enableVirtualization && items.length > 10) {
    return (
      <div className={cn('progressive-loader', className)}>
        <VirtualizedList
          items={items}
          itemHeight={config.itemHeight!}
          containerHeight={config.containerHeight!}
          renderItem={renderItem}
          getItemKey={(item) => item.id}
          onScroll={(scrollTop) => {
            // Update current day based on scroll position
            const newDayIndex = Math.floor(scrollTop / config.itemHeight!);
            if (newDayIndex !== currentDayIndex) {
              setCurrentDayIndex(newDayIndex);
              updateCurrentDay(newDayIndex, items.length);
            }
          }}
          className="w-full"
        />
      </div>
    );
  }

  // Standard rendering with lazy loading
  return (
    <div className={cn('progressive-loader space-y-4', className)}>
      {items.map((item, index) => (
        <div key={item.id} className="w-full">
          {renderItem(item, index, true)}
        </div>
      ))}
    </div>
  );
};

// Component for tracking view time
interface ViewTimeTrackerProps {
  itemId: string;
  children: React.ReactNode;
  onViewTimeUpdate?: (viewTime: number) => void;
}

const ViewTimeTracker: React.FC<ViewTimeTrackerProps> = ({
  itemId,
  children,
  onViewTimeUpdate,
}) => {
  const { isVisible } = useViewTimeTracker(itemId, onViewTimeUpdate);
  
  return <div className={cn('view-tracker', isVisible && 'is-visible')}>{children}</div>;
};

// Hook for using progressive loading with existing components
export function useProgressiveLoading<T>(
  items: T[],
  options: {
    loadFn: (item: T) => Promise<any>;
    renderFn: (item: T, data: any, isLoading: boolean) => React.ReactNode;
    getItemId: (item: T) => string;
    getDayId: (item: T) => string;
    getItemType: (item: T) => 'day' | 'hotel' | 'flight' | 'activity';
    getPriority?: (item: T) => LoadingPriority;
    getEstimatedSize?: (item: T) => number;
    config?: Partial<ProgressiveLoadingConfig>;
  }
) {
  const {
    loadFn,
    renderFn,
    getItemId,
    getDayId,
    getItemType,
    getPriority,
    getEstimatedSize,
    config = {},
  } = options;

  const loadableItems: LoadableItineraryItem[] = useMemo(() => {
    return items.map(item => ({
      id: getItemId(item),
      type: getItemType(item),
      dayId: getDayId(item),
      priority: getPriority?.(item) || 'medium',
      ...(getEstimatedSize && { estimatedSize: getEstimatedSize(item) }),
      loadFn: () => loadFn(item),
      renderFn: (data: any, isLoading: boolean) => renderFn(item, data, isLoading),
    }));
  }, [items, loadFn, renderFn, getItemId, getDayId, getItemType, getPriority, getEstimatedSize]);

  return {
    ProgressiveLoader: useCallback((props: Partial<ProgressiveLoaderProps>) => (
      <ProgressiveLoader
        items={loadableItems}
        config={config}
        {...props}
      />
    ), [loadableItems, config]),
    loadableItems,
  };
}

export default ProgressiveLoader; 