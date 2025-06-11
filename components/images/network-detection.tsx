'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export type NetworkType = '2g' | '3g' | '4g' | '5g' | 'wifi' | 'ethernet' | 'unknown';
export type NetworkSpeed = 'slow' | 'medium' | 'fast' | 'very-fast';
export type DataSaverMode = 'enabled' | 'disabled' | 'unknown';

export interface NetworkCondition {
  type: NetworkType;
  speed: NetworkSpeed;
  effectiveType: string;
  downlink: number; // Mbps
  rtt: number; // ms
  dataSaver: DataSaverMode;
  isOnline: boolean;
  timestamp: number;
}

export interface ImageQualityPreference {
  auto: boolean;
  quality: 'low' | 'medium' | 'high' | 'original';
  dataSaver: boolean;
}

// Network type mapping for fallback when connection API is not available
const NETWORK_TYPE_MAP: Record<string, NetworkType> = {
  'slow-2g': '2g',
  '2g': '2g',
  '3g': '3g',
  '4g': '4g',
  '5g': '5g',
  'wifi': 'wifi',
  'ethernet': 'ethernet',
};

// Speed classification based on downlink and RTT
const classifyNetworkSpeed = (downlink: number, rtt: number, effectiveType: string): NetworkSpeed => {
  // Primary classification by effective type
  switch (effectiveType) {
    case 'slow-2g':
      return 'slow';
    case '2g':
      return 'slow';
    case '3g':
      return 'medium';
    case '4g':
      return 'fast';
    case '5g':
      return 'very-fast';
    default:
      break;
  }

  // Fallback classification by metrics
  if (downlink >= 10 && rtt <= 50) return 'very-fast';
  if (downlink >= 5 && rtt <= 100) return 'fast';
  if (downlink >= 1.5 && rtt <= 300) return 'medium';
  return 'slow';
};

// Get data saver status
const getDataSaverMode = (): DataSaverMode => {
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    if ('saveData' in connection) {
      return connection.saveData ? 'enabled' : 'disabled';
    }
  }
  return 'unknown';
};

// Get current network condition
const getCurrentNetworkCondition = (): NetworkCondition => {
  const isOnline = navigator.onLine;
  let type: NetworkType = 'unknown';
  let effectiveType = 'unknown';
  let downlink = 0;
  let rtt = 0;

  // Try to get connection information
  if ('connection' in navigator) {
    const connection = (navigator as any).connection;
    
    if (connection) {
      effectiveType = connection.effectiveType || 'unknown';
      type = NETWORK_TYPE_MAP[effectiveType] || 'unknown';
      downlink = connection.downlink || 0;
      rtt = connection.rtt || 0;
    }
  }

  const speed = classifyNetworkSpeed(downlink, rtt, effectiveType);
  const dataSaver = getDataSaverMode();

  return {
    type,
    speed,
    effectiveType,
    downlink,
    rtt,
    dataSaver,
    isOnline,
    timestamp: Date.now(),
  };
};

// React hook for network detection
export function useNetworkCondition(updateInterval = 30000): NetworkCondition {
  const [networkCondition, setNetworkCondition] = useState<NetworkCondition>({
    type: 'unknown',
    speed: 'medium',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    dataSaver: 'unknown',
    isOnline: true,
    timestamp: Date.now(),
  });
  const intervalRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const updateNetworkCondition = useCallback(() => {
    const newCondition = getCurrentNetworkCondition();
    setNetworkCondition(prev => {
      // Only update if significant change to avoid unnecessary re-renders
      if (
        prev.speed !== newCondition.speed ||
        prev.isOnline !== newCondition.isOnline ||
        prev.dataSaver !== newCondition.dataSaver ||
        Math.abs(prev.downlink - newCondition.downlink) > 1
      ) {
        return newCondition;
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    // Initialize with actual network condition
    updateNetworkCondition();

    // Listen for online/offline events
    const handleOnline = () => updateNetworkCondition();
    const handleOffline = () => updateNetworkCondition();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Listen for connection changes
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection && connection.addEventListener) {
        connection.addEventListener('change', updateNetworkCondition);
      }
    }

    // Set up polling for periodic updates
    if (updateInterval > 0) {
      intervalRef.current = setInterval(updateNetworkCondition, updateInterval);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      
      if ('connection' in navigator) {
        const connection = (navigator as any).connection;
        if (connection && connection.removeEventListener) {
          connection.removeEventListener('change', updateNetworkCondition);
        }
      }

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [updateNetworkCondition, updateInterval]);

  return networkCondition;
}

// Hook for image quality preferences
export function useImageQualityPreference(): [ImageQualityPreference, (pref: Partial<ImageQualityPreference>) => void] {
  const [preference, setPreference] = useState<ImageQualityPreference>(() => {
    // Load from localStorage if available
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('tripnav-image-quality-preference');
        if (stored) {
          return { ...getDefaultPreference(), ...JSON.parse(stored) };
        }
      } catch (error) {
        console.warn('Failed to load image quality preference:', error);
      }
    }
    return getDefaultPreference();
  });

  const updatePreference = useCallback((newPref: Partial<ImageQualityPreference>) => {
    setPreference(prev => {
      const updated = { ...prev, ...newPref };
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('tripnav-image-quality-preference', JSON.stringify(updated));
        } catch (error) {
          console.warn('Failed to save image quality preference:', error);
        }
      }
      
      return updated;
    });
  }, []);

  return [preference, updatePreference];
}

function getDefaultPreference(): ImageQualityPreference {
  return {
    auto: true,
    quality: 'high',
    dataSaver: false,
  };
}

// Hook for adaptive image quality based on network conditions
export function useAdaptiveImageQuality(): {
  recommendedQuality: 'low' | 'medium' | 'high' | 'original';
  shouldPreload: boolean;
  shouldUseProgressive: boolean;
  cacheStrategy: 'aggressive' | 'normal' | 'minimal';
} {
  const networkCondition = useNetworkCondition();
  const [preference] = useImageQualityPreference();

  // If user has disabled auto mode, use their preference
  if (!preference.auto) {
    return {
      recommendedQuality: preference.quality,
      shouldPreload: !preference.dataSaver,
      shouldUseProgressive: preference.quality === 'high' || preference.quality === 'original',
      cacheStrategy: preference.dataSaver ? 'minimal' : 'normal',
    };
  }

  // Data saver mode overrides
  if (networkCondition.dataSaver === 'enabled' || preference.dataSaver) {
    return {
      recommendedQuality: 'low',
      shouldPreload: false,
      shouldUseProgressive: false,
      cacheStrategy: 'minimal',
    };
  }

  // Offline mode
  if (!networkCondition.isOnline) {
    return {
      recommendedQuality: 'medium',
      shouldPreload: false,
      shouldUseProgressive: false,
      cacheStrategy: 'aggressive',
    };
  }

  // Adaptive quality based on network speed
  switch (networkCondition.speed) {
    case 'slow':
      return {
        recommendedQuality: 'low',
        shouldPreload: false,
        shouldUseProgressive: true,
        cacheStrategy: 'minimal',
      };
      
    case 'medium':
      return {
        recommendedQuality: 'medium',
        shouldPreload: false,
        shouldUseProgressive: true,
        cacheStrategy: 'normal',
      };
      
    case 'fast':
      return {
        recommendedQuality: 'high',
        shouldPreload: true,
        shouldUseProgressive: true,
        cacheStrategy: 'normal',
      };
      
    case 'very-fast':
      return {
        recommendedQuality: 'original',
        shouldPreload: true,
        shouldUseProgressive: false,
        cacheStrategy: 'aggressive',
      };
      
    default:
      return {
        recommendedQuality: 'medium',
        shouldPreload: false,
        shouldUseProgressive: true,
        cacheStrategy: 'normal',
      };
  }
}

// Utility function to estimate image load time
export function estimateImageLoadTime(
  fileSizeKB: number, 
  networkCondition: NetworkCondition
): number {
  if (!networkCondition.isOnline) return Infinity;
  
  const fileSizeMB = fileSizeKB / 1024;
  const downlinkMbps = networkCondition.downlink || 1;
  const rtt = networkCondition.rtt || 100;
  
  // Calculate transfer time + latency
  const transferTime = (fileSizeMB * 8) / downlinkMbps * 1000; // Convert to ms
  const totalTime = transferTime + rtt;
  
  return Math.max(totalTime, 100); // Minimum 100ms
}

// Network condition display component for debugging
export const NetworkIndicator: React.FC<{ className?: string }> = ({ className }) => {
  const networkCondition = useNetworkCondition();
  const [preference] = useImageQualityPreference();
  
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  const getSpeedColor = (speed: NetworkSpeed) => {
    switch (speed) {
      case 'slow': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'fast': return 'text-green-600';
      case 'very-fast': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className={`fixed bottom-4 right-4 bg-black bg-opacity-75 text-white text-xs p-2 rounded z-50 ${className}`}>
      <div>Network: <span className={getSpeedColor(networkCondition.speed)}>{networkCondition.speed}</span></div>
      <div>Type: {networkCondition.effectiveType}</div>
      <div>Downlink: {networkCondition.downlink.toFixed(1)} Mbps</div>
      <div>RTT: {networkCondition.rtt}ms</div>
      <div>Data Saver: {networkCondition.dataSaver}</div>
      <div>Quality Pref: {preference.auto ? 'auto' : preference.quality}</div>
    </div>
  );
}; 