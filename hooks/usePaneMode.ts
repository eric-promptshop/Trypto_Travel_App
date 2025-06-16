import { useState, useEffect } from 'react'
import { useMediaQuery } from '@/hooks/useMediaQuery'

export type PaneMode = 'three-pane' | 'two-pane' | 'single-pane'
export type ActivePane = 'explore' | 'map' | 'timeline'

interface UsePaneModeReturn {
  mode: PaneMode
  activePane: ActivePane
  setActivePane: (pane: ActivePane) => void
  isDrawerOpen: boolean
  toggleDrawer: () => void
  showExplore: boolean
  showMap: boolean
  showTimeline: boolean
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
}

export function usePaneMode(): UsePaneModeReturn {
  // Media queries for responsive breakpoints
  const isDesktop = useMediaQuery('(min-width: 1280px)') // XL
  const isTablet = useMediaQuery('(min-width: 768px) and (max-width: 1279px)') // MD
  const isMobile = useMediaQuery('(max-width: 767px)') // SM
  
  // Determine pane mode based on screen size
  const mode: PaneMode = isDesktop ? 'three-pane' : isTablet ? 'two-pane' : 'single-pane'
  
  // Active pane state (relevant for mobile)
  const [activePane, setActivePane] = useState<ActivePane>('map')
  
  // Drawer state (for tablet mode)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
  // Reset drawer state when switching modes
  useEffect(() => {
    if (mode !== 'two-pane') {
      setIsDrawerOpen(false)
    }
  }, [mode])
  
  // Determine which panes to show based on mode and state
  const showExplore = mode === 'three-pane' || (mode === 'two-pane' && isDrawerOpen) || (mode === 'single-pane' && activePane === 'explore')
  const showMap = mode === 'three-pane' || mode === 'two-pane' || (mode === 'single-pane' && activePane === 'map')
  const showTimeline = mode === 'three-pane' || mode === 'two-pane' || (mode === 'single-pane' && activePane === 'timeline')
  
  const toggleDrawer = () => {
    setIsDrawerOpen(prev => !prev)
  }
  
  return {
    mode,
    activePane,
    setActivePane,
    isDrawerOpen,
    toggleDrawer,
    showExplore,
    showMap,
    showTimeline,
    isMobile,
    isTablet,
    isDesktop
  }
}

// Helper hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  
  useEffect(() => {
    const media = window.matchMedia(query)
    
    if (media.matches !== matches) {
      setMatches(media.matches)
    }
    
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches)
    
    // Modern browsers
    if (media.addEventListener) {
      media.addEventListener('change', listener)
      return () => media.removeEventListener('change', listener)
    } 
    // Fallback for older browsers
    else {
      media.addListener(listener)
      return () => media.removeListener(listener)
    }
  }, [matches, query])
  
  // SSR-safe initial value
  useEffect(() => {
    setMatches(window.matchMedia(query).matches)
  }, [query])
  
  return matches
}