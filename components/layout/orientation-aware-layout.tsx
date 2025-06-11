'use client'

import React, { ReactNode } from 'react'
import { useOrientation } from '@/hooks/use-orientation'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'

interface OrientationAwareLayoutProps {
  children: ReactNode
  sidebar?: ReactNode
  rightPanel?: ReactNode
  className?: string
  /**
   * Layout behavior configuration
   */
  config?: {
    // Hide sidebars in landscape mode on mobile
    hideSidebarsInLandscape?: boolean
    // Stack vertically in portrait mode on mobile
    stackVerticallyInPortrait?: boolean
    // Show sidebar as bottom sheet in mobile
    sidebarAsBottomSheet?: boolean
    // Enable swipe navigation between panels
    enableSwipeNavigation?: boolean
  }
}

export function OrientationAwareLayout({
  children,
  sidebar,
  rightPanel,
  className,
  config = {
    hideSidebarsInLandscape: true,
    stackVerticallyInPortrait: true,
    sidebarAsBottomSheet: true,
    enableSwipeNavigation: true
  }
}: OrientationAwareLayoutProps) {
  const { orientation } = useOrientation()
  const isMobile = useIsMobile()

  // Desktop layout (always use three-column)
  if (!isMobile) {
    return (
      <div className={cn('grid grid-cols-1 lg:grid-cols-3 gap-6', className)}>
        {sidebar && (
          <div className="hidden lg:block">
            {sidebar}
          </div>
        )}
        <div className={cn(
          rightPanel ? 'lg:col-span-1' : 'lg:col-span-2'
        )}>
          {children}
        </div>
        {rightPanel && (
          <div className="hidden lg:block">
            {rightPanel}
          </div>
        )}
      </div>
    )
  }

  // Mobile landscape layout
  if (isMobile && orientation === 'landscape') {
    if (config.hideSidebarsInLandscape) {
      // Focus on main content in landscape mode
      return (
        <div className={cn('w-full', className)}>
          <div className="w-full max-w-none">
            {children}
          </div>
        </div>
      )
    } else {
      // Horizontal layout for landscape
      return (
        <div className={cn('flex gap-4 h-full overflow-hidden', className)}>
          {sidebar && (
            <div className="w-80 flex-shrink-0 overflow-y-auto">
              {sidebar}
            </div>
          )}
          <div className="flex-1 overflow-y-auto">
            {children}
          </div>
          {rightPanel && (
            <div className="w-80 flex-shrink-0 overflow-y-auto">
              {rightPanel}
            </div>
          )}
        </div>
      )
    }
  }

  // Mobile portrait layout
  if (isMobile && orientation === 'portrait') {
    if (config.stackVerticallyInPortrait) {
      // Vertical stacking for portrait mode
      return (
        <div className={cn('flex flex-col gap-4', className)}>
          {/* Main content first for better UX */}
          <div className="order-2">
            {children}
          </div>
          
          {/* Compact sidebar on top */}
          {sidebar && (
            <div className="order-1">
              <div className="bg-white dark:bg-gray-900/95 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 p-4 backdrop-blur-sm">
                {sidebar}
              </div>
            </div>
          )}
          
          {/* Right panel at bottom */}
          {rightPanel && (
            <div className="order-3">
              <div className="bg-white dark:bg-gray-900/95 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700/50 backdrop-blur-sm">
                {rightPanel}
              </div>
            </div>
          )}
        </div>
      )
    }
  }

  // Fallback to simple single column
  return (
    <div className={cn('w-full space-y-4', className)}>
      {children}
    </div>
  )
}

/**
 * Hook to get current layout information
 */
export function useLayoutInfo() {
  const { orientation } = useOrientation()
  const isMobile = useIsMobile()

  const layoutType = isMobile 
    ? orientation === 'landscape' 
      ? 'mobile-landscape' 
      : 'mobile-portrait'
    : 'desktop'

  return {
    orientation,
    isMobile,
    layoutType,
    isDesktop: !isMobile,
    isMobileLandscape: isMobile && orientation === 'landscape',
    isMobilePortrait: isMobile && orientation === 'portrait'
  }
} 