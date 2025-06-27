"use client"

import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import {
  Clock,
  MapPin,
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  Coffee,
  Utensils,
  Camera,
  Hotel,
  Car,
  ShoppingBag,
  Ticket,
  Sparkles,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface SkeletonActivity {
  id: string
  time: string
  title: string
  description: string
  duration: string
  category: 'dining' | 'activity' | 'transport' | 'accommodation' | 'tour'
  isPlaceholder: boolean
}

interface SkeletonDay {
  day: number
  date: string
  title: string
  activities: SkeletonActivity[]
}

interface SkeletonItineraryTimelineProps {
  days: SkeletonDay[]
  onReorderActivities?: (dayIndex: number, newActivities: SkeletonActivity[]) => void
  onEditActivity?: (activity: SkeletonActivity) => void
  onDeleteActivity?: (activityId: string) => void
  onAddActivity?: (dayIndex: number) => void
  className?: string
}

const categoryIcons = {
  dining: Utensils,
  activity: Camera,
  transport: Car,
  accommodation: Hotel,
  tour: Ticket
}

const categoryColors = {
  dining: 'bg-orange-100 border-orange-300 text-orange-700',
  activity: 'bg-blue-100 border-blue-300 text-blue-700',
  transport: 'bg-gray-100 border-gray-300 text-gray-700',
  accommodation: 'bg-purple-100 border-purple-300 text-purple-700',
  tour: 'bg-green-100 border-green-300 text-green-700'
}

// Draggable Activity Item
const DraggableActivityItem = React.memo(({
  activity,
  onEdit,
  onDelete,
  readonly = false
}: {
  activity: SkeletonActivity
  onEdit?: () => void
  onDelete?: () => void
  readonly?: boolean
}) => {
  const controls = useDragControls()
  const Icon = categoryIcons[activity.category] || Camera
  const colorClass = categoryColors[activity.category] || 'bg-gray-100 border-gray-300 text-gray-700'

  return (
    <Reorder.Item
      value={activity}
      id={activity.id}
      dragListener={false}
      dragControls={controls}
      className="mb-3"
    >
      <motion.div
        className={cn(
          "relative rounded-lg border p-3 cursor-pointer transition-all hover:shadow-md group",
          colorClass,
          activity.isPlaceholder && "border-dashed"
        )}
        whileHover={{ scale: readonly ? 1 : 1.02 }}
        whileDrag={{ scale: 1.05, zIndex: 50 }}
        layout
      >
        <div className="flex items-start gap-3">
          {/* Drag Handle */}
          {!readonly && (
            <div
              className="flex items-center pr-2 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
              onPointerDown={(e) => controls.start(e)}
            >
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          )}
          
          {/* Icon */}
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/50 flex items-center justify-center">
              <Icon className="h-4 w-4" />
            </div>
          </div>
          
          {/* Time */}
          <div className="w-16 text-center flex-shrink-0">
            <div className="text-sm font-medium">
              {activity.time}
            </div>
            <div className="text-xs opacity-75">
              {activity.duration}
            </div>
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-sm">
              {activity.title}
            </h4>
            <p className="text-xs opacity-75 mt-1 line-clamp-2">
              {activity.description}
            </p>
            
            <div className="flex items-center gap-2 mt-2">
              <Badge 
                variant="secondary" 
                className="text-xs capitalize"
              >
                {activity.category}
              </Badge>
              {activity.isPlaceholder && (
                <Badge variant="outline" className="text-xs">
                  <Sparkles className="h-3 w-3 mr-1" />
                  AI Suggestion
                </Badge>
              )}
            </div>
          </div>
          
          {/* Actions */}
          {!readonly && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={onEdit}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit Activity</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700"
                      onClick={onDelete}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Remove Activity</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </motion.div>
    </Reorder.Item>
  )
})

DraggableActivityItem.displayName = 'DraggableActivityItem'

// Day Timeline Component
const DayTimeline = ({
  day,
  dayIndex,
  onReorderActivities,
  onEditActivity,
  onDeleteActivity,
  onAddActivity
}: {
  day: SkeletonDay
  dayIndex: number
  onReorderActivities?: (dayIndex: number, newActivities: SkeletonActivity[]) => void
  onEditActivity?: (activity: SkeletonActivity) => void
  onDeleteActivity?: (activityId: string) => void
  onAddActivity?: (dayIndex: number) => void
}) => {
  const [items, setItems] = useState(day.activities)
  
  const handleReorder = useCallback((newItems: SkeletonActivity[]) => {
    setItems(newItems)
    onReorderActivities?.(dayIndex, newItems)
  }, [dayIndex, onReorderActivities])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: dayIndex * 0.1 }}
      className="border rounded-lg p-4 bg-gray-50"
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">Day {day.day}</h3>
          <p className="text-sm text-gray-600">{day.title}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {new Date(day.date).toLocaleDateString()}
          </Badge>
          {onAddActivity && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddActivity(dayIndex)}
              className="gap-1 text-xs"
            >
              <Plus className="h-3 w-3" />
              Add
            </Button>
          )}
        </div>
      </div>
      
      {items.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
          <AlertCircle className="h-8 w-8 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 mb-3">No activities planned for this day</p>
          {onAddActivity && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAddActivity(dayIndex)}
            >
              Add First Activity
            </Button>
          )}
        </div>
      ) : (
        <Reorder.Group
          axis="y"
          values={items}
          onReorder={handleReorder}
          className="space-y-0"
        >
          <AnimatePresence mode="popLayout">
            {items.map((activity) => (
              <DraggableActivityItem
                key={activity.id}
                activity={activity}
                onEdit={() => onEditActivity?.(activity)}
                onDelete={() => onDeleteActivity?.(activity.id)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      )}
    </motion.div>
  )
}

export function SkeletonItineraryTimeline({
  days,
  onReorderActivities,
  onEditActivity,
  onDeleteActivity,
  onAddActivity,
  className
}: SkeletonItineraryTimelineProps) {
  return (
    <Card className={cn("h-full flex flex-col", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Your Itinerary Canvas</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="gap-1">
              <Sparkles className="w-3 h-3" />
              AI Generated
            </Badge>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-6">
        {days.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <AlertCircle className="h-12 w-12 text-gray-300 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No itinerary created yet
            </h3>
            <p className="text-gray-600 mb-6">
              Start by adding activities or let our AI generate suggestions
            </p>
          </div>
        ) : (
          <AnimatePresence>
            {days.map((day, index) => (
              <DayTimeline
                key={day.day}
                day={day}
                dayIndex={index}
                onReorderActivities={onReorderActivities}
                onEditActivity={onEditActivity}
                onDeleteActivity={onDeleteActivity}
                onAddActivity={onAddActivity}
              />
            ))}
          </AnimatePresence>
        )}
      </CardContent>
    </Card>
  )
} 