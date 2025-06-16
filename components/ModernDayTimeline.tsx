"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Clock,
  MapPin,
  Plus,
  MoreVertical,
  Navigation
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePlanStore, DayPlan, TimeSlot } from '@/store/planStore'
import Image from 'next/image'

interface ModernDayTimelineProps {
  day: DayPlan
  tripName: string
  dates: string
}

export function ModernDayTimeline({ day, tripName, dates }: ModernDayTimelineProps) {
  const { 
    itinerary,
    removePoiFromDay,
    highlightPoi,
    selectPoi,
    selectedPoiId
  } = usePlanStore()
  
  // Mock timeline data
  const timelineItems = [
    {
      id: '1',
      time: '12:00 PM-1:30 PM',
      name: 'Le Bistro du Perigord',
      type: 'restaurant',
      price: 'N50,000',
      duration: '1 hrs 54 mins',
      image: '/api/placeholder/100/75'
    },
    {
      id: '2',
      time: '02:00 PM',
      name: 'Les Catacombs des Paris',
      type: 'attraction',
      price: 'N11,500',
      duration: null,
      image: '/api/placeholder/100/75'
    }
  ]
  
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h1 className="text-xl font-semibold">{tripName}</h1>
            <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
              <Calendar className="h-4 w-4" />
              <span>{dates} (7 days)</span>
              <span className="text-gray-400">•</span>
              <MapPin className="h-4 w-4" />
              <span>Paris, France</span>
            </div>
          </div>
          <button className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
            <MoreVertical className="h-4 w-4" />
          </button>
        </div>
      </div>
      
      {/* Day selector */}
      <div className="px-4 py-3 border-b">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Sat, 10 Sept</h2>
          <span className="text-sm text-gray-500">2</span>
        </div>
      </div>
      
      {/* Timeline */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-3">
          {timelineItems.map((item, index) => (
            <TimelineItem
              key={item.id}
              item={item}
              isFirst={index === 0}
              isLast={index === timelineItems.length - 1}
              onSelect={() => selectPoi(item.id)}
              onHighlight={() => highlightPoi(item.id)}
              onUnhighlight={() => highlightPoi(null)}
            />
          ))}
          
          {/* Add button */}
          <Button
            variant="outline"
            className="w-full h-16 border-dashed border-gray-300 hover:border-gray-400"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add
          </Button>
        </div>
      </ScrollArea>
    </div>
  )
}

// Timeline Item Component
interface TimelineItemProps {
  item: {
    id: string
    time: string
    name: string
    type: string
    price: string
    duration: string | null
    image: string
  }
  isFirst: boolean
  isLast: boolean
  onSelect: () => void
  onHighlight: () => void
  onUnhighlight: () => void
}

function TimelineItem({ 
  item, 
  isFirst, 
  isLast,
  onSelect,
  onHighlight,
  onUnhighlight
}: TimelineItemProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onMouseEnter={onHighlight}
      onMouseLeave={onUnhighlight}
      onClick={onSelect}
      className="relative"
    >
      {/* Connection line */}
      {!isLast && (
        <div className="absolute left-[19px] top-[60px] bottom-[-12px] w-0.5 bg-gray-200">
          {/* Route indicator */}
          {item.duration && (
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white px-2 py-1 rounded-full shadow-sm">
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{item.duration}</span>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Timeline dot */}
      <div className="absolute left-3 top-3 w-3.5 h-3.5 bg-white border-2 border-blue-500 rounded-full z-10" />
      
      {/* Content card */}
      <div className="ml-8 bg-white border rounded-lg p-3 hover:shadow-md transition-shadow cursor-pointer">
        <div className="flex gap-3">
          {/* Image */}
          <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
            <img 
              src={item.image} 
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>
          
          {/* Details */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-medium text-sm text-gray-900 line-clamp-1">
                  {item.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <Clock className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-600">{item.time}</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">{item.price}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Add Calendar import
import { Calendar } from 'lucide-react'