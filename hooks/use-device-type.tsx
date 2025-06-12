"use client"

import { useState, useEffect } from "react"

export type DeviceType = "mobile" | "tablet" | "desktop"

interface DeviceBreakpoints {
  mobile: number
  tablet: number
  desktop: number
}

// Tailwind CSS default breakpoints
const BREAKPOINTS: DeviceBreakpoints = {
  mobile: 640,   // sm: 640px
  tablet: 768,   // md: 768px  
  desktop: 1024, // lg: 1024px
}

export function useDeviceType(): DeviceType {
  const [deviceType, setDeviceType] = useState<DeviceType>("desktop")
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const getDeviceType = (width: number): DeviceType => {
      if (width < BREAKPOINTS.mobile) return "mobile"
      if (width < BREAKPOINTS.desktop) return "tablet"
      return "desktop"
    }

    const handleResize = () => {
      setDeviceType(getDeviceType(window.innerWidth))
    }

    // Set initial device type
    handleResize()

    // Add event listener with debounce for performance
    let timeoutId: NodeJS.Timeout
    const debouncedResize = () => {
      clearTimeout(timeoutId)
      timeoutId = setTimeout(handleResize, 150)
    }

    window.addEventListener("resize", debouncedResize)
    
    return () => {
      window.removeEventListener("resize", debouncedResize)
      clearTimeout(timeoutId)
    }
  }, [])

  // Return desktop as default for SSR
  if (!isClient) return "desktop"

  return deviceType
}

// Additional helper hooks
export function useIsMobile(): boolean {
  return useDeviceType() === "mobile"
}

export function useIsTablet(): boolean {
  return useDeviceType() === "tablet"
}

export function useIsDesktop(): boolean {
  return useDeviceType() === "desktop"
}

// Utility function for responsive values
export function useResponsive<T>(
  mobile: T,
  tablet: T,
  desktop: T
): T {
  const device = useDeviceType()
  
  switch (device) {
    case "mobile":
      return mobile
    case "tablet":
      return tablet
    case "desktop":
      return desktop
    default:
      return desktop
  }
}

// Hook for media queries
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    const media = window.matchMedia(query)
    
    const updateMatch = () => setMatches(media.matches)
    updateMatch()
    
    media.addEventListener("change", updateMatch)
    return () => media.removeEventListener("change", updateMatch)
  }, [query])

  if (!isClient) return false
  
  return matches
}

// Breakpoint constants for use in components
export const DEVICE_BREAKPOINTS = BREAKPOINTS