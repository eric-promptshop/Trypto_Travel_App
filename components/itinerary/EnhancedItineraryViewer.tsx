"use client"

import React, { useState } from 'react'
import { ThreeColumnItineraryBuilder } from './ThreeColumnItineraryBuilder'
import { ModernItineraryViewer } from './ModernItineraryViewer'
import { Button } from '@/components/ui/button'
import { Eye, Edit3 } from 'lucide-react'

interface EnhancedItineraryViewerProps {
  tripId: string
  itinerary: any
  onEdit?: () => void
  onShare?: () => void
  onDownload?: () => void
  onSave?: (updates: any) => void
}

export function EnhancedItineraryViewer({
  tripId,
  itinerary,
  onEdit,
  onShare,
  onDownload,
  onSave
}: EnhancedItineraryViewerProps) {
  const [viewMode, setViewMode] = useState<'modern' | 'builder'>('builder')
  
  const handleSaveFromBuilder = (updatedItinerary: any) => {
    // Convert builder format back to API format if needed
    if (onSave) {
      onSave(updatedItinerary)
    }
    // Optionally switch back to view mode
    setViewMode('modern')
  }
  
  if (viewMode === 'builder') {
    return (
      <ThreeColumnItineraryBuilder
        tripId={tripId}
        initialItinerary={itinerary}
        onSave={handleSaveFromBuilder}
        onBack={() => setViewMode('modern')}
      />
    )
  }
  
  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button
          onClick={() => setViewMode('builder')}
          className="gap-2"
        >
          <Edit3 className="h-4 w-4" />
          Interactive Builder
        </Button>
      </div>
      
      <ModernItineraryViewer
        itinerary={itinerary}
        onEdit={onEdit}
        onShare={onShare}
        onDownload={onDownload}
      />
    </div>
  )
}