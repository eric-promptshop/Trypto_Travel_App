"use client"

import { useEffect } from "react"
import { useDeviceType } from "./use-device-type"

export function usePreventScroll(enabled = true) {
  const deviceType = useDeviceType()
  
  useEffect(() => {
    if (!enabled) return
    
    // Only apply on mobile/tablet
    if (deviceType === 'desktop') return
    
    const preventScroll = (e: TouchEvent) => {
      // Allow scrolling within specific containers
      const target = e.target as HTMLElement
      const scrollableParent = target.closest('.messages-container, .scrollable')
      
      if (!scrollableParent) {
        e.preventDefault()
      }
    }
    
    const preventDefaultScroll = (e: Event) => {
      e.preventDefault()
    }
    
    // Prevent pull-to-refresh and overscroll
    document.addEventListener('touchmove', preventScroll, { passive: false })
    document.addEventListener('touchstart', preventDefaultScroll, { passive: false })
    
    // Lock body scroll
    const originalStyle = {
      position: document.body.style.position,
      top: document.body.style.top,
      width: document.body.style.width,
      height: document.body.style.height,
      overflow: document.body.style.overflow
    }
    
    const scrollY = window.scrollY
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.width = '100%'
    document.body.style.height = '100%'
    document.body.style.overflow = 'hidden'
    
    return () => {
      document.removeEventListener('touchmove', preventScroll)
      document.removeEventListener('touchstart', preventDefaultScroll)
      
      // Restore original styles
      document.body.style.position = originalStyle.position
      document.body.style.top = originalStyle.top
      document.body.style.width = originalStyle.width
      document.body.style.height = originalStyle.height
      document.body.style.overflow = originalStyle.overflow
      
      // Restore scroll position
      window.scrollTo(0, scrollY)
    }
  }, [enabled, deviceType])
}

// Hook to handle virtual keyboard
export function useVirtualKeyboard() {
  useEffect(() => {
    const handleViewportChange = () => {
      // Update viewport height when keyboard appears/disappears
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
      
      // Force layout recalculation
      document.body.style.height = `${window.innerHeight}px`
    }
    
    // Visual viewport API for better keyboard handling
    if ('visualViewport' in window) {
      window.visualViewport?.addEventListener('resize', handleViewportChange)
      window.visualViewport?.addEventListener('scroll', handleViewportChange)
    }
    
    window.addEventListener('resize', handleViewportChange)
    
    return () => {
      if ('visualViewport' in window) {
        window.visualViewport?.removeEventListener('resize', handleViewportChange)
        window.visualViewport?.removeEventListener('scroll', handleViewportChange)
      }
      window.removeEventListener('resize', handleViewportChange)
    }
  }, [])
}