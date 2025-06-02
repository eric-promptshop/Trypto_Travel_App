"use client"

import * as React from "react"
import { useState, useMemo } from "react"
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  DragOverEvent,
  closestCenter,
  pointerWithin,
  rectIntersection,
  getFirstCollision,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  Active,
  Over,
} from "@dnd-kit/core"
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable"
import {
  CSS,
} from "@dnd-kit/utilities"
import { 
  Clock, 
  MapPin, 
  Star, 
  Trash2,
  AlertTriangle,
  Calendar,
  Users,
  DollarSign,
  Plus,
  Edit,
  GripVertical,
  CheckCircle,
  XCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useToast } from "@/components/ui/use-toast"

// Types for selected activities (extending the base Activity interface)
interface SelectedActivity {
  id: string
  name: string
  description: string
  category: 'adventure' | 'cultural' | 'culinary' | 'nature' | 'entertainment' | 'shopping' | 'historical' | 'art' | 'sports' | 'nightlife'
  imageUrl: string
  location: {
    address: string
    city: string
    coordinates: [number, number]
  }
  duration: {
    min: number
    max: number
    typical: number
  }
  pricing: {
    currency: string
    adult: number
    child?: number
    isFree: boolean
  }
  rating: {
    overall: number
    reviewCount: number
  }
  selectedDate: string // ISO date string
  selectedTimeSlot: string // "09:00"
  participants: {
    adults: number
    children: number
  }
  totalPrice: number
  // Drag and drop specific fields
  order?: number
  isValidDrop?: boolean
  originalDate?: string
}

interface TimeConflict {
  activityIds: string[]
  startTime: string
  endTime: string
  conflictType: 'overlap' | 'back-to-back' | 'travel-time'
}

interface DaySchedule {
  date: string
  activities: SelectedActivity[]
  conflicts: TimeConflict[]
  totalDuration: number // in minutes
  totalPrice: number
  isEmpty: boolean
  acceptsDrops: boolean
  maxActivities?: number
}

interface DragDropTimelineProps {
  selectedActivities: SelectedActivity[]
  tripDates: {
    startDate: Date
    endDate: Date
  }
  onActivityRemove: (activityId: string) => void
  onActivityReorder: (activities: SelectedActivity[]) => void
  onActivityTimeChange?: (activityId: string, newTime: string) => void
  onActivityDateChange?: (activityId: string, newDate: string, newOrder?: number) => void
  onAddActivityClick?: (date: string) => void
  className?: string
  maxActivitiesPerDay?: number
  enableTimeSlotDropzones?: boolean
}

// Validation functions
const canActivityFitInDay = (activity: SelectedActivity, targetDate: string, existingActivities: SelectedActivity[]): boolean => {
  // Check if moving to same day (always allowed for reordering)
  if (activity.selectedDate === targetDate) return true
  
  // Check basic constraints
  const dayActivities = existingActivities.filter(a => a.selectedDate === targetDate && a.id !== activity.id)
  
  // Validate day of week constraints (example: some activities only on weekends)
  const targetDayOfWeek = new Date(targetDate).getDay()
  if (activity.category === 'nightlife' && targetDayOfWeek === 0) { // No nightlife on Sundays
    return false
  }
  
  // Check total duration doesn't exceed reasonable day limit (12 hours = 720 minutes)
  const totalDuration = dayActivities.reduce((sum, a) => sum + a.duration.typical, 0) + activity.duration.typical
  if (totalDuration > 720) return false
  
  return true
}

const generateOptimalTimeSlot = (targetDate: string, existingActivities: SelectedActivity[]): string => {
  const dayActivities = existingActivities.filter(a => a.selectedDate === targetDate)
  
  if (dayActivities.length === 0) return "09:00"
  
  // Sort by time and find the next available slot
  const sortedActivities = dayActivities.sort((a, b) => a.selectedTimeSlot.localeCompare(b.selectedTimeSlot))
  const lastActivity = sortedActivities[sortedActivities.length - 1]
  
  // Check if lastActivity exists
  if (!lastActivity) return "09:00"
  
  // Add activity duration + 30 minute buffer
  const lastEndTime = addMinutesToTime(lastActivity.selectedTimeSlot, lastActivity.duration.typical + 30)
  
  return lastEndTime
}

// Utility functions (same as in ActivityTimeline)
const formatTime = (timeString: string): string => {
  const timeParts = timeString.split(':')
  if (timeParts.length !== 2) return timeString
  
  const hours = timeParts[0]
  const minutes = timeParts[1]
  const hour = parseInt(hours || '0')
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(price)
}

const addMinutesToTime = (timeString: string, minutes: number): string => {
  const timeParts = timeString.split(':')
  if (timeParts.length !== 2) return timeString
  
  const hours = parseInt(timeParts[0] || '0')
  const mins = parseInt(timeParts[1] || '0')
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

const detectConflicts = (activities: SelectedActivity[]): TimeConflict[] => {
  const conflicts: TimeConflict[] = []
  
  for (let i = 0; i < activities.length; i++) {
    for (let j = i + 1; j < activities.length; j++) {
      const activityA = activities[i]
      const activityB = activities[j]
      
      if (!activityA || !activityB) continue
      
      const startA = activityA.selectedTimeSlot
      const endA = addMinutesToTime(startA, activityA.duration.typical)
      const startB = activityB.selectedTimeSlot
      const endB = addMinutesToTime(startB, activityB.duration.typical)
      
      // Check for overlap
      if ((startA <= startB && endA > startB) || (startB <= startA && endB > startA)) {
        conflicts.push({
          activityIds: [activityA.id, activityB.id],
          startTime: startA < startB ? startA : startB,
          endTime: endA > endB ? endA : endB,
          conflictType: 'overlap'
        })
      }
    }
  }
  
  return conflicts
}

// Draggable Activity Card Component
const DraggableActivityCard: React.FC<{
  activity: SelectedActivity
  onRemove: (id: string) => void
  hasConflict: boolean
  isDragging?: boolean
  className?: string
}> = ({ activity, onRemove, hasConflict, isDragging, className }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ 
    id: activity.id,
    data: {
      type: 'activity',
      activity,
    }
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const endTime = addMinutesToTime(activity.selectedTimeSlot, activity.duration.typical)
  const isCurrentlyDragging = isDragging || isSortableDragging

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className={cn(
        "transition-all duration-200 relative",
        hasConflict && "border-red-300 bg-red-50",
        isCurrentlyDragging && "opacity-50 shadow-lg ring-2 ring-blue-500 ring-offset-2",
        !activity.isValidDrop && isCurrentlyDragging && "ring-red-500",
        className
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          <div 
            {...attributes}
            {...listeners}
            className="flex-shrink-0 mt-2 cursor-grab active:cursor-grabbing hover:bg-gray-100 rounded p-1 transition-colors"
          >
            <GripVertical className="h-4 w-4 text-gray-400" />
          </div>
          
          <img
            src={activity.imageUrl}
            alt={activity.name}
            className="w-16 h-16 rounded object-cover flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-base leading-tight mb-1">
                  {activity.name}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {activity.description}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(activity.id)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 flex-shrink-0 ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(activity.selectedTimeSlot)} - {formatTime(endTime)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{activity.location.address.split(',')[0]}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(activity.duration.typical)}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {activity.category}
                </Badge>
                {hasConflict && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Conflict
                  </Badge>
                )}
              </div>
              
              <div className="text-right">
                <span className="font-semibold">
                  {activity.pricing.isFree ? 'Free' : formatPrice(activity.totalPrice, activity.pricing.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Drop Zone Component for Empty Days
const DayDropZone: React.FC<{
  date: string
  isOver: boolean
  canDrop: boolean
  onAddActivity?: (date: string) => void
}> = ({ date, isOver, canDrop, onAddActivity }) => {
  const dateObj = new Date(date)
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <Card className={cn(
      "border-dashed border-2 transition-all duration-200",
      isOver && canDrop && "border-blue-500 bg-blue-50",
      isOver && !canDrop && "border-red-500 bg-red-50",
      !isOver && "border-gray-300"
    )}>
      <CardContent className="p-8 text-center">
        <div className={cn(
          "transition-all duration-200",
          isOver && canDrop && "scale-110",
          isOver && !canDrop && "scale-95"
        )}>
          {isOver ? (
            canDrop ? (
              <CheckCircle className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            ) : (
              <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            )
          ) : (
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          )}
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {isOver ? (
              canDrop ? 'Drop activity here' : 'Cannot drop here'
            ) : 'No activities planned'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {isOver ? (
              canDrop ? 'Release to add activity to this day' : 'This activity cannot be added to this day'
            ) : `Add some activities to make the most of your ${dayName}`}
          </p>
          
          {!isOver && onAddActivity && (
            <Button 
              variant="outline" 
              onClick={() => onAddActivity(date)}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Droppable Day Component
const DroppableDaySchedule: React.FC<{
  daySchedule: DaySchedule
  onActivityRemove: (id: string) => void
  onAddActivity?: (date: string) => void
  isOver: boolean
  canDrop: boolean
}> = ({ daySchedule, onActivityRemove, onAddActivity, isOver, canDrop }) => {
  const dateObj = new Date(daySchedule.date)
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
  const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (daySchedule.isEmpty) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{dayName}</h3>
            <p className="text-sm text-gray-600">{dateString}</p>
          </div>
        </div>
        <DayDropZone 
          date={daySchedule.date} 
          isOver={isOver}
          canDrop={canDrop}
          {...(onAddActivity && { onAddActivity })}
        />
      </div>
    )
  }

  // Sort activities by time
  const sortedActivities = [...daySchedule.activities].sort((a, b) => 
    a.selectedTimeSlot.localeCompare(b.selectedTimeSlot)
  )

  const conflictActivityIds = new Set(
    daySchedule.conflicts.flatMap(conflict => conflict.activityIds)
  )

  return (
    <div className={cn(
      "space-y-4 transition-all duration-200",
      isOver && canDrop && "ring-2 ring-blue-500 ring-opacity-50 rounded-lg",
      isOver && !canDrop && "ring-2 ring-red-500 ring-opacity-50 rounded-lg"
    )}>
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{dayName}</h3>
          <p className="text-sm text-gray-600">{dateString}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {daySchedule.activities.length} activities • {formatDuration(daySchedule.totalDuration)}
          </div>
          <div className="font-semibold">
            {formatPrice(daySchedule.totalPrice, 'EUR')}
          </div>
        </div>
      </div>

      {/* Conflict Alerts */}
      {daySchedule.conflicts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {daySchedule.conflicts.length} time conflict{daySchedule.conflicts.length > 1 ? 's' : ''} detected. 
            Please adjust activity times to avoid overlaps.
          </AlertDescription>
        </Alert>
      )}

      {/* Drop Zone Indicator */}
      {isOver && (
        <div className={cn(
          "p-2 border-2 border-dashed rounded-lg text-center text-sm",
          canDrop ? "border-blue-500 bg-blue-50 text-blue-700" : "border-red-500 bg-red-50 text-red-700"
        )}>
          {canDrop ? "Drop to add activity to this day" : "Cannot add activity to this day"}
        </div>
      )}

      {/* Activities List */}
      <SortableContext items={sortedActivities.map(a => a.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {sortedActivities.map((activity) => (
            <DraggableActivityCard
              key={activity.id}
              activity={activity}
              onRemove={onActivityRemove}
              hasConflict={conflictActivityIds.has(activity.id)}
            />
          ))}
        </div>
      </SortableContext>

      {/* Add Activity Button */}
      {onAddActivity && (
        <Button 
          variant="outline" 
          className="w-full gap-2" 
          onClick={() => onAddActivity(daySchedule.date)}
        >
          <Plus className="h-4 w-4" />
          Add Another Activity
        </Button>
      )}
    </div>
  )
}

// Main Drag-and-Drop Timeline Component
export const DragDropTimeline: React.FC<DragDropTimelineProps> = ({
  selectedActivities,
  tripDates,
  onActivityRemove,
  onActivityReorder,
  onActivityTimeChange,
  onActivityDateChange,
  onAddActivityClick,
  className,
  maxActivitiesPerDay = 6,
  enableTimeSlotDropzones = false
}) => {
  const { toast } = useToast()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [overId, setOverId] = useState<string | null>(null)

  // Configure sensors for different input methods
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // Require 8px movement to start drag
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200, // 200ms delay for touch
        tolerance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Generate day schedules with drop zone information
  const daySchedules = useMemo(() => {
    const schedules: DaySchedule[] = []
    const startDate = new Date(tripDates.startDate)
    const endDate = new Date(tripDates.endDate)
    
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0]
      const dayActivities = selectedActivities.filter(
        activity => activity.selectedDate === dateString
      )
      
      const conflicts = detectConflicts(dayActivities)
      const totalDuration = dayActivities.reduce(
        (sum, activity) => sum + activity.duration.typical, 0
      )
      const totalPrice = dayActivities.reduce(
        (sum, activity) => sum + activity.totalPrice, 0
      )
      
      schedules.push({
        date: dateString,
        activities: dayActivities,
        conflicts,
        totalDuration,
        totalPrice,
        isEmpty: dayActivities.length === 0,
        acceptsDrops: dayActivities.length < maxActivitiesPerDay,
        maxActivities: maxActivitiesPerDay
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return schedules
  }, [selectedActivities, tripDates, maxActivitiesPerDay])

  const activeActivity = activeId ? selectedActivities.find(a => a.id === activeId) : null

  // Custom collision detection
  const collisionDetection = (args: any) => {
    // First, let's see if there are any collisions with the pointer
    const pointerIntersections = pointerWithin(args)
    
    if (pointerIntersections.length > 0) {
      return pointerIntersections
    }
    
    // If there are no pointer intersections, return rectangle intersections
    return rectIntersection(args)
  }

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    setActiveId(active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    setOverId(over?.id as string || null)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    
    setActiveId(null)
    setOverId(null)

    if (!over || !active) return

    const activeActivity = selectedActivities.find(a => a.id === active.id)
    if (!activeActivity) return

    const overId = over.id as string
    const overData = over.data?.current

    // Check if dropping on a day (either empty or with activities)
    const targetDate = overId.startsWith('day-') ? overId.replace('day-', '') : null
    
    if (targetDate) {
      // Validate the drop
      const canDrop = canActivityFitInDay(activeActivity, targetDate, selectedActivities)
      
      if (!canDrop) {
        toast({
          title: "Cannot move activity",
          description: "This activity cannot be placed on the selected day due to constraints.",
          variant: "destructive",
        })
        return
      }

      // Create updated activity with new date and time
      const updatedActivity: SelectedActivity = {
        ...activeActivity,
        selectedDate: targetDate,
        selectedTimeSlot: generateOptimalTimeSlot(targetDate, selectedActivities),
      }

      // Update the activities list
      const updatedActivities = selectedActivities.map(activity =>
        activity.id === activeActivity.id ? updatedActivity : activity
      )

      onActivityReorder(updatedActivities)
      
      // Notify callback if provided
      onActivityDateChange?.(activeActivity.id, targetDate)

      toast({
        title: "Activity moved",
        description: `${activeActivity.name} has been moved to ${new Date(targetDate).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}`,
      })
    } else {
      // Handle reordering within the same day
      const activeIndex = selectedActivities.findIndex(a => a.id === active.id)
      const overIndex = selectedActivities.findIndex(a => a.id === over.id)

      if (activeIndex !== overIndex && activeIndex !== -1 && overIndex !== -1) {
        const reorderedActivities = [...selectedActivities]
        const [movedActivity] = reorderedActivities.splice(activeIndex, 1)
        reorderedActivities.splice(overIndex, 0, movedActivity)

        onActivityReorder(reorderedActivities)

        toast({
          title: "Activity reordered",
          description: "Activity order has been updated.",
        })
      }
    }
  }

  const totalActivities = selectedActivities.length
  const totalPrice = selectedActivities.reduce((sum, activity) => sum + activity.totalPrice, 0)
  const totalConflicts = daySchedules.reduce((sum, day) => sum + day.conflicts.length, 0)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className={cn("space-y-6", className)}>
        {/* Summary Header */}
        <div className="bg-white border rounded-lg p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold">Interactive Activity Timeline</h2>
              <p className="text-gray-600">
                Drag and drop activities to reorder your itinerary
              </p>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="text-center">
                <div className="font-semibold text-lg">{totalActivities}</div>
                <div className="text-gray-600">Activities</div>
              </div>
              <Separator orientation="vertical" className="h-8" />
              <div className="text-center">
                <div className="font-semibold text-lg">
                  {formatPrice(totalPrice, 'EUR')}
                </div>
                <div className="text-gray-600">Total</div>
              </div>
              {totalConflicts > 0 && (
                <>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="text-center">
                    <div className="font-semibold text-lg text-red-600">{totalConflicts}</div>
                    <div className="text-gray-600">Conflicts</div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Instructions */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <GripVertical className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-1">How to reorder activities</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Drag the handle (⋮⋮) to move activities within the same day</li>
                  <li>• Drop activities on other days to reschedule them</li>
                  <li>• Invalid drops will be highlighted in red</li>
                  <li>• Time slots are automatically optimized when moving activities</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Day-by-Day Schedule with Drop Zones */}
        <div className="space-y-8">
          {daySchedules.map((daySchedule) => {
            const isOver = overId === `day-${daySchedule.date}`
            const canDrop = activeActivity ? 
              canActivityFitInDay(activeActivity, daySchedule.date, selectedActivities) : false

            return (
              <div key={daySchedule.date} id={`day-${daySchedule.date}`}>
                <SortableContext 
                  items={daySchedule.activities.map(a => a.id)} 
                  strategy={verticalListSortingStrategy}
                >
                  <DroppableDaySchedule
                    daySchedule={daySchedule}
                    onActivityRemove={onActivityRemove}
                    onAddActivity={onAddActivityClick}
                    isOver={isOver}
                    canDrop={canDrop}
                  />
                </SortableContext>
              </div>
            )
          })}
        </div>

        {/* Empty State for No Activities */}
        {totalActivities === 0 && (
          <div className="text-center py-12">
            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              No activities selected yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start building your itinerary by selecting activities, then use drag-and-drop to organize them
            </p>
            {onAddActivityClick && (
              <Button 
                onClick={() => onAddActivityClick(daySchedules[0]?.date || new Date().toISOString().split('T')[0])}
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Select Activities
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeActivity ? (
          <DraggableActivityCard
            activity={activeActivity}
            onRemove={() => {}}
            hasConflict={false}
            isDragging={true}
            className="transform rotate-3 shadow-2xl"
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  )
} 