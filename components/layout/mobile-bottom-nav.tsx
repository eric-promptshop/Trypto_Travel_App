'use client'

import React, { useState, useEffect } from 'react'
import { useLayoutInfo } from './orientation-aware-layout'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger 
} from '@/components/ui/sheet'
import { 
  MapIcon, 
  Camera, 
  Calendar, 
  Info,
  Menu
} from 'lucide-react'

interface MobileBottomNavProps {
  tripOverview?: React.ReactNode
  photosPanel?: React.ReactNode
  mapPanel?: React.ReactNode
  className?: string
}

export function MobileBottomNav({ 
  tripOverview, 
  photosPanel, 
  mapPanel, 
  className 
}: MobileBottomNavProps) {
  const { isMobileLandscape, isMobilePortrait } = useLayoutInfo()
  const [activeSheet, setActiveSheet] = useState<string | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  // Handle smooth mounting transition
  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Only show on mobile landscape or when sidebars would be hidden
  if (!isMobileLandscape && !isMobilePortrait) return null

  const navItems = [
    {
      id: 'overview',
      icon: Info,
      label: 'Trip Info',
      content: tripOverview,
      available: !!tripOverview
    },
    {
      id: 'photos',
      icon: Camera,
      label: 'Photos',
      content: photosPanel,
      available: !!photosPanel
    },
    {
      id: 'map',
      icon: MapIcon,
      label: 'Map',
      content: mapPanel,
      available: !!mapPanel
    }
  ].filter(item => item.available)

  return (
    <nav 
      className={cn(
        // Base positioning and layout
        'fixed bottom-0 left-0 right-0 z-40 safe-area-bottom lg:hidden',
        // Enhanced background and blur effects
        'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md',
        // Improved border styling
        'border-t border-gray-200/80 dark:border-gray-800/60',
        // Smooth transitions for theme changes
        'transition-all duration-300 ease-in-out',
        // Mounting animation
        isMounted ? 'translate-y-0 opacity-100' : 'translate-y-full opacity-0',
        // Reduced motion support
        'motion-reduce:transition-none motion-reduce:transform-none motion-reduce:opacity-100',
        className
      )}
      role="navigation"
      aria-label="Mobile bottom navigation"
    >
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = activeSheet === item.id
          
          return (
            <Sheet 
              key={item.id}
              open={activeSheet === item.id}
              onOpenChange={(open) => setActiveSheet(open ? item.id : null)}
            >
              <SheetTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className={cn(
                    // Base layout and sizing
                    'flex flex-col items-center gap-1 p-2 h-auto min-h-[44px] min-w-[44px]',
                    // Touch-friendly sizing
                    'touch-target relative',
                    // Enhanced color transitions and states
                    'text-gray-600 dark:text-gray-400',
                    'hover:text-gray-900 dark:hover:text-gray-100',
                    'hover:bg-gray-100/80 dark:hover:bg-gray-800/60',
                    // Active state styling
                    isActive && [
                      'text-blue-600 dark:text-blue-400',
                      'bg-blue-50/80 dark:bg-blue-950/40'
                    ],
                    // Improved focus states for accessibility
                    'focus-visible:outline-none focus-visible:ring-2',
                    'focus-visible:ring-blue-500 dark:focus-visible:ring-blue-400',
                    'focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950',
                    // Smooth transitions
                    'transition-all duration-200 ease-in-out',
                    'motion-reduce:transition-none'
                  )}
                  aria-pressed={isActive}
                  aria-label={`${item.label}${isActive ? ' (open)' : ''}`}
                >
                  <span className="relative inline-flex items-center justify-center">
                    <Icon 
                      className={cn(
                        'w-5 h-5 transition-colors duration-200',
                        isActive 
                          ? 'text-blue-600 dark:text-blue-400' 
                          : 'text-current'
                      )} 
                    />
                    {/* Active indicator */}
                    {isActive && (
                      <span 
                        className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"
                        aria-hidden="true"
                      />
                    )}
                  </span>
                  <span 
                    className={cn(
                      'text-xs font-medium transition-colors duration-200',
                      isActive 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : 'text-current'
                    )}
                  >
                    {item.label}
                  </span>
                </Button>
              </SheetTrigger>
              <SheetContent 
                side={isMobileLandscape ? "left" : "bottom"}
                className={cn(
                  // Dynamic sizing based on orientation
                  isMobileLandscape 
                    ? "w-80" 
                    : "h-[70vh] rounded-t-xl",
                  // Enhanced background and borders
                  'safe-area-bottom',
                  'bg-white/95 dark:bg-gray-950/95 backdrop-blur-md',
                  'border-gray-200/80 dark:border-gray-800/60',
                  'shadow-lg dark:shadow-gray-900/20',
                  // Smooth transitions
                  'transition-colors duration-200'
                )}
              >
                <SheetHeader className="pb-4">
                  <SheetTitle 
                    className={cn(
                      'text-gray-900 dark:text-gray-100',
                      'transition-colors duration-200'
                    )}
                  >
                    {item.label}
                  </SheetTitle>
                  <SheetDescription className="sr-only">
                    {item.label} panel content
                  </SheetDescription>
                </SheetHeader>
                <div 
                  className={cn(
                    'overflow-y-auto h-full',
                    'scrollbar-thin scrollbar-track-transparent',
                    'scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600'
                  )}
                >
                  {item.content}
                </div>
              </SheetContent>
            </Sheet>
          )
        })}
      </div>
    </nav>
  )
}

/**
 * Hook to determine if mobile bottom nav should be shown
 */
export function useMobileBottomNav() {
  const { isMobileLandscape, isMobilePortrait } = useLayoutInfo()
  
  return {
    shouldShow: isMobileLandscape || isMobilePortrait,
    preferredSide: isMobileLandscape ? 'left' : 'bottom'
  }
} 