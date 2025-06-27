'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { 
  ThemeConfiguration, 
  ThemeContextValue, 
  ThemePreset, 
  ThemePresetDefinition 
} from '@/types/theme';
import { defaultTheme, themePresetDefinitions, getThemeByPreset } from '@/lib/themes/default-themes';
import { applyTheme, validateTheme } from '@/lib/themes/theme-utils';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
  initialTheme?: ThemeConfiguration | ThemePreset;
  enablePreview?: boolean;
}

export function ThemeProvider({ 
  children, 
  initialTheme = 'default',
  enablePreview = true 
}: ThemeProviderProps) {
  const [currentTheme, setCurrentTheme] = useState<ThemeConfiguration>(defaultTheme);
  const [availableThemes] = useState<ThemePresetDefinition[]>(themePresetDefinitions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<ThemeConfiguration | null>(null);
  const [isPreview, setIsPreview] = useState(false);

  // Initialize theme on mount
  useEffect(() => {
    const initializeTheme = async () => {
      setIsLoading(true);
      setError(null);

      try {
        let theme: ThemeConfiguration;

        if (typeof initialTheme === 'string') {
          theme = getThemeByPreset(initialTheme);
        } else {
          theme = initialTheme;
        }

        // Validate theme
        const validation = validateTheme(theme);
        if (!validation.isValid) {
          throw new Error(`Invalid theme: ${validation.errors.map(e => e.message).join(', ')}`);
        }

        setCurrentTheme(theme);
        
        // Apply theme to document if in browser
        if (typeof window !== 'undefined') {
          applyTheme(theme);
          
          // Store theme preference
          localStorage.setItem('trypto-theme', JSON.stringify(theme));
        }
      } catch (err) {
        console.error('Failed to initialize theme:', err);
        setError(err instanceof Error ? err.message : 'Failed to initialize theme');
        
        // Fallback to default theme
        setCurrentTheme(defaultTheme);
        if (typeof window !== 'undefined') {
          applyTheme(defaultTheme);
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeTheme();
  }, []); // Only run on mount

  // Load saved theme from localStorage on client
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedTheme = localStorage.getItem('trypto-theme');
        if (savedTheme) {
          const theme = JSON.parse(savedTheme) as ThemeConfiguration;
          const validation = validateTheme(theme);
          
          if (validation.isValid) {
            setCurrentTheme(theme);
            applyTheme(theme);
          }
        }
      } catch (err) {
      }
    }
  }, []);

  // Set theme function
  const setTheme = useCallback(async (theme: ThemeConfiguration | ThemePreset): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      let themeConfig: ThemeConfiguration;

      if (typeof theme === 'string') {
        themeConfig = getThemeByPreset(theme);
      } else {
        themeConfig = theme;
      }

      // Validate theme
      const validation = validateTheme(themeConfig);
      if (!validation.isValid) {
        throw new Error(`Invalid theme: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      setCurrentTheme(themeConfig);
      
      // Apply theme to document
      if (typeof window !== 'undefined') {
        applyTheme(themeConfig);
        
        // Save theme preference
        localStorage.setItem('trypto-theme', JSON.stringify(themeConfig));
      }
      
      // Clear any preview
      setPreviewTheme(null);
      setIsPreview(false);
    } catch (err) {
      console.error('Failed to set theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to set theme');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update theme function (for partial updates)
  const updateTheme = useCallback(async (updates: Partial<ThemeConfiguration>): Promise<void> => {
    setIsLoading(true);
    setError(null);
    
    try {
      const updatedTheme: ThemeConfiguration = {
        ...currentTheme,
        ...updates,
        // Merge nested objects properly
        colors: {
          ...currentTheme.colors,
          ...updates.colors,
        },
        typography: {
          ...currentTheme.typography,
          ...updates.typography,
        },
        spacing: {
          ...currentTheme.spacing,
          ...updates.spacing,
        },
        breakpoints: {
          ...currentTheme.breakpoints,
          ...updates.breakpoints,
        },
        animations: {
          ...currentTheme.animations,
          ...updates.animations,
        },
        customProperties: {
          ...currentTheme.customProperties,
          ...updates.customProperties,
        },
      };

      // Validate updated theme
      const validation = validateTheme(updatedTheme);
      if (!validation.isValid) {
        throw new Error(`Invalid theme update: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      setCurrentTheme(updatedTheme);
      
      // Apply theme to document
      if (typeof window !== 'undefined') {
        applyTheme(updatedTheme);
        
        // Save updated theme
        localStorage.setItem('trypto-theme', JSON.stringify(updatedTheme));
      }
    } catch (err) {
      console.error('Failed to update theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to update theme');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [currentTheme]);

  // Reset theme to default
  const resetTheme = useCallback(async (): Promise<void> => {
    await setTheme(defaultTheme);
  }, [setTheme]);

  // Preview theme function (temporary theme application)
  const previewThemeFunc = useCallback((theme: ThemeConfiguration): void => {
    if (!enablePreview) return;
    
    try {
      const validation = validateTheme(theme);
      if (!validation.isValid) {
        throw new Error(`Invalid preview theme: ${validation.errors.map(e => e.message).join(', ')}`);
      }

      setPreviewTheme(theme);
      setIsPreview(true);
      
      // Apply preview theme to document
      if (typeof window !== 'undefined') {
        applyTheme(theme);
      }
    } catch (err) {
      console.error('Failed to preview theme:', err);
      setError(err instanceof Error ? err.message : 'Failed to preview theme');
    }
  }, [enablePreview]);

  // Clear preview function
  const clearPreview = useCallback((): void => {
    if (!isPreview) return;
    
    setPreviewTheme(null);
    setIsPreview(false);
    setError(null);
    
    // Reapply current theme
    if (typeof window !== 'undefined') {
      applyTheme(currentTheme);
    }
  }, [isPreview, currentTheme]);

  // Handle system dark mode changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      // Re-apply current theme with updated dark mode
      const activeTheme = previewTheme || currentTheme;
      applyTheme(activeTheme, e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    // Apply initial state
    const activeTheme = previewTheme || currentTheme;
    applyTheme(activeTheme, mediaQuery.matches);

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [currentTheme, previewTheme]);

  const contextValue: ThemeContextValue = {
    currentTheme: previewTheme || currentTheme,
    availableThemes,
    isLoading,
    error,
    setTheme,
    updateTheme,
    resetTheme,
    previewTheme: previewThemeFunc,
    clearPreview,
    isPreview,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}

// Hook to use theme context
export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}

// Hook to get current theme colors for use in components
export function useThemeColors() {
  const { currentTheme } = useTheme();
  return currentTheme.colors;
}

// Hook to get current theme typography for use in components
export function useThemeTypography() {
  const { currentTheme } = useTheme();
  return currentTheme.typography;
}

// Hook to get current theme spacing for use in components
export function useThemeSpacing() {
  const { currentTheme } = useTheme();
  return currentTheme.spacing;
} 