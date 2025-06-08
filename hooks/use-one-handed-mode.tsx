import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';

// One-handed mode settings interface
export interface OneHandedSettings {
  enabled: boolean;
  autoDetect: boolean;
  floatingButtonPosition: 'left' | 'right';
  adaptiveLayout: boolean;
  uiScale?: number;
}

// Default settings
const defaultSettings: OneHandedSettings = {
  enabled: false,
  autoDetect: true,
  floatingButtonPosition: 'right',
  adaptiveLayout: true,
  uiScale: 1
};

// Device detection hook
export const useDeviceDetection = () => {
  const [deviceInfo, setDeviceInfo] = useState({
    isLargeDevice: false,
    isPortrait: true,
    screenWidth: 0,
    screenHeight: 0
  });
  
  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setDeviceInfo({
        isLargeDevice: width >= 768 || height >= 1024,
        isPortrait: height > width,
        screenWidth: width,
        screenHeight: height
      });
    };
    
    updateDeviceInfo();
    window.addEventListener('resize', updateDeviceInfo);
    window.addEventListener('orientationchange', updateDeviceInfo);
    
    return () => {
      window.removeEventListener('resize', updateDeviceInfo);
      window.removeEventListener('orientationchange', updateDeviceInfo);
    };
  }, []);
  
  return deviceInfo;
};

// Swipe gesture detection hook
export const useSwipeGestures = (onSwipeLeft?: () => void, onSwipeRight?: () => void) => {
  const [touchStart, setTouchStart] = useState<{x: number, y: number} | null>(null);
  
  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches && e.touches[0]) {
      setTouchStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY
      });
    }
  }, []);
  
  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart || !e.changedTouches || !e.changedTouches[0]) return;
    
    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY
    };
    
    const deltaX = touchEnd.x - touchStart.x;
    const deltaY = touchEnd.y - touchStart.y;
    
    // Only trigger horizontal swipes with minimal vertical movement
    if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 50) {
      if (deltaX > 0 && onSwipeRight) onSwipeRight();
      if (deltaX < 0 && onSwipeLeft) onSwipeLeft();
    }
    
    setTouchStart(null);
  }, [touchStart, onSwipeLeft, onSwipeRight]);
  
  useEffect(() => {
    document.addEventListener('touchstart', handleTouchStart);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);
};

// Settings persistence functions
export const saveOneHandedSettings = (settings: OneHandedSettings) => {
  localStorage.setItem('oneHandedSettings', JSON.stringify(settings));
};

export const loadOneHandedSettings = (): OneHandedSettings => {
  const saved = localStorage.getItem('oneHandedSettings');
  return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
};

// Touch zone mapper utility
export const TouchZoneMapper = {
  EASY_REACH: 0,    // Bottom 40% of screen
  STRETCH: 1,       // Middle 30% of screen
  DIFFICULT: 2,     // Top 30% of screen
  
  mapElement(element: HTMLElement): number {
    const rect = element.getBoundingClientRect();
    const screenHeight = window.innerHeight;
    const elementCenter = rect.top + (rect.height / 2);
    const relativePosition = elementCenter / screenHeight;
    
    if (relativePosition > 0.6) return this.EASY_REACH;
    if (relativePosition > 0.3) return this.STRETCH;
    return this.DIFFICULT;
  }
};

// One-handed mode context type
interface OneHandedModeContextType {
  isOneHandedMode: boolean;
  settings: OneHandedSettings;
  updateSettings: (partialSettings: Partial<OneHandedSettings>) => void;
  toggleOneHandedMode: () => void;
}

const OneHandedModeContext = createContext<OneHandedModeContextType | undefined>(undefined);

// Provider component
export const OneHandedModeProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [settings, setSettings] = useState<OneHandedSettings>(loadOneHandedSettings());
  const deviceInfo = useDeviceDetection();
  const [isOneHandedMode, setIsOneHandedMode] = useState(false);
  
  // Apply one-handed mode based on settings and device detection
  useEffect(() => {
    if (settings.enabled) {
      setIsOneHandedMode(true);
    } else if (settings.autoDetect && deviceInfo.isLargeDevice) {
      setIsOneHandedMode(true);
    } else {
      setIsOneHandedMode(false);
    }
    
    // Apply CSS class to body for global styling
    if (isOneHandedMode) {
      document.body.classList.add('one-handed-mode');
    } else {
      document.body.classList.remove('one-handed-mode');
    }
    
    // Apply UI scaling if configured
    if (settings.uiScale && settings.uiScale !== 1) {
      document.documentElement.style.setProperty('--one-handed-ui-scale', settings.uiScale.toString());
    } else {
      document.documentElement.style.removeProperty('--one-handed-ui-scale');
    }
  }, [settings, deviceInfo, isOneHandedMode]);
  
  const updateSettings = useCallback((partialSettings: Partial<OneHandedSettings>) => {
    const newSettings = { ...settings, ...partialSettings };
    setSettings(newSettings);
    saveOneHandedSettings(newSettings);
  }, [settings]);
  
  const toggleOneHandedMode = useCallback(() => {
    updateSettings({ enabled: !settings.enabled });
  }, [settings.enabled, updateSettings]);
  
  const contextValue: OneHandedModeContextType = {
    isOneHandedMode, 
    settings, 
    updateSettings,
    toggleOneHandedMode
  };
  
  return (
    <OneHandedModeContext.Provider value={contextValue}>
      {children}
    </OneHandedModeContext.Provider>
  );
};

// Hook to use one-handed mode context
export const useOneHandedMode = () => {
  const context = useContext(OneHandedModeContext);
  if (context === undefined) {
    throw new Error('useOneHandedMode must be used within a OneHandedModeProvider');
  }
  return context;
}; 