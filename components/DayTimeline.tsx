"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { 
  Clock,
  MapPin,
  GripVertical,
  X,
  AlertCircle,
  ChevronRight,
  Walking
} from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
// import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from 'sonner'
import { usePlanStore, TimeSlot, DayPlan } from '@/store/planStore'

interface DayTimelineProps {
  day: DayPlan
  onSlotClick?: (slotId: string) => void
}

export function DayTimeline({ day, onSlotClick }: DayTimelineProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isReordering, setIsReordering] = useState(false)
  
  const { 
    itinerary,
    reorderDaySlots,
    removePoiFromDay,
    highlightPoi,
    highlightedPoiId,
    flyToPoi,
    getTimeGaps
  } = usePlanStore()
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Get POI details for each slot
  const slotsWithDetails = day.slots.map(slot => {
    const poi = itinerary?.pois.find(p => p.id === slot.poiId)
    return { ...slot, poi }
  })
  
  // Get time gaps
  const gaps = getTimeGaps(day.id)
  
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
    setIsReordering(true)
  }
  
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    
    if (over && active.id !== over.id) {
      const oldIndex = day.slots.findIndex(s => s.id === active.id)
      const newIndex = day.slots.findIndex(s => s.id === over.id)
      
      // Optimistic update
      try {
        reorderDaySlots(day.id, oldIndex, newIndex)
        toast.success('Route updated', { duration: 2000 })
      } catch (error) {
        toast.error('Failed to reorder. Please try again.')
      }
    }
    
    setActiveId(null)
    setIsReordering(false)
  }
  
  const handleRemove = (slotId: string) => {
    const slot = slotsWithDetails.find(s => s.id === slotId)
    if (!slot || !slot.poi) return
    
    removePoiFromDay(day.id, slotId)
    
    // Show undo toast
    const toastId = toast.success(
      <div className="flex items-center justify-between w-full">
        <span>Removed {slot.poi.name}</span>
        <button
          onClick={() => {
            // Re-add the POI
            usePlanStore.getState().addPoiToDay(slot.poi!, day.id, slot.startTime)
            toast.dismiss(toastId)
          }}
          className="ml-4 text-sm font-medium hover:underline"
        >
          Undo
        </button>
      </div>,
      { duration: 5000 }
    )
  }
  
  // Find the active slot for drag overlay
  const activeSlot = activeId ? slotsWithDetails.find(s => s.id === activeId) : null
  
  return (
    <div className="h-full flex flex-col">
      {/* Day Header */}
      <div className="p-4 border-b bg-white">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-lg">
            Day {day.dayNumber} Timeline
          </h3>
          <Badge variant="secondary">
            {day.slots.length} activities
          </Badge>
        </div>
        <p className="text-sm text-gray-600">
          {format(day.date, 'EEEE, MMMM d, yyyy')}
        </p>
      </div>
      
      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={day.slots.map(s => s.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-3">
                {/* Day start indicator */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span>Day starts</span>
                </div>
                
                {/* Render slots with gaps */}
                {slotsWithDetails.map((slot, index) => {
                  // Check if there's a gap before this slot
                  const gapBefore = gaps.find(g => g.end === slot.startTime)
                  
                  return (
                    <React.Fragment key={slot.id}>
                      {gapBefore && gapBefore.duration > 30 && (
                        <TimeGap gap={gapBefore} dayId={day.id} />
                      )}
                      
                      <SortableTimeSlot
                        slot={slot}
                        isHighlighted={highlightedPoiId === slot.poiId}
                        onMouseEnter={() => slot.poiId && highlightPoi(slot.poiId)}
                        onMouseLeave={() => highlightPoi(null)}
                        onClick={() => {
                          if (slot.poiId) flyToPoi(slot.poiId)
                          if (onSlotClick) onSlotClick(slot.id)
                        }}
                        onRemove={() => handleRemove(slot.id)}
                        isReordering={isReordering}
                      />
                      
                      {/* Transport time indicator */}
                      {slot.transportTime && slot.transportTime > 0 && index < slotsWithDetails.length - 1 && (
                        <div className="flex items-center gap-2 pl-8 text-sm text-gray-500">
                          <Walking className="h-3 w-3" />
                          <span>{slot.transportTime} min walk</span>
                        </div>
                      )}
                    </React.Fragment>
                  )
                })}
                
                {/* Check for gap at end of day */}
                {gaps.find(g => g.start === (slotsWithDetails[slotsWithDetails.length - 1]?.endTime || '08:00')) && (
                  <TimeGap 
                    gap={gaps.find(g => g.start === (slotsWithDetails[slotsWithDetails.length - 1]?.endTime || '08:00'))!} 
                    dayId={day.id} 
                  />
                )}
                
                {/* Day end indicator */}
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <div className="w-2 h-2 rounded-full bg-gray-300" />
                  <span>Day ends</span>
                </div>
              </div>
            </SortableContext>
            
            {/* Drag overlay */}
            <DragOverlay>
              {activeSlot && (
                <TimeSlotCard
                  slot={activeSlot}
                  isDragging
                />
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
      
      {/* Summary */}
      {day.slots.length === 0 && (
        <div className="p-4 border-t bg-gray-50">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No activities planned yet. Browse places and add them to this day.
            </AlertDescription>
          </Alert>
        </div>
      )}
    </div>
  )
}

// Sortable wrapper component
interface SortableTimeSlotProps {
  slot: TimeSlot & { poi?: any }
  isHighlighted: boolean
  onMouseEnter: () => void
  onMouseLeave: () => void
  onClick: () => void
  onRemove: () => void
  isReordering: boolean
}

function SortableTimeSlot(props: SortableTimeSlotProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: props.slot.id })
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
    >
      <TimeSlotCard
        {...props}
        isDragging={isDragging}
        dragHandleProps={listeners}
      />
    </div>
  )
}

// Time slot card component
interface TimeSlotCardProps {
  slot: TimeSlot & { poi?: any }
  isHighlighted?: boolean
  isDragging?: boolean
  onMouseEnter?: () => void
  onMouseLeave?: () => void
  onClick?: () => void
  onRemove?: () => void
  isReordering?: boolean
  dragHandleProps?: any
}

function TimeSlotCard({
  slot,
  isHighlighted = false,
  isDragging = false,
  onMouseEnter,
  onMouseLeave,
  onClick,
  onRemove,
  isReordering = false,
  dragHandleProps
}: TimeSlotCardProps) {
  if (!slot.poi) return null
  
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ 
        opacity: isDragging ? 0.5 : 1, 
        y: 0,
        scale: isDragging ? 1.05 : 1
      }}
      exit={{ opacity: 0, y: -20 }}
      whileHover={{ scale: isReordering ? 1 : 1.02 }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={onClick}
      className={cn(
        "relative rounded-lg border bg-white p-4 cursor-pointer transition-all",
        isHighlighted && "border-orange-400 shadow-md",
        isDragging && "shadow-lg z-50",
        !isHighlighted && !isDragging && "border-gray-200 hover:border-gray-300"
      )}
    >
      <div className="flex gap-3">
        {/* Drag handle */}
        <div
          {...dragHandleProps}
          className={cn(
            "flex items-center cursor-grab active:cursor-grabbing",
            isReordering && "opacity-100",
            !isReordering && "opacity-0 hover:opacity-100"
          )}
        >
          <GripVertical className="h-5 w-5 text-gray-400" />
        </div>
        
        {/* Time */}
        <div className="flex-shrink-0 text-sm">
          <div className="font-medium">{slot.startTime}</div>
          <div className="text-gray-500">{slot.endTime}</div>
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-medium truncate">{slot.poi.name}</h4>
          {slot.poi.location?.address && (
            <p className="text-sm text-gray-600 truncate flex items-center gap-1 mt-1">
              <MapPin className="h-3 w-3" />
              {slot.poi.location.address}
            </p>
          )}
          <div className="flex items-center gap-2 mt-2 text-sm text-gray-500">
            <Clock className="h-3 w-3" />
            <span>{slot.duration} min</span>
          </div>
        </div>
        
        {/* Remove button */}
        {!isDragging && onRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 opacity-0 hover:opacity-100 transition-opacity"
            onClick={(e) => {
              e.stopPropagation()
              onRemove()
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </motion.div>
  )
}

// Time gap component
interface TimeGapProps {
  gap: { start: string; end: string; duration: number }
  dayId: string
}

function TimeGap({ gap, dayId }: TimeGapProps) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
    }
    return `${mins}m`
  }
  
  return (
    <div className="relative">
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />
      <div className="pl-8 pr-4 py-2">
        <div className="bg-gray-50 rounded-lg p-3 border border-dashed border-gray-300">
          <div className="flex items-center justify-between">
            <div className="text-sm">
              <span className="text-gray-500">Free time:</span>
              <span className="font-medium ml-1">
                {formatDuration(gap.duration)}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
            >
              Add activity
              <ChevronRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}