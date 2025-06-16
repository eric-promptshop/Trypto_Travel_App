"use client"

import React, { useState, useRef, useCallback, useEffect } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import {
  Clock,
  MapPin,
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  ChevronRight,
  Coffee,
  Utensils,
  Camera,
  Hotel,
  Car,
  ShoppingBag,
  Ticket,
  Info,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format, parse, differenceInMinutes, addMinutes } from 'date-fns'

// Types
export interface TimelineActivity {
  id: string
  name: string
  time?: string
  duration?: number // in minutes
  location: {
    lat: number
    lng: number
    address?: string
  }
  description?: string
  category?: 'dining' | 'activity' | 'transport' | 'accommodation' | 'shopping' | 'tour'
  provider?: string
  isRecommendedTour?: boolean
  price?: number
  bookingUrl?: string
  rating?: number
  color?: string
}

interface TimelineProps {
  activities: TimelineActivity[]
  onReorder?: (activities: TimelineActivity[]) => void
  onEdit?: (activity: TimelineActivity) => void
  onDelete?: (activityId: string) => void
  onAdd?: (afterId?: string) => void
  onActivityHover?: (activityId: string | null) => void
  onActivityClick?: (activityId: string) => void
  selectedActivityId?: string | null
  highlightedActivityId?: string | null
  startHour?: number
  endHour?: number
  readonly?: boolean
}

// Icon mapping for categories
const categoryIcons = {
  dining: Utensils,
  activity: Camera,
  transport: Car,
  accommodation: Hotel,
  shopping: ShoppingBag,
  tour: Ticket
}

// Color mapping for categories
const categoryColors = {
  dining: 'bg-orange-100 border-orange-300 text-orange-900',
  activity: 'bg-blue-100 border-blue-300 text-blue-900',
  transport: 'bg-purple-100 border-purple-300 text-purple-900',
  accommodation: 'bg-green-100 border-green-300 text-green-900',
  shopping: 'bg-pink-100 border-pink-300 text-pink-900',
  tour: 'bg-indigo-100 border-indigo-300 text-indigo-900'
}

// Time scale calculation
const calculateTimePosition = (time: string, startHour: number, totalHours: number): number => {
  const [hours, minutes] = time.split(':').map(Number)
  const totalMinutes = (hours - startHour) * 60 + minutes
  return (totalMinutes / (totalHours * 60)) * 100
}

const calculateDuration = (startTime: string, endTime: string): number => {
  const start = parse(startTime, 'HH:mm', new Date())
  const end = parse(endTime, 'HH:mm', new Date())
  return differenceInMinutes(end, start)
}

const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':').map(Number)
  const date = new Date()
  date.setHours(hours, minutes)
  return format(date, 'h:mm a')
}

// Timeline Item Component
const TimelineItem = React.memo(({
  activity,
  index,
  onEdit,
  onDelete,
  onHover,
  onClick,
  isSelected,
  isHighlighted,
  dragControls,
  startHour,
  totalHours,
  readonly
}: {
  activity: TimelineActivity
  index: number
  onEdit?: (activity: TimelineActivity) => void
  onDelete?: (activityId: string) => void
  onHover?: (activityId: string | null) => void
  onClick?: (activityId: string) => void
  isSelected: boolean
  isHighlighted: boolean
  dragControls: any
  startHour: number
  totalHours: number
  readonly?: boolean
}) => {
  const Icon = activity.category ? categoryIcons[activity.category] : Camera
  const colorClass = activity.category ? categoryColors[activity.category] : 'bg-gray-100 border-gray-300'
  
  const timePosition = activity.time ? calculateTimePosition(activity.time, startHour, totalHours) : 0
  const duration = activity.duration || 60 // Default 1 hour
  const height = (duration / (totalHours * 60)) * 100
  
  return (
    <Reorder.Item
      value={activity}
      id={activity.id}
      dragListener={false}
      dragControls={dragControls}
      className="absolute left-0 right-0"
      style={{ 
        top: `${timePosition}%`,
        height: `${height}%`,
        minHeight: '60px'
      }}
      whileHover={{ scale: readonly ? 1 : 1.02 }}
      whileDrag={{ scale: 1.05, zIndex: 50 }}
    >
      <motion.div
        className={cn(
          "h-full mx-2 rounded-lg border-2 transition-all cursor-pointer overflow-hidden group",
          colorClass,
          isSelected && "ring-2 ring-blue-500 ring-offset-2",
          isHighlighted && !isSelected && "ring-2 ring-orange-400 ring-offset-1"
        )}
        onMouseEnter={() => onHover?.(activity.id)}
        onMouseLeave={() => onHover?.(null)}
        onClick={() => onClick?.(activity.id)}
        layout
      >
        <div className="h-full p-3 flex">
          {/* Drag Handle */}
          {!readonly && (
            <div
              className="flex items-center pr-2 cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          )}
          
          {/* Icon */}
          <div className="flex-shrink-0 mr-3">
            <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-2">
                <h4 className="font-medium text-sm truncate">{activity.name}</h4>
                {activity.time && (
                  <p className="text-xs opacity-75 mt-0.5">
                    {formatTime(activity.time)}
                    {activity.duration && ` • ${activity.duration} min`}
                  </p>
                )}
                {activity.location.address && (
                  <p className="text-xs opacity-60 truncate mt-0.5">
                    {activity.location.address}
                  </p>
                )}
              </div>
              
              {/* Actions */}
              {!readonly && (
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit?.(activity)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Edit activity</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                  
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6 text-red-600 hover:text-red-700"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete?.(activity.id)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Remove activity</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>
            
            {/* Additional info */}
            {(activity.isRecommendedTour || activity.price) && (
              <div className="flex items-center gap-2 mt-1">
                {activity.isRecommendedTour && (
                  <Badge variant="secondary" className="text-xs h-5 px-1.5">
                    Recommended
                  </Badge>
                )}
                {activity.price && (
                  <span className="text-xs font-medium">${activity.price}</span>
                )}
                {activity.rating && (
                  <div className="flex items-center gap-0.5">
                    <span className="text-yellow-500 text-xs">★</span>
                    <span className="text-xs">{activity.rating}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </Reorder.Item>
  )
})

TimelineItem.displayName = 'TimelineItem'

// Main Timeline Component
export function ModernTimeline({
  activities,
  onReorder,
  onEdit,
  onDelete,
  onAdd,
  onActivityHover,
  onActivityClick,
  selectedActivityId,
  highlightedActivityId,
  startHour = 6,
  endHour = 23,
  readonly = false
}: TimelineProps) {
  const [items, setItems] = useState(activities)
  const containerRef = useRef<HTMLDivElement>(null)
  const totalHours = endHour - startHour
  
  // Update items when activities prop changes
  useEffect(() => {
    setItems(activities)
  }, [activities])
  
  // Generate hour markers
  const hourMarkers = Array.from({ length: totalHours + 1 }, (_, i) => startHour + i)
  
  const handleReorder = (newItems: TimelineActivity[]) => {
    setItems(newItems)
    onReorder?.(newItems)
  }
  
  // Calculate time gaps between activities
  const timeGaps = activities.reduce((gaps, activity, index) => {
    if (index === 0 || !activity.time) return gaps
    
    const prevActivity = activities[index - 1]
    if (!prevActivity.time) return gaps
    
    const prevEnd = prevActivity.duration 
      ? addMinutes(parse(prevActivity.time, 'HH:mm', new Date()), prevActivity.duration)
      : addMinutes(parse(prevActivity.time, 'HH:mm', new Date()), 60)
    
    const currentStart = parse(activity.time, 'HH:mm', new Date())
    const gapMinutes = differenceInMinutes(currentStart, prevEnd)
    
    if (gapMinutes > 30) {
      gaps.push({
        afterId: prevActivity.id,
        duration: gapMinutes,
        startTime: format(prevEnd, 'HH:mm')
      })
    }
    
    return gaps
  }, [] as Array<{ afterId: string; duration: number; startTime: string }>)
  
  return (
    <Card className="h-full overflow-hidden">
      <div className="p-4 border-b bg-gray-50/50">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-lg">Day Timeline</h3>
          {!readonly && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAdd?.()}
              className="gap-2"
            >
              <Plus className="h-3 w-3" />
              Add Activity
            </Button>
          )}
        </div>
      </div>
      
      <div ref={containerRef} className="relative h-full overflow-y-auto">
        <div className="flex h-full">
          {/* Time labels */}
          <div className="w-20 flex-shrink-0 relative">
            {hourMarkers.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 text-right pr-3"
                style={{ top: `${((hour - startHour) / totalHours) * 100}%` }}
              >
                <span className="text-xs text-gray-500">
                  {format(new Date().setHours(hour, 0), 'h a')}
                </span>
              </div>
            ))}
          </div>
          
          {/* Timeline track */}
          <div className="flex-1 relative" style={{ minHeight: `${totalHours * 80}px` }}>
            {/* Hour lines */}
            {hourMarkers.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-t border-gray-200"
                style={{ top: `${((hour - startHour) / totalHours) * 100}%` }}
              />
            ))}
            
            {/* Time gaps with add buttons */}
            {timeGaps.map((gap) => (
              <motion.div
                key={gap.afterId}
                className="absolute left-0 right-0 flex items-center justify-center"
                style={{
                  top: `${calculateTimePosition(gap.startTime, startHour, totalHours)}%`,
                  height: `${(gap.duration / (totalHours * 60)) * 100}%`
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {!readonly && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onAdd?.(gap.afterId)}
                    className="gap-1 text-xs h-7 opacity-0 hover:opacity-100 transition-opacity"
                  >
                    <Plus className="h-3 w-3" />
                    Add activity ({gap.duration} min gap)
                  </Button>
                )}
              </motion.div>
            ))}
            
            {/* Activities */}
            <Reorder.Group
              axis="y"
              values={items}
              onReorder={handleReorder}
              className="h-full"
            >
              <AnimatePresence>
                {items.map((activity, index) => {
                  const dragControls = useDragControls()
                  
                  return (
                    <TimelineItem
                      key={activity.id}
                      activity={activity}
                      index={index}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      onHover={onActivityHover}
                      onClick={onActivityClick}
                      isSelected={selectedActivityId === activity.id}
                      isHighlighted={highlightedActivityId === activity.id}
                      dragControls={dragControls}
                      startHour={startHour}
                      totalHours={totalHours}
                      readonly={readonly}
                    />
                  )
                })}
              </AnimatePresence>
            </Reorder.Group>
          </div>
        </div>
        
        {/* Empty state */}
        {activities.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 mb-3">No activities scheduled</p>
              {!readonly && (
                <Button
                  size="sm"
                  onClick={() => onAdd?.()}
                >
                  Add First Activity
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Card>
  )
}