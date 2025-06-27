"use client"

import React, { useEffect, useRef, Suspense, lazy } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ItineraryUIProvider, useItineraryUI } from './ItineraryUIContext'
import { Skeleton } from '@/components/ui/skeleton-components'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Eye, Pencil, Info } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast, { Toaster } from 'react-hot-toast'

// Lazy load heavy components
const EnhancedItineraryBuilder = lazy(() => import('@/components/EnhancedItineraryBuilder').then(mod => ({ default: mod.default })))
const ModernItineraryViewer = lazy(() => import('./ModernItineraryViewer').then(mod => ({ default: mod.ModernItineraryViewer })))

interface EnhancedItineraryViewerProps {
  tripId: string
  itinerary: any
  onEdit?: () => void
  onShare?: () => void
  onDownload?: () => void
  onSave?: (updates: any) => void
}

function ViewModeToggle() {
  const { viewMode, setViewMode } = useItineraryUI()
  
  return (
    <TooltipProvider>
      <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setViewMode('viewer')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === 'viewer' 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
              aria-label="Viewer mode"
            >
              <Eye className="h-4 w-4" />
              Viewer
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>View your itinerary in a clean, read-only format</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setViewMode('builder')}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                viewMode === 'builder' 
                  ? "bg-white text-gray-900 shadow-sm" 
                  : "text-gray-600 hover:text-gray-900"
              )}
              aria-label="Builder mode"
            >
              <Pencil className="h-4 w-4" />
              Builder
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Edit and customize your itinerary with interactive tools</p>
          </TooltipContent>
        </Tooltip>
        
        <Tooltip>
          <TooltipTrigger asChild>
            <Info className="h-4 w-4 text-gray-400 ml-1" />
          </TooltipTrigger>
          <TooltipContent>
            <p>Switch between viewing and editing your travel plans</p>
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  )
}

function EnhancedItineraryViewerContent({
  tripId,
  itinerary,
  onEdit,
  onShare,
  onDownload,
  onSave
}: EnhancedItineraryViewerProps) {
  const { viewMode, selectedDay, setSelectedDay } = useItineraryUI()
  const router = useRouter()
  const searchParams = useSearchParams()
  const lastSavedState = useRef<any>(null)
  
  // Handle deep linking - read ?day= on mount
  useEffect(() => {
    const dayParam = searchParams.get('day')
    if (dayParam) {
      const day = parseInt(dayParam, 10)
      if (!isNaN(day) && day > 0) {
        setSelectedDay(day)
      }
    }
  }, [searchParams, setSelectedDay])
  
  // Update URL when day changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString())
    params.set('day', selectedDay.toString())
    router.push(`?${params.toString()}`, { scroll: false })
  }, [selectedDay, router, searchParams])
  
  const handleSaveFromBuilder = (updatedItinerary: any) => {
    // Store previous state for undo
    lastSavedState.current = itinerary
    
    if (onSave) {
      onSave(updatedItinerary)
      
      // Show toast with undo
      toast.success(
        (t) => (
          <div className="flex items-center gap-3">
            <span>Itinerary saved successfully</span>
            <button
              onClick={() => {
                if (lastSavedState.current && onSave) {
                  onSave(lastSavedState.current)
                  toast.dismiss(t.id)
                  toast.success('Changes undone')
                }
              }}
              className="font-medium text-blue-600 hover:text-blue-700"
            >
              Undo
            </button>
          </div>
        ),
        { duration: 5000 }
      )
    }
  }
  
  return (
    <>
      <div className="sticky top-0 z-40 bg-white border-b px-4 py-3">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <h2 className="text-lg font-semibold">Your Itinerary</h2>
          <ViewModeToggle />
        </div>
      </div>
      
      <div className="relative">
        {viewMode === 'builder' ? (
          <Suspense fallback={<Skeleton type="itinerary" className="p-4" />}>
            <EnhancedItineraryBuilder
              tripId={tripId}
              initialItinerary={itinerary}
              onSave={handleSaveFromBuilder}
              onBack={() => {}}
            />
          </Suspense>
        ) : (
          <Suspense fallback={<Skeleton type="itinerary" className="p-4" />}>
            <ModernItineraryViewer
              itinerary={itinerary}
              onEdit={onEdit}
              onShare={onShare}
              onDownload={onDownload}
            />
          </Suspense>
        )}
      </div>
    </>
  )
}

export function EnhancedItineraryViewer(props: EnhancedItineraryViewerProps) {
  return (
    <ItineraryUIProvider>
      <EnhancedItineraryViewerContent {...props} />
      <Toaster position="bottom-center" />
    </ItineraryUIProvider>
  )
}