"use client"

import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react'
import { motion, AnimatePresence, Reorder, useDragControls } from 'framer-motion'
import {
  Clock,
  MapPin,
  GripVertical,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Coffee,
  Utensils,
  Camera,
  Hotel,
  Car,
  ShoppingBag,
  Ticket,
  AlertCircle,
  Star,
  Calendar
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { format } from 'date-fns'
import Image from 'next/image'
import styles from './TimelineWithImagesV2.module.css'

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
  dining: { icon: 'text-orange-600', bg: 'bg-orange-50' },
  activity: { icon: 'text-blue-600', bg: 'bg-blue-50' },
  transport: { icon: 'text-purple-600', bg: 'bg-purple-50' },
  accommodation: { icon: 'text-green-600', bg: 'bg-green-50' },
  shopping: { icon: 'text-pink-600', bg: 'bg-pink-50' },
  tour: { icon: 'text-indigo-600', bg: 'bg-indigo-50' }
}

// Format time with brand guidelines
function formatTime(time: string): string {
  const [hours, minutes] = time.split(':')
  return minutes === '00' ? `${hours}h` : time
}

// Format duration
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return mins === 0 ? `${hours}h` : `${hours}h ${mins}m`
}

// Convert price number to price tier symbols
function formatPriceTier(price?: number): string {
  if (!price) return ''
  if (price <= 20) return '$'
  if (price <= 50) return '$$'
  if (price <= 100) return '$$$'
  return '$$$$'
}

// Format rating with color coding
function formatRating(rating?: number): { 
  display: string
  color: string
  showTopPick: boolean 
} {
  if (!rating) return { display: '', color: 'text-gray-400', showTopPick: false }
  
  const rounded = Number(rating).toFixed(1)
  let color = 'text-gray-600'
  
  if (rating >= 4.5) {
    color = 'text-green-600'
  } else if (rating >= 4.0) {
    color = 'text-amber-600'
  }
  
  return {
    display: rounded,
    color,
    showTopPick: rating >= 4.5
  }
}

// Hook to fetch activity images with lazy loading
function useActivityImages(activities: TimelineActivity[]) {
  const [images, setImages] = useState<Map<string, string>>(new Map())
  const [loadingStates, setLoadingStates] = useState<Map<string, boolean>>(new Map())
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const activityId = entry.target.getAttribute('data-activity-id')
            if (activityId && !images.has(activityId)) {
              loadImage(activityId)
            }
          }
        })
      },
      { rootMargin: '50px' }
    )

    // Observe all image containers
    document.querySelectorAll('[data-activity-id]').forEach(el => {
      observer.observe(el)
    })

    return () => observer.disconnect()
  }, [activities])

  const loadImage = async (activityId: string) => {
    const activity = activities.find(a => a.id === activityId)
    if (!activity) return

    setLoadingStates(prev => new Map(prev).set(activityId, true))

    if (activity.imageUrl) {
      setImages(prev => new Map(prev).set(activityId, activity.imageUrl!))
      setLoadingStates(prev => new Map(prev).set(activityId, false))
      return
    }

    try {
      const response = await fetch(
        `/api/images/location?location=${encodeURIComponent(activity.name)}&width=128&height=128`
      )
      const data = await response.json()
      
      if (data.url) {
        setImages(prev => new Map(prev).set(activityId, data.url))
      }
    } catch (error) {
      console.error(`Error fetching image for ${activity.name}:`, error)
    } finally {
      setLoadingStates(prev => new Map(prev).set(activityId, false))
    }
  }
  
  return { images, loadingStates }
}

// Timeline Item Component
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
  const colors = categoryColors[activity.category || 'activity']
  const rating = formatRating(activity.rating)
  const priceTier = formatPriceTier(activity.price)
  
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
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        role="button"
        tabIndex={0}
        aria-label={`Activity: ${activity.name} at ${activity.time}`}
        className={cn(
          "group relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all cursor-pointer",
          "focus:outline-none focus:ring-2 focus:ring-offset-2",
          isSelected && "ring-2 ring-blue-500 shadow-lg",
          isHighlighted && !isSelected && "ring-2 ring-orange-400 shadow-md",
          "focus:ring-blue-500"
        )}
        onMouseEnter={() => onHover?.(true)}
        onMouseLeave={() => onHover?.(false)}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            onClick?.()
          }
        }}
      >
        {/* Grid Layout: Mobile stacked, Desktop [64px thumbnail] [auto content] [48px right rail] */}
        <div className={cn(
          "grid gap-3 p-3",
          "grid-cols-1 md:grid-cols-[64px_1fr_48px]",
          styles['timeline-item']
        )}>
          {/* Drag Handle - only on desktop */}
          {!readonly && (
            <div
              className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity cursor-move hidden md:block"
              onPointerDown={(e) => dragControls.start(e)}
            >
              <GripVertical className="h-5 w-5 text-gray-400" />
            </div>
          )}
          
          {/* Thumbnail */}
          <div 
            className={cn(
              "relative rounded-lg overflow-hidden bg-gray-100",
              "w-full h-40 md:w-16 md:h-16",
              styles['timeline-thumbnail']
            )}
            data-activity-id={activity.id}
          >
            {imageLoading ? (
              <div className="w-full h-full animate-pulse bg-gray-200" />
            ) : imageUrl ? (
              <Image
                src={imageUrl}
                alt={activity.name}
                fill
                className="object-cover"
                sizes="64px"
                loading="lazy"
              />
            ) : (
              <div className={cn("w-full h-full flex items-center justify-center", colors.bg)}>
                <Icon className={cn("h-6 w-6", colors.icon)} />
              </div>
            )}
          </div>
          
          {/* Content */}
          <div className="flex flex-col justify-between min-w-0">
            {/* Title and Time Pill */}
            <div className="flex items-start gap-2">
              <h4 className="font-medium text-sm line-clamp-1 flex-1">{activity.name}</h4>
              {activity.time && (
                <Badge 
                  variant="secondary" 
                  className="font-mono text-xs bg-blue-100 text-blue-700 border-0 px-2"
                >
                  {formatTime(activity.time)}
                </Badge>
              )}
            </div>
            
            {/* Meta Row */}
            <div className={cn(
              "flex items-center gap-2 text-xs text-gray-600 mt-1",
              "flex-wrap md:flex-nowrap",
              styles['timeline-meta']
            )}>
              {/* Category */}
              <span className="flex items-center gap-1">
                <Icon className={cn("h-3 w-3", colors.icon)} />
                <span className="capitalize">{activity.category || 'Activity'}</span>
              </span>
              
              {/* Separator */}
              {(priceTier || rating.display) && <span className="text-gray-400">•</span>}
              
              {/* Price Tier */}
              {priceTier && (
                <span className="font-medium">{priceTier}</span>
              )}
              
              {/* Separator */}
              {priceTier && rating.display && <span className="text-gray-400">•</span>}
              
              {/* Rating */}
              {rating.display && (
                <span className={cn("flex items-center gap-1", rating.color)}>
                  <Star className="h-3 w-3 fill-current" />
                  <span className="font-medium">{rating.display}</span>
                  {rating.showTopPick && (
                    <Badge className="ml-1 h-4 px-1 text-[10px] bg-green-100 text-green-700 border-0">
                      Top pick
                    </Badge>
                  )}
                </span>
              )}
            </div>
          </div>
          
          {/* Right Rail - Duration */}
          <div className="flex flex-col items-end justify-between">
            {activity.duration && (
              <span className="text-xs text-gray-500 font-medium">
                {formatDuration(activity.duration)}
              </span>
            )}
            
            {/* Actions - desktop only */}
            {!readonly && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity md:flex hidden">
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
        </div>
      </motion.div>
    </Reorder.Item>
  )
})

// Grouped Timeline Items for duplicate times
const GroupedTimelineItems = React.memo(function GroupedTimelineItems({
  time,
  activities,
  isExpanded,
  onToggle,
  ...props
}: {
  time: string
  activities: TimelineActivity[]
  isExpanded: boolean
  onToggle: () => void
} & Omit<React.ComponentProps<typeof TimelineItem>, 'activity'>) {
  return (
    <div className="space-y-2">
      {/* Group Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Badge className="font-mono text-xs bg-blue-100 text-blue-700 border-0">
            {formatTime(time)}
          </Badge>
          <span className="text-sm text-gray-600">
            {activities.length} activities
          </span>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      
      {/* Grouped Items */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="space-y-2 pl-4"
          >
            {activities.map((activity) => (
              <TimelineItem
                key={activity.id}
                activity={activity}
                {...props}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

// Main Timeline Component
export function TimelineWithImagesV2({
  activities,
  onReorder,
  onEdit,
  onDelete,
  onAdd,
  onActivityHover,
  onActivityClick,
  selectedActivityId,
  highlightedActivityId,
  readonly = false,
  dayInfo
}: TimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const { images, loadingStates } = useActivityImages(activities)
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  
  // Group activities by time
  const groupedActivities = useMemo(() => {
    const groups = new Map<string, TimelineActivity[]>()
    const ungrouped: TimelineActivity[] = []
    
    activities.forEach(activity => {
      if (activity.time) {
        const existing = groups.get(activity.time) || []
        existing.push(activity)
        groups.set(activity.time, existing)
      } else {
        ungrouped.push(activity)
      }
    })
    
    return { groups, ungrouped }
  }, [activities])
  
  const handleReorder = useCallback((newOrder: TimelineActivity[]) => {
    onReorder?.(newOrder)
  }, [onReorder])
  
  const toggleGroup = (time: string) => {
    setExpandedGroups(prev => {
      const next = new Set(prev)
      if (next.has(time)) {
        next.delete(time)
      } else {
        next.add(time)
      }
      return next
    })
  }
  
  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="p-4 space-y-3">
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
      </div>
      
      {/* Timeline */}
      <div 
        ref={containerRef} 
        className="flex-1 overflow-y-auto"
        style={{ zIndex: 10 }} // Ensure map doesn't bleed through
      >
        <div className="p-4 max-w-2xl mx-auto">
          {activities.length === 0 ? (
            <Card className="p-8">
              <div className="flex flex-col items-center justify-center text-center">
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
            </Card>
          ) : (
            <Reorder.Group
              axis="y"
              values={activities}
              onReorder={handleReorder}
              className="space-y-3"
            >
              <AnimatePresence mode="popLayout">
                {/* Render grouped activities */}
                {Array.from(groupedActivities.groups.entries()).map(([time, timeActivities]) => {
                  const dragControls = useDragControls()
                  
                  if (timeActivities.length === 1) {
                    // Single activity at this time
                    const activity = timeActivities[0]
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
                        imageLoading={loadingStates.get(activity.id)}
                      />
                    )
                  } else {
                    // Multiple activities at this time
                    return (
                      <GroupedTimelineItems
                        key={time}
                        time={time}
                        activities={timeActivities}
                        isExpanded={expandedGroups.has(time)}
                        onToggle={() => toggleGroup(time)}
                        isSelected={false}
                        isHighlighted={false}
                        onEdit={(activity) => onEdit?.(activity)}
                        onDelete={(id) => onDelete?.(id)}
                        onHover={(hover) => onActivityHover?.(hover)}
                        onClick={(id) => onActivityClick?.(id)}
                        readonly={readonly}
                        dragControls={dragControls}
                        imageUrl=""
                        imageLoading={false}
                      />
                    )
                  }
                })}
                
                {/* Render ungrouped activities */}
                {groupedActivities.ungrouped.map((activity) => {
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
                      imageLoading={loadingStates.get(activity.id)}
                    />
                  )
                })}
              </AnimatePresence>
            </Reorder.Group>
          )}
        </div>
      </div>
    </div>
  )
}