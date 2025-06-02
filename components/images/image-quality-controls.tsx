'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { 
  useImageQualityPreference, 
  useNetworkCondition,
  NetworkIndicator 
} from './network-detection';
import { useImageCache } from './image-cache';

export interface ImageQualityControlsProps {
  className?: string;
  showAdvanced?: boolean;
  showNetworkInfo?: boolean;
  onSettingsChange?: (settings: any) => void;
}

export const ImageQualityControls: React.FC<ImageQualityControlsProps> = ({
  className,
  showAdvanced = false,
  showNetworkInfo = false,
  onSettingsChange,
}) => {
  const [preference, updatePreference] = useImageQualityPreference();
  const networkCondition = useNetworkCondition();
  const { metrics, clearExpired, clearAll } = useImageCache();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleQualityChange = (quality: 'low' | 'medium' | 'high' | 'original') => {
    const newPref = { ...preference, quality, auto: false };
    updatePreference(newPref);
    onSettingsChange?.(newPref);
  };

  const handleAutoToggle = (auto: boolean) => {
    const newPref = { ...preference, auto };
    updatePreference(newPref);
    onSettingsChange?.(newPref);
  };

  const handleDataSaverToggle = (dataSaver: boolean) => {
    const newPref = { ...preference, dataSaver };
    updatePreference(newPref);
    onSettingsChange?.(newPref);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getNetworkStatusColor = (speed: string) => {
    switch (speed) {
      case 'slow': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'fast': return 'text-green-600';
      case 'very-fast': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getQualityDescription = (quality: string) => {
    switch (quality) {
      case 'low': return 'Fastest loading, lowest data usage';
      case 'medium': return 'Balanced quality and loading speed';
      case 'high': return 'High quality, moderate data usage';
      case 'original': return 'Best quality, highest data usage';
      default: return '';
    }
  };

  return (
    <div className={cn('bg-white rounded-lg border border-gray-200 p-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Image Quality</h3>
          <p className="text-sm text-gray-600">
            {preference.auto 
              ? `Auto-optimizing for ${networkCondition.speed} connection`
              : `Manual: ${preference.quality} quality`
            }
          </p>
        </div>
        
        {showAdvanced && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-tripnav-navy hover:text-tripnav-orange transition-colors"
          >
            {isExpanded ? '▼' : '▶'} Settings
          </button>
        )}
      </div>

      {/* Network Status */}
      {showNetworkInfo && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Network:</span>
            <span className={getNetworkStatusColor(networkCondition.speed)}>
              {networkCondition.effectiveType} • {networkCondition.speed}
            </span>
          </div>
          {networkCondition.downlink > 0 && (
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-gray-600">Speed:</span>
              <span className="text-gray-900">
                {networkCondition.downlink.toFixed(1)} Mbps
              </span>
            </div>
          )}
          {networkCondition.dataSaver === 'enabled' && (
            <div className="text-xs text-amber-700 mt-2 flex items-center">
              ⚡ Data Saver mode detected
            </div>
          )}
        </div>
      )}

      {/* Quick Controls */}
      <div className="space-y-4">
        {/* Auto Mode Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Automatic Quality
            </label>
            <p className="text-xs text-gray-500">
              Adapt quality based on network conditions
            </p>
          </div>
          <button
            onClick={() => handleAutoToggle(!preference.auto)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              preference.auto 
                ? 'bg-tripnav-navy' 
                : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                preference.auto ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>

        {/* Manual Quality Selection */}
        {!preference.auto && (
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">
              Quality Level
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['low', 'medium', 'high', 'original'] as const).map((quality) => (
                <button
                  key={quality}
                  onClick={() => handleQualityChange(quality)}
                  className={cn(
                    'text-left p-3 rounded-lg border transition-all',
                    preference.quality === quality
                      ? 'border-tripnav-navy bg-tripnav-navy bg-opacity-10 text-tripnav-navy'
                      : 'border-gray-200 hover:border-gray-300 text-gray-700'
                  )}
                >
                  <div className="font-medium capitalize">{quality}</div>
                  <div className="text-xs opacity-75">
                    {getQualityDescription(quality)}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Data Saver Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700">
              Data Saver Mode
            </label>
            <p className="text-xs text-gray-500">
              Reduce data usage and loading times
            </p>
          </div>
          <button
            onClick={() => handleDataSaverToggle(!preference.dataSaver)}
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              preference.dataSaver 
                ? 'bg-amber-500' 
                : 'bg-gray-200'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                preference.dataSaver ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      </div>

      {/* Advanced Settings */}
      {showAdvanced && isExpanded && (
        <div className="mt-6 pt-4 border-t border-gray-200 space-y-4">
          <h4 className="font-medium text-gray-900">Cache Management</h4>
          
          {/* Cache Stats */}
          <div className="bg-gray-50 rounded-lg p-3 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cached Images:</span>
              <span className="font-medium">{metrics.itemCount}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cache Size:</span>
              <span className="font-medium">{formatBytes(metrics.totalSize)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Hit Rate:</span>
              <span className="font-medium">{(metrics.hitRate * 100).toFixed(1)}%</span>
            </div>
          </div>

          {/* Cache Actions */}
          <div className="flex gap-2">
            <button
              onClick={clearExpired}
              className="flex-1 px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Clear Expired
            </button>
            <button
              onClick={clearAll}
              className="flex-1 px-3 py-2 text-sm bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
            >
              Clear All
            </button>
          </div>
        </div>
      )}

      {/* Network Indicator for Development */}
      {process.env.NODE_ENV === 'development' && showNetworkInfo && (
        <NetworkIndicator className="mt-4" />
      )}
    </div>
  );
};

// Floating quality control widget
export const FloatingImageQualityWidget: React.FC<{
  className?: string;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}> = ({ 
  className, 
  position = 'bottom-right' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [preference] = useImageQualityPreference();
  const networkCondition = useNetworkCondition();

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  const getQualityIcon = () => {
    if (preference.dataSaver) return '📱';
    if (!preference.auto) {
      switch (preference.quality) {
        case 'low': return '🔸';
        case 'medium': return '🔶';
        case 'high': return '🔷';
        case 'original': return '💎';
      }
    }
    switch (networkCondition.speed) {
      case 'slow': return '🐌';
      case 'medium': return '🚶';
      case 'fast': return '🚗';
      case 'very-fast': return '🚀';
      default: return '❓';
    }
  };

  return (
    <div className={cn('fixed z-50', positionClasses[position], className)}>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'w-12 h-12 rounded-full shadow-lg transition-all duration-200',
          'flex items-center justify-center text-lg',
          networkCondition.isOnline 
            ? 'bg-tripnav-navy text-white hover:bg-tripnav-orange' 
            : 'bg-gray-400 text-white',
          isOpen && 'scale-110'
        )}
        title={`Image Quality: ${preference.auto ? 'Auto' : preference.quality}`}
      >
        {getQualityIcon()}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div 
          className={cn(
            'absolute w-80 mt-2 bg-white rounded-lg shadow-xl border border-gray-200',
            position.includes('right') ? 'right-0' : 'left-0',
            position.includes('top') ? 'top-full' : 'bottom-full mb-2'
          )}
        >
          <ImageQualityControls 
            showAdvanced={true}
            showNetworkInfo={true}
            onSettingsChange={() => {
              // Optional: Auto-close after changes
              setTimeout(() => setIsOpen(false), 2000);
            }}
          />
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 -z-10"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
};

// Compact quality indicator
export const ImageQualityIndicator: React.FC<{
  className?: string;
  showDetails?: boolean;
}> = ({ className, showDetails = false }) => {
  const [preference] = useImageQualityPreference();
  const networkCondition = useNetworkCondition();

  const currentQuality = preference.auto 
    ? `Auto (${networkCondition.speed})`
    : preference.quality;

  const indicatorColor = (() => {
    if (preference.dataSaver) return 'bg-amber-500';
    if (!networkCondition.isOnline) return 'bg-gray-500';
    
    const speed = preference.auto ? networkCondition.speed : preference.quality;
    switch (speed) {
      case 'slow':
      case 'low': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'fast':
      case 'high': return 'bg-green-500';
      case 'very-fast':
      case 'original': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  })();

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <div className={cn('w-2 h-2 rounded-full', indicatorColor)} />
      {showDetails ? (
        <div>
          <span className="font-medium">{currentQuality}</span>
          {!networkCondition.isOnline && (
            <span className="text-gray-500 ml-1">(Offline)</span>
          )}
          {preference.dataSaver && (
            <span className="text-amber-700 ml-1">(Data Saver)</span>
          )}
        </div>
      ) : (
        <span>{currentQuality}</span>
      )}
    </div>
  );
};

export default ImageQualityControls; 