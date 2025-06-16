"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ActivityCard } from './ActivityCard'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search, Filter, LayoutGrid, List } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

interface Activity {
  id: string
  name: string
  time?: string
  duration?: number
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
  image?: string
}

interface ActivityListProps {
  activities: Activity[]
  onReorder?: (activities: Activity[]) => void
  onActivitySelect?: (activityId: string) => void
  onActivityEdit?: (activity: Activity) => void
  onActivityDelete?: (activityId: string) => void
  onActivityDuplicate?: (activity: Activity) => void
  onAddActivity?: () => void
  selectedActivityId?: string | null
  highlightedActivityId?: string | null
  readonly?: boolean
  viewMode?: 'list' | 'grid'
  className?: string
}

function SortableActivityItem({
  activity,
  isSelected,
  isHighlighted,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  readonly,
  viewMode
}: {
  activity: Activity
  isSelected: boolean
  isHighlighted: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
  onDuplicate: () => void
  readonly: boolean
  viewMode: 'list' | 'grid'
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: activity.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        viewMode === 'grid' ? 'w-full' : 'w-full mb-3'
      )}
    >
      <ActivityCard
        activity={activity}
        isSelected={isSelected}
        isHighlighted={isHighlighted}
        onSelect={onSelect}
        onEdit={onEdit}
        onDelete={onDelete}
        onDuplicate={onDuplicate}
        readonly={readonly}
      />
    </div>
  )
}

export function ActivityList({
  activities,
  onReorder,
  onActivitySelect,
  onActivityEdit,
  onActivityDelete,
  onActivityDuplicate,
  onAddActivity,
  selectedActivityId,
  highlightedActivityId,
  readonly = false,
  viewMode = 'list',
  className
}: ActivityListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [sortBy, setSortBy] = useState<string>('time')
  const [localViewMode, setLocalViewMode] = useState(viewMode)
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  // Filter and sort activities
  const filteredActivities = activities.filter(activity => {
    const matchesSearch = activity.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      activity.location.address?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesCategory = filterCategory === 'all' || activity.category === filterCategory
    
    return matchesSearch && matchesCategory
  })

  const sortedActivities = [...filteredActivities].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        const timeA = a.time ? new Date(`2000-01-01 ${a.time}`).getTime() : 0
        const timeB = b.time ? new Date(`2000-01-01 ${b.time}`).getTime() : 0
        return timeA - timeB
      case 'name':
        return a.name.localeCompare(b.name)
      case 'price':
        return (a.price || 0) - (b.price || 0)
      case 'rating':
        return (b.rating || 0) - (a.rating || 0)
      default:
        return 0
    }
  })

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = activities.findIndex(a => a.id === active.id)
      const newIndex = activities.findIndex(a => a.id === over.id)
      
      const newActivities = arrayMove(activities, oldIndex, newIndex)
      onReorder?.(newActivities)
    }
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Header Controls */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Search activities..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          {!readonly && (
            <Button onClick={onAddActivity} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Activity
            </Button>
          )}
        </div>
        
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                <SelectItem value="dining">Dining</SelectItem>
                <SelectItem value="activity">Activities</SelectItem>
                <SelectItem value="transport">Transport</SelectItem>
                <SelectItem value="accommodation">Accommodation</SelectItem>
                <SelectItem value="shopping">Shopping</SelectItem>
                <SelectItem value="tour">Tours</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="time">Time</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="price">Price</SelectItem>
                <SelectItem value="rating">Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs value={localViewMode} onValueChange={(v) => setLocalViewMode(v as 'list' | 'grid')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="list" className="gap-2">
                <List className="h-4 w-4" />
                List
              </TabsTrigger>
              <TabsTrigger value="grid" className="gap-2">
                <LayoutGrid className="h-4 w-4" />
                Grid
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Results Count */}
        <div className="text-sm text-gray-600">
          {sortedActivities.length} {sortedActivities.length === 1 ? 'activity' : 'activities'}
          {searchQuery && ` matching "${searchQuery}"`}
        </div>
      </div>
      
      {/* Activities List/Grid */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={sortedActivities.map(a => a.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className={cn(
            localViewMode === 'grid' 
              ? "grid grid-cols-1 md:grid-cols-2 gap-4" 
              : "space-y-3"
          )}>
            <AnimatePresence mode="popLayout">
              {sortedActivities.map((activity) => (
                <motion.div
                  key={activity.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                >
                  <SortableActivityItem
                    activity={activity}
                    isSelected={selectedActivityId === activity.id}
                    isHighlighted={highlightedActivityId === activity.id}
                    onSelect={() => onActivitySelect?.(activity.id)}
                    onEdit={() => onActivityEdit?.(activity)}
                    onDelete={() => onActivityDelete?.(activity.id)}
                    onDuplicate={() => onActivityDuplicate?.(activity)}
                    readonly={readonly || !!searchQuery || filterCategory !== 'all' || sortBy !== 'time'}
                    viewMode={localViewMode}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </SortableContext>
      </DndContext>
      
      {/* Empty State */}
      {sortedActivities.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-12"
        >
          <div className="text-gray-400 mb-4">
            {searchQuery || filterCategory !== 'all' 
              ? 'No activities match your filters' 
              : 'No activities scheduled yet'}
          </div>
          {!readonly && !searchQuery && filterCategory === 'all' && (
            <Button onClick={onAddActivity} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add your first activity
            </Button>
          )}
        </motion.div>
      )}
    </div>
  )
}