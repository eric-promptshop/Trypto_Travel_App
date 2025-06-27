'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { 
  AdaptiveImage, 
  useImageSources,
  ImageQualityControls,
  FloatingImageQualityWidget,
  ImageQualityIndicator,
  useNetworkCondition,
  useImageCache,
  useCachedImage,
} from './index';

// Sample image data for demo
const DEMO_IMAGES = [
  {
    id: 'machu-picchu',
    title: 'Machu Picchu, Peru',
    baseUrl: 'https://images.unsplash.com/photo-1526392060635-9d6019884377',
    description: 'Ancient Incan citadel set high in the Andes Mountains',
    type: 'landmark' as const,
  },
  {
    id: 'rio-sunset',
    title: 'Sunset in Rio de Janeiro',
    baseUrl: 'https://images.unsplash.com/photo-1544735716-392fe2489ffa',
    description: 'Beautiful sunset over Copacabana Beach',
    type: 'beach' as const,
  },
  {
    id: 'cusco-market',
    title: 'Traditional Market in Cusco',
    baseUrl: 'https://images.unsplash.com/photo-1571104508999-893933ded431',
    description: 'Colorful textiles and local crafts',
    type: 'culture' as const,
  },
  {
    id: 'amazon-river',
    title: 'Amazon Rainforest',
    baseUrl: 'https://images.unsplash.com/photo-1591194816308-a63e64fd2e4c',
    description: 'Dense rainforest along the Amazon River',
    type: 'nature' as const,
  },
];

const NETWORK_SIMULATION_OPTIONS = [
  { label: 'Fast WiFi', speed: 'very-fast', downlink: 50, rtt: 20 },
  { label: '4G Mobile', speed: 'fast', downlink: 10, rtt: 50 },
  { label: '3G Mobile', speed: 'medium', downlink: 2, rtt: 150 },
  { label: 'Slow 2G', speed: 'slow', downlink: 0.5, rtt: 400 },
] as const;

export const ImageOptimizationDemo: React.FC<{
  className?: string;
  showControls?: boolean;
  enableFloatingWidget?: boolean;
}> = ({ 
  className, 
  showControls = true,
  enableFloatingWidget = false,
}) => {
  const [selectedTab, setSelectedTab] = useState<'gallery' | 'performance' | 'cache'>('gallery');
  const [simulatedNetwork, setSimulatedNetwork] = useState<string | null>(null);
  const [loadingTimes, setLoadingTimes] = useState<Map<string, number>>(new Map());
  const networkCondition = useNetworkCondition();
  const { metrics, preloadImages, clearExpired } = useImageCache();

  // Preload demo images on mount
  useEffect(() => {
    const urls = DEMO_IMAGES.map(img => `${img.baseUrl}?w=800&h=600&fit=crop`);
    preloadImages(urls, 'medium');
  }, [preloadImages]);

  const ImageLoadTracker: React.FC<{ 
    imageId: string; 
    children: React.ReactNode; 
  }> = ({ imageId, children }) => {
    const [startTime] = useState(Date.now());

    const handleLoad = () => {
      const loadTime = Date.now() - startTime;
      setLoadingTimes(prev => new Map(prev).set(imageId, loadTime));
    };

    return (
      <div onLoad={handleLoad}>
        {children}
      </div>
    );
  };

  // Component to handle individual image rendering with hooks
  const GalleryImage = ({ image }: { image: typeof DEMO_IMAGES[0] }) => {
    const sources = useImageSources(image.baseUrl, {
      width: 400,
      height: 300,
      qualities: ['low', 'medium', 'high', 'original'],
      cloudName: 'demo', // Using Cloudinary demo account
      useCloudinaryFetch: true, // Fetch and transform Unsplash images
      format: 'auto', // Auto-select best format (WebP when supported)
    });

    const loadTime = loadingTimes.get(image.id);

    return (
            <div key={image.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <ImageLoadTracker imageId={image.id}>
                <AdaptiveImage
                  sources={sources}
                  alt={image.title}
                  className="w-full h-48"
                  enableProgressive={true}
                  aspectRatio={4/3}
                  onQualityChange={(quality) => {
                  }}
                />
              </ImageLoadTracker>
              
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{image.title}</h3>
                <p className="text-sm text-gray-600 mb-3">{image.description}</p>
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <ImageQualityIndicator showDetails />
                  {loadTime && (
                    <span className="bg-gray-100 px-2 py-1 rounded">
                      {loadTime}ms
                    </span>
                  )}
                </div>
              </div>
            </div>
    );
  };

  const renderGalleryTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DEMO_IMAGES.map((image) => (
          <GalleryImage key={image.id} image={image} />
        ))}
      </div>
    </div>
  );

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Network Status */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">Current Network Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Type:</span>
            <div className="font-medium">{networkCondition.effectiveType}</div>
          </div>
          <div>
            <span className="text-gray-600">Speed:</span>
            <div className="font-medium capitalize">{networkCondition.speed}</div>
          </div>
          <div>
            <span className="text-gray-600">Downlink:</span>
            <div className="font-medium">{networkCondition.downlink.toFixed(1)} Mbps</div>
          </div>
          <div>
            <span className="text-gray-600">RTT:</span>
            <div className="font-medium">{networkCondition.rtt}ms</div>
          </div>
        </div>
      </div>

      {/* Network Simulation */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Simulate Network Conditions</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {NETWORK_SIMULATION_OPTIONS.map((option) => (
            <button
              key={option.label}
              onClick={() => setSimulatedNetwork(option.label)}
              className={cn(
                'p-3 text-sm border rounded-lg transition-all',
                simulatedNetwork === option.label
                  ? 'border-tripnav-navy bg-tripnav-navy bg-opacity-10 text-tripnav-navy'
                  : 'border-gray-200 hover:border-gray-300'
              )}
            >
              <div className="font-medium">{option.label}</div>
              <div className="text-xs opacity-75">{option.downlink} Mbps</div>
            </button>
          ))}
        </div>
        {simulatedNetwork && (
          <div className="mt-3 text-sm text-amber-700 bg-amber-50 p-2 rounded">
            ⚠️ Network simulation is for demo purposes only
          </div>
        )}
      </div>

      {/* Loading Performance */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Image Loading Performance</h4>
        <div className="space-y-2">
          {Array.from(loadingTimes.entries()).map(([imageId, loadTime]) => {
            const image = DEMO_IMAGES.find(img => img.id === imageId);
            if (!image) return null;

            const isGoodPerformance = loadTime < 1000;
            const isOkPerformance = loadTime < 3000;

            return (
              <div key={imageId} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                <span className="text-sm">{image.title}</span>
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full',
                      isGoodPerformance ? 'bg-green-500' : 
                      isOkPerformance ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                  />
                  <span className="text-sm font-mono">{loadTime}ms</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCacheTab = () => (
    <div className="space-y-6">
      {/* Cache Statistics */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Cache Statistics</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-tripnav-navy">{metrics.itemCount}</div>
            <div className="text-sm text-gray-600">Cached Images</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-tripnav-navy">
              {(metrics.totalSize / (1024 * 1024)).toFixed(1)}MB
            </div>
            <div className="text-sm text-gray-600">Cache Size</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-tripnav-navy">
              {(metrics.hitRate * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Hit Rate</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-tripnav-navy">
              {Math.floor((Date.now() - metrics.lastCleanup) / (1000 * 60 * 60))}h
            </div>
            <div className="text-sm text-gray-600">Since Cleanup</div>
          </div>
        </div>
      </div>

      {/* Cache Management */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Cache Management</h4>
        <div className="flex gap-2">
          <button
            onClick={clearExpired}
            className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
          >
            Clear Expired Items
          </button>
          <button
            onClick={() => {
              const urls = DEMO_IMAGES.map(img => `${img.baseUrl}?w=800&h=600&fit=crop`);
              preloadImages(urls, 'high');
            }}
            className="flex-1 px-4 py-2 bg-tripnav-navy text-white rounded-md hover:bg-tripnav-orange transition-colors"
          >
            Preload High Quality
          </button>
        </div>
      </div>

      {/* Individual Image Cache Status */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-3">Individual Image Status</h4>
        <div className="space-y-2">
          {DEMO_IMAGES.map((image) => (
            <ImageCacheStatus key={image.id} image={image} />
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn('max-w-6xl mx-auto', className)}>
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Network-Aware Image Delivery System
        </h2>
        <p className="text-gray-600">
          Automatically adapts image quality based on network conditions, with intelligent caching and progressive loading.
        </p>
      </div>

      {/* Controls */}
      {showControls && (
        <div className="mb-8">
          <ImageQualityControls 
            showAdvanced={true}
            showNetworkInfo={true}
            className="max-w-2xl"
          />
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex gap-8">
          {[
            { id: 'gallery', label: 'Image Gallery', icon: '🖼️' },
            { id: 'performance', label: 'Performance', icon: '⚡' },
            { id: 'cache', label: 'Cache Management', icon: '💾' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={cn(
                'flex items-center gap-2 pb-4 border-b-2 transition-colors',
                selectedTab === tab.id
                  ? 'border-tripnav-navy text-tripnav-navy'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="min-h-96">
        {selectedTab === 'gallery' && renderGalleryTab()}
        {selectedTab === 'performance' && renderPerformanceTab()}
        {selectedTab === 'cache' && renderCacheTab()}
      </div>

      {/* Floating Widget */}
      {enableFloatingWidget && (
        <FloatingImageQualityWidget position="bottom-right" />
      )}
    </div>
  );
};

// Component to show individual image cache status
const ImageCacheStatus: React.FC<{ image: typeof DEMO_IMAGES[0] }> = ({ image }) => {
  const { url, isLoading, isCached } = useCachedImage(`${image.baseUrl}?w=400&h=300&fit=crop`);

  return (
    <div className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
      <span className="text-sm">{image.title}</span>
      <div className="flex items-center gap-2">
        <div
          className={cn(
            'w-2 h-2 rounded-full',
            isCached ? 'bg-green-500' : 
            isLoading ? 'bg-yellow-500' : 'bg-gray-300'
          )}
        />
        <span className="text-xs text-gray-500">
          {isCached ? 'Cached' : isLoading ? 'Loading...' : 'Not Cached'}
        </span>
      </div>
    </div>
  );
};

export default ImageOptimizationDemo; 