import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { usePathname } from 'next/navigation'

interface UseLeadGenerationOptions {
  timeDelay?: number // ms before showing popup
  scrollThreshold?: number // percentage of page scrolled
  exitIntentEnabled?: boolean
  skipPaths?: string[] // paths where popup shouldn't show
}

export function useLeadGeneration({
  timeDelay = 30000, // 30 seconds
  scrollThreshold = 50,
  exitIntentEnabled = true,
  skipPaths = ['/login', '/register', '/admin', '/tour-operator']
}: UseLeadGenerationOptions = {}) {
  const [showPopup, setShowPopup] = useState(false)
  const [triggerReason, setTriggerReason] = useState<'exit_intent' | 'time_based' | 'scroll' | 'save_itinerary'>('time_based')
  const { data: session } = useSession()
  const pathname = usePathname()

  // Check if popup should be shown
  const shouldShowPopup = useCallback(() => {
    // Don't show if user is logged in
    if (session?.user) return false

    // Don't show on skip paths
    if (skipPaths.some(path => pathname.startsWith(path))) return false

    // Check if user has already converted (provided email)
    const hasConverted = localStorage.getItem('lead_popup_converted')
    const hasEmail = localStorage.getItem('lead_popup_email')
    if (hasConverted === 'true' || hasEmail) return false

    // Check if user skipped recently (7 days)
    const skipTime = localStorage.getItem('lead_popup_skip_time')
    if (skipTime) {
      const daysSinceSkip = (Date.now() - parseInt(skipTime)) / (1000 * 60 * 60 * 24)
      if (daysSinceSkip < 7) return false
    }

    // Check if user has already seen popup recently (24 hours)
    const lastShown = localStorage.getItem('lead_popup_last_shown')
    if (lastShown) {
      const hoursSinceShown = (Date.now() - parseInt(lastShown)) / (1000 * 60 * 60)
      if (hoursSinceShown < 24) return false
    }

    return true
  }, [session, pathname, skipPaths])

  // Handle time-based trigger
  useEffect(() => {
    if (!shouldShowPopup()) return

    const timer = setTimeout(() => {
      setTriggerReason('time_based')
      setShowPopup(true)
    }, timeDelay)

    return () => clearTimeout(timer)
  }, [timeDelay, shouldShowPopup])

  // Handle scroll-based trigger
  useEffect(() => {
    if (!shouldShowPopup()) return

    const handleScroll = () => {
      const scrollPercentage = (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
      
      if (scrollPercentage >= scrollThreshold && !showPopup) {
        setTriggerReason('scroll')
        setShowPopup(true)
        window.removeEventListener('scroll', handleScroll)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollThreshold, showPopup, shouldShowPopup])

  // Handle exit intent
  useEffect(() => {
    if (!exitIntentEnabled || !shouldShowPopup()) return

    const handleMouseLeave = (e: MouseEvent) => {
      // Only trigger when mouse leaves from the top
      if (e.clientY <= 0 && !showPopup) {
        setTriggerReason('exit_intent')
        setShowPopup(true)
      }
    }

    document.addEventListener('mouseleave', handleMouseLeave)
    return () => document.removeEventListener('mouseleave', handleMouseLeave)
  }, [exitIntentEnabled, showPopup, shouldShowPopup])

  // Track when popup is shown
  const handlePopupOpen = useCallback(() => {
    // Already tracked in close handler to prevent re-showing
  }, [])

  // Handle popup close
  const handlePopupClose = useCallback(() => {
    setShowPopup(false)
    // Mark as shown to prevent immediate re-display
    localStorage.setItem('lead_popup_last_shown', Date.now().toString())
  }, [])

  // Handle successful conversion
  const handleConversion = useCallback(() => {
    localStorage.setItem('lead_popup_converted', 'true')
    setShowPopup(false)
  }, [])

  // Manual trigger for save itinerary
  const triggerForSaveItinerary = useCallback(() => {
    if (!shouldShowPopup()) return false
    
    setTriggerReason('save_itinerary')
    setShowPopup(true)
    return true
  }, [shouldShowPopup])

  return {
    showPopup,
    triggerReason,
    handlePopupOpen,
    handlePopupClose,
    handleConversion,
    triggerForSaveItinerary
  }
}