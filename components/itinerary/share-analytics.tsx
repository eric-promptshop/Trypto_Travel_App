'use client';

import React, { useCallback, useRef, useEffect } from 'react';

export interface ShareEvent {
  id: string;
  timestamp: number;
  method: string; // 'print', 'email', 'facebook', 'twitter', 'whatsapp', 'copy', 'qr', 'pdf'
  success: boolean;
  itineraryId: string;
  destination: string;
  userAgent: string;
  duration?: number; // Time taken for the action (ms)
  additionalData?: Record<string, any>;
}

export interface ShareAnalytics {
  totalShares: number;
  successfulShares: number;
  failedShares: number;
  successRate: number;
  popularMethods: Array<{
    method: string;
    count: number;
    percentage: number;
  }>;
  recentActivity: ShareEvent[];
  averageShareTime: number;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  destinationPopularity: Array<{
    destination: string;
    shareCount: number;
  }>;
}

interface ShareAnalyticsContextType {
  trackShare: (
    method: string, 
    success: boolean, 
    itineraryData: {
      id: string;
      destination: string;
    },
    additionalData?: Record<string, any>
  ) => void;
  getAnalytics: () => ShareAnalytics;
  clearAnalytics: () => void;
  exportAnalytics: () => string;
}

// Analytics storage key
const ANALYTICS_STORAGE_KEY = 'tripnav_share_analytics';

// Device detection utility
function getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
  if (typeof window === 'undefined') return 'desktop';
  
  const userAgent = navigator.userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
  const isTablet = /ipad|tablet|(android(?!.*mobile))|kindle/i.test(userAgent);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

// Load analytics from localStorage
function loadAnalyticsData(): ShareEvent[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    return [];
  }
}

// Save analytics to localStorage
function saveAnalyticsData(events: ShareEvent[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    // Keep only the last 1000 events to prevent localStorage bloat
    const limitedEvents = events.slice(-1000);
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(limitedEvents));
  } catch (error) {
  }
}

// Analytics hook
export function useShareAnalytics(): ShareAnalyticsContextType {
  const eventsRef = useRef<ShareEvent[]>(loadAnalyticsData());
  const trackingStartTime = useRef<number | null>(null);

  // Track a share event
  const trackShare = useCallback((
    method: string, 
    success: boolean, 
    itineraryData: { id: string; destination: string },
    additionalData?: Record<string, any>
  ) => {
    const event: ShareEvent = {
      id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      method,
      success,
      itineraryId: itineraryData.id,
      destination: itineraryData.destination,
      userAgent: navigator.userAgent,
      ...(trackingStartTime.current && { duration: Date.now() - trackingStartTime.current }),
      ...(additionalData && { additionalData }),
    };

    eventsRef.current.push(event);
    saveAnalyticsData(eventsRef.current);
    
    // Reset tracking time
    trackingStartTime.current = null;

    // Send to external analytics if configured
    if (typeof window !== 'undefined' && 'gtag' in window) {
      try {
        (window as any).gtag('event', 'share', {
          event_category: 'itinerary',
          event_label: method,
          value: success ? 1 : 0,
          custom_map: {
            destination: itineraryData.destination,
            itinerary_id: itineraryData.id,
          }
        });
      } catch (error) {
      }
    }

    // Debug logging in development
    if (process.env.NODE_ENV === 'development') {
    }
  }, []);

  // Get compiled analytics
  const getAnalytics = useCallback((): ShareAnalytics => {
    const events = eventsRef.current;
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    // Filter to recent events (last 30 days)
    const recentEvents = events.filter(event => event.timestamp > thirtyDaysAgo);
    
    const totalShares = recentEvents.length;
    const successfulShares = recentEvents.filter(event => event.success).length;
    const failedShares = totalShares - successfulShares;
    const successRate = totalShares > 0 ? (successfulShares / totalShares) * 100 : 0;

    // Method popularity
    const methodCounts = recentEvents.reduce((acc, event) => {
      acc[event.method] = (acc[event.method] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const popularMethods = Object.entries(methodCounts)
      .map(([method, count]) => ({
        method,
        count,
        percentage: totalShares > 0 ? (count / totalShares) * 100 : 0,
      }))
      .sort((a, b) => b.count - a.count);

    // Device breakdown
    const deviceBreakdown = recentEvents.reduce((acc, event) => {
      const deviceType = getDeviceTypeFromUserAgent(event.userAgent);
      acc[deviceType]++;
      return acc;
    }, { mobile: 0, desktop: 0, tablet: 0 });

    // Destination popularity
    const destinationCounts = recentEvents.reduce((acc, event) => {
      acc[event.destination] = (acc[event.destination] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const destinationPopularity = Object.entries(destinationCounts)
      .map(([destination, shareCount]) => ({ destination, shareCount }))
      .sort((a, b) => b.shareCount - a.shareCount)
      .slice(0, 10); // Top 10 destinations

    // Average share time (for events that have duration)
    const eventsWithDuration = recentEvents.filter(event => event.duration !== undefined);
    const averageShareTime = eventsWithDuration.length > 0
      ? eventsWithDuration.reduce((sum, event) => sum + (event.duration || 0), 0) / eventsWithDuration.length
      : 0;

    return {
      totalShares,
      successfulShares,
      failedShares,
      successRate,
      popularMethods,
      recentActivity: recentEvents.slice(-10).reverse(), // Last 10 events, newest first
      averageShareTime,
      deviceBreakdown,
      destinationPopularity,
    };
  }, []);

  // Clear all analytics data
  const clearAnalytics = useCallback(() => {
    eventsRef.current = [];
    saveAnalyticsData([]);
  }, []);

  // Export analytics as JSON string
  const exportAnalytics = useCallback(() => {
    const analytics = getAnalytics();
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      summary: analytics,
      rawEvents: eventsRef.current,
    }, null, 2);
  }, [getAnalytics]);

  // Start tracking action timing
  const startTracking = useCallback(() => {
    trackingStartTime.current = Date.now();
  }, []);

  return {
    trackShare,
    getAnalytics,
    clearAnalytics,
    exportAnalytics,
  };
}

// Utility function to get device type from user agent
function getDeviceTypeFromUserAgent(userAgent: string): 'mobile' | 'desktop' | 'tablet' {
  const ua = userAgent.toLowerCase();
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
  const isTablet = /ipad|tablet|(android(?!.*mobile))|kindle/i.test(ua);
  
  if (isTablet) return 'tablet';
  if (isMobile) return 'mobile';
  return 'desktop';
}

// Analytics dashboard component
export const ShareAnalyticsDashboard: React.FC<{
  className?: string;
  showRawData?: boolean;
}> = ({ className, showRawData = false }) => {
  const { getAnalytics, clearAnalytics, exportAnalytics } = useShareAnalytics();
  const analytics = getAnalytics();

  const handleExport = () => {
    const data = exportAnalytics();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `share-analytics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className={className}>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-tripnav-navy">{analytics.totalShares}</div>
          <div className="text-sm text-gray-600">Total Shares</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">{analytics.successRate.toFixed(1)}%</div>
          <div className="text-sm text-gray-600">Success Rate</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-purple-600">{formatDuration(analytics.averageShareTime)}</div>
          <div className="text-sm text-gray-600">Avg. Share Time</div>
        </div>
        <div className="bg-white p-4 rounded-lg border">
          <div className="text-2xl font-bold text-orange-600">{analytics.deviceBreakdown.mobile}</div>
          <div className="text-sm text-gray-600">Mobile Shares</div>
        </div>
      </div>

      {/* Popular Methods */}
      <div className="bg-white p-6 rounded-lg border mb-6">
        <h3 className="text-lg font-semibold mb-4">Popular Share Methods</h3>
        <div className="space-y-3">
          {analytics.popularMethods.map((method) => (
            <div key={method.method} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="capitalize font-medium">{method.method}</div>
                <div className="text-sm text-gray-500">({method.count} shares)</div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-24 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-tripnav-navy h-2 rounded-full" 
                    style={{ width: `${method.percentage}%` }}
                  />
                </div>
                <div className="text-sm font-medium w-12 text-right">
                  {method.percentage.toFixed(0)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Device Breakdown */}
      <div className="bg-white p-6 rounded-lg border mb-6">
        <h3 className="text-lg font-semibold mb-4">Device Breakdown</h3>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(analytics.deviceBreakdown).map(([device, count]) => (
            <div key={device} className="text-center">
              <div className="text-2xl font-bold text-gray-700">{count}</div>
              <div className="text-sm text-gray-500 capitalize">{device}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-lg border mb-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-2">
          {analytics.recentActivity.map((event) => (
            <div key={event.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${event.success ? 'bg-green-500' : 'bg-red-500'}`} />
                <div className="font-medium capitalize">{event.method}</div>
                <div className="text-sm text-gray-500">{event.destination}</div>
              </div>
              <div className="text-sm text-gray-400">
                {formatDate(event.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-tripnav-navy text-white rounded-md hover:bg-tripnav-orange transition-colors"
        >
          Export Data
        </button>
        <button
          onClick={clearAnalytics}
          className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
        >
          Clear Data
        </button>
      </div>

      {/* Raw Data (Development) */}
      {showRawData && analytics.recentActivity.length > 0 && (
        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Raw Data (Development)</h4>
          <pre className="text-xs overflow-auto max-h-40 bg-white p-2 rounded border">
            {JSON.stringify(analytics.recentActivity.slice(0, 3), null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};

export default useShareAnalytics; 