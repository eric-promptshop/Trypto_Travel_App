// Network detection and adaptive quality
export {
  useNetworkCondition,
  useImageQualityPreference,
  useAdaptiveImageQuality,
  estimateImageLoadTime,
  NetworkIndicator,
} from './network-detection';
export type {
  NetworkType,
  NetworkSpeed,
  DataSaverMode,
  NetworkCondition,
  ImageQualityPreference,
} from './network-detection';

// Adaptive image component
export {
  AdaptiveImage,
  useImageSources,
} from './adaptive-image';
export type {
  ImageSource,
  AdaptiveImageProps,
} from './adaptive-image';

// Image caching system
export {
  ImageCacheManager,
  useImageCache,
  useCachedImage,
} from './image-cache';
export type {
  CachedImage,
  CacheMetrics,
  CacheConfig,
} from './image-cache';

// User controls
export {
  ImageQualityControls,
  FloatingImageQualityWidget,
  ImageQualityIndicator,
} from './image-quality-controls';
export type {
  ImageQualityControlsProps,
} from './image-quality-controls';

// Default export
export { AdaptiveImage as default } from './adaptive-image'; 