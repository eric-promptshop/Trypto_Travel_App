"use client"

import { useEffect } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { useDeviceType } from "@/hooks/use-device-type"

interface PolishedLayoutProps {
  children: React.ReactNode
  className?: string
  header?: React.ReactNode
  footer?: React.ReactNode
}

export function PolishedLayout({ 
  children, 
  className,
  header,
  footer 
}: PolishedLayoutProps) {
  const deviceType = useDeviceType()
  
  // Update CSS custom property for viewport height
  useEffect(() => {
    const updateViewportHeight = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }
    
    updateViewportHeight()
    window.addEventListener('resize', updateViewportHeight)
    window.addEventListener('orientationchange', updateViewportHeight)
    
    // Note: Removed body position fixed to allow normal scrolling
    
    return () => {
      window.removeEventListener('resize', updateViewportHeight)
      window.removeEventListener('orientationchange', updateViewportHeight)
      // Cleanup not needed since we're not modifying body styles
    }
  }, [])
  
  return (
    <div className={cn(
      "h-screen-safe flex flex-col overflow-hidden bg-gradient-to-br from-blue-50 via-white to-orange-50",
      className
    )}>
      {header && (
        <motion.header 
          className="flex-shrink-0 z-10"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {header}
        </motion.header>
      )}
      
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
      
      {footer && (
        <motion.footer 
          className="flex-shrink-0 z-10"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          {footer}
        </motion.footer>
      )}
    </div>
  )
}

// Snappy scroll container with momentum scrolling
interface SnappyScrollContainerProps {
  children: React.ReactNode
  className?: string
  hideScrollbar?: boolean
}

export function SnappyScrollContainer({ 
  children, 
  className,
  hideScrollbar = false 
}: SnappyScrollContainerProps) {
  return (
    <div 
      className={cn(
        "flex-1 overflow-y-auto overflow-x-hidden",
        "-webkit-overflow-scrolling-touch",
        "scroll-smooth overscroll-contain",
        hideScrollbar && "scrollbar-hide",
        className
      )}
    >
      {children}
    </div>
  )
}

// Fixed bottom container for inputs/actions
interface FixedBottomContainerProps {
  children: React.ReactNode
  className?: string
  withSafeArea?: boolean
}

export function FixedBottomContainer({ 
  children, 
  className,
  withSafeArea = true 
}: FixedBottomContainerProps) {
  return (
    <div 
      className={cn(
        "flex-shrink-0 bg-white border-t border-gray-200",
        withSafeArea && "pb-safe",
        className
      )}
    >
      {children}
    </div>
  )
}