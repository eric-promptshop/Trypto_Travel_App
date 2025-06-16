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
  AlertCircle,
  Navigation,
  DollarSign,
  Star,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format, parse, differenceInMinutes, addMinutes } from 'date-fns'
import Image from 'next/image'

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
  imageUrl?: string
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
  dayInfo?: {
    destination: string
    date: Date
    dayNumber: number
  }
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

// Hook to fetch activity images
function useActivityImages(activities: TimelineActivity[]) {
  const [images, setImages] = useState<Map<string, string>>(new Map())
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchImages = async () => {
      const imageMap = new Map<string, string>()
      
      const promises = activities.map(async (activity, index) => {
        // Skip if already has imageUrl
        if (activity.imageUrl) {
          imageMap.set(activity.id, activity.imageUrl)
          return
        }
        
        try {
          const response = await fetch(
            `/api/images/location?location=${encodeURIComponent(activity.name)}&width=120&height=80`
          )
          const data = await response.json()
          
          if (data.url) {
            imageMap.set(activity.id, data.url)
          }
        } catch (error) {
          console.error(`Error fetching image for ${activity.name}:`, error)
          // Fallback image
          imageMap.set(
            activity.id,
            `https://source.unsplash.com/120x80/?${encodeURIComponent(activity.name)},${activity.category || 'travel'}`
          )
        }
        
        // Small delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, index * 100))
      })
      
      await Promise.all(promises)
      setImages(imageMap)
      setLoading(false)
    }
    
    if (activities.length > 0) {
      fetchImages()
    }
  }, [activities])
  
  return { images, loading }
}

// Timeline Item Component with Images
const TimelineItem = React.memo(function TimelineItem({
  activity,
  isSelected,
  isHighlighted,
  onEdit,
  onDelete,
  onHover,
  onClick,
  readonly,
  dragControls,
  imageUrl,
  imageLoading
}: {
  activity: TimelineActivity
  isSelected: boolean
  isHighlighted: boolean
  onEdit?: () => void
  onDelete?: () => void
  onHover?: (hover: boolean) => void
  onClick?: () => void
  readonly?: boolean
  dragControls: any
  imageUrl?: string
  imageLoading?: boolean
}) {
  const Icon = categoryIcons[activity.category || 'activity']
  const categoryColor = categoryColors[activity.category || 'activity']
  
  return (
    <Reorder.Item
      value={activity}
      id={activity.id}
      dragListener={false}
      dragControls={dragControls}
      className="relative"
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        whileHover={{ scale: 1.02 }}
        className={cn(
          "group relative rounded-lg border-2 p-3 transition-all cursor-pointer",
          isSelected && "border-blue-500 shadow-lg",
          isHighlighted && !isSelected && "border-orange-400 shadow-md",
          !isSelected && !isHighlighted && "border-gray-200 hover:border-gray-300 hover:shadow-sm"
        )}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
        onClick={onClick}
      >
        <div className="flex gap-3">
          {/* Drag Handle */}
          {!readonly && (
            <div
              className="opacity-0 group-hover:opacity-100 transition-opacity cursor-move"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
          )}
          
          {/* Image */}
          <div className="relative w-20 h-14 rounded-md overflow-hidden bg-gray-100 flex-shrink-0">
            {imageLoading ? (
              <div className="w-full h-full animate-pulse bg-gray-200" />
            ) : imageUrl ? (
              <Image
                src={imageUrl}
                alt={activity.name}
                fill
                className="object-cover"
                sizes="80px"
              />
            ) : (
              <div className={cn("w-full h-full flex items-center justify-center", categoryColor)}>
                <Icon className="h-6 w-6" />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-1">{activity.name}</h4>
                {activity.location?.address && (
                  <p className="text-xs text-gray-500 line-clamp-1 mt-0.5">
                    <MapPin className="inline h-3 w-3 mr-1" />
                    {activity.location.address}
                  </p>
                )}
              </div>
              
              {/* Time and Duration */}
              <div className="flex items-center gap-2 text-xs text-gray-500">
                {activity.time && (
                  <Badge variant="secondary" className="font-mono">
                    {activity.time}
                  </Badge>
                )}
                {activity.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.duration < 60 
                      ? `${activity.duration}m` 
                      : `${Math.floor(activity.duration / 60)}h ${activity.duration % 60}m`
                    }
                  </span>
                )}
              </div>
            </div>
            
            {/* Additional info */}
            <div className="flex items-center gap-3 mt-1">
              <div className="flex items-center gap-1">
                <Icon className="h-3 w-3" />
                <span className="text-xs capitalize">{activity.category || 'activity'}</span>
              </div>
              
              {activity.price && (
                <span className="text-xs flex items-center gap-1">
                  <DollarSign className="h-3 w-3" />
                  {activity.price}
                </span>
              )}
              
              {activity.rating && (
                <span className="text-xs flex items-center gap-1">
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  {activity.rating}
                </span>
              )}
              
              {activity.isRecommendedTour && (
                <Badge variant="secondary" className="text-xs">
                  Recommended
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
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit?.()
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit activity</TooltipContent>
                </Tooltip>
                
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6 text-red-600 hover:text-red-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        onDelete?.()
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
      </motion.div>
    </Reorder.Item>
  )
})

// Main Timeline Component
export function TimelineWithImages({
  activities,
  onReorder,
  onEdit,
  onDelete,
  onAdd,
  onActivityHover,
  onActivityClick,
  selectedActivityId,
  highlightedActivityId,
  startHour = 8,
  endHour = 22,
  readonly = false,
  dayInfo
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { images, loading: imagesLoading } = useActivityImages(activities)
  
  const handleReorder = useCallback((newOrder: TimelineActivity[]) => {
    onReorder?.(newOrder)
  }, [onReorder])
  
  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="space-y-3 p-4 border-b">
        {/* Trip Info */}
        {dayInfo && (
          <div>
            <h2 className="text-xl font-semibold">{dayInfo.destination}</h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Calendar className="h-4 w-4" />
              <span>{format(dayInfo.date, 'EEEE, MMMM d')}</span>
              <span className="text-gray-400">•</span>
              <span>Day {dayInfo.dayNumber}</span>
            </div>
          </div>
        )}
        
        {/* Timeline Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Day Timeline</h3>
            <p className="text-sm text-gray-500">
              {activities.length} {activities.length === 1 ? 'activity' : 'activities'} planned
            </p>
          </div>
          {!readonly && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onAdd?.()}
              className="gap-1"
            >
              <Plus className="h-4 w-4" />
              Add Activity
            </Button>
          )}
        </div>
      </div>
      
      {/* Timeline */}
      <div ref={containerRef} className="flex-1 overflow-y-auto p-4">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <AlertCircle className="h-8 w-8 text-gray-400" />
            </div>
            <p className="text-gray-600 font-medium mb-2">No activities scheduled</p>
            <p className="text-sm text-gray-500 mb-4">Start planning your perfect day</p>
            {!readonly && (
              <Button onClick={() => onAdd?.()} className="gap-2">
                <Plus className="h-4 w-4" />
                Add First Activity
              </Button>
            )}
          </div>
        ) : (
          <Reorder.Group
            axis="y"
            values={activities}
            onReorder={handleReorder}
            className="space-y-3"
          >
            <AnimatePresence mode="popLayout">
              {activities.map((activity) => {
                const dragControls = useDragControls()
                return (
                  <TimelineItem
                    key={activity.id}
                    activity={activity}
                    isSelected={selectedActivityId === activity.id}
                    isHighlighted={highlightedActivityId === activity.id}
                    onEdit={() => onEdit?.(activity)}
                    onDelete={() => onDelete?.(activity.id)}
                    onHover={(hover) => onActivityHover?.(hover ? activity.id : null)}
                    onClick={() => onActivityClick?.(activity.id)}
                    readonly={readonly}
                    dragControls={dragControls}
                    imageUrl={images.get(activity.id)}
                    imageLoading={imagesLoading}
                  />
                )
              })}
            </AnimatePresence>
          </Reorder.Group>
        )}
      </div>
    </div>
  )
}