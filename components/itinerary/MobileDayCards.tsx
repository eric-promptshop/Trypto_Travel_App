"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { format } from 'date-fns'
import {
  ChevronRight,
  Clock,
  MapPin,
  DollarSign,
  Star,
  Navigation,
  Coffee,
  Utensils,
  Camera,
  ShoppingBag,
  Hotel,
  Car
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import Image from 'next/image'
import type { DayPlan, POI } from '@/store/planStore'

interface MobileDayCardsProps {
  days: DayPlan[]
  itinerary: {
    destination: string
    startDate: Date
    endDate: Date
    pois: POI[]
  }
  onActivityClick?: (activityId: string) => void
  onEditDay?: (dayId: string) => void
}

// Category icons mapping
const categoryIcons = {
  'restaurant': Utensils,
  'cafe-bakery': Coffee,
  'attraction': Camera,
  'shopping': ShoppingBag,
  'hotel': Hotel,
  'transport': Car,
  'art-museums': Camera,
  'bars-nightlife': Coffee,
  'beauty-fashion': ShoppingBag
} as const

// Get category icon
function getCategoryIcon(category: string) {
  return categoryIcons[category as keyof typeof categoryIcons] || MapPin
}

// Day images (you can replace with actual images based on activities)
const dayImages = [
  'https://images.unsplash.com/photo-1449034446853-66c86144b0ad?w=800&h=400&fit=crop', // Golden Gate
  'https://images.unsplash.com/photo-1565620731264-94816b8b5d20?w=800&h=400&fit=crop', // Alcatraz
  'https://images.unsplash.com/photo-1495904786722-d238cc0334f2?w=800&h=400&fit=crop', // Fisherman's Wharf
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=800&h=400&fit=crop', // City view
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop', // Nature
]

export function MobileDayCards({ 
  days, 
  itinerary, 
  onActivityClick,
  onEditDay 
}: MobileDayCardsProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null)

  const toggleDay = (dayId: string) => {
    setExpandedDay(expandedDay === dayId ? null : dayId)
  }

  const getDayActivities = (day: DayPlan) => {
    return day.slots.map(slot => {
      const poi = itinerary.pois.find(p => p.id === slot.poiId)
      return {
        ...slot,
        poi
      }
    }).filter(slot => slot.poi)
  }

  const getDayHighlight = (day: DayPlan): string => {
    const activities = getDayActivities(day)
    if (activities.length === 0) return 'No activities planned'
    
    // Get the first major attraction or activity
    const highlight = activities.find(a => 
      a.poi?.category === 'attraction' || 
      a.poi?.rating && a.poi.rating >= 4.5
    )
    
    return highlight?.poi?.name || activities[0]?.poi?.name || 'Explore the city'
  }

  const getDayDescription = (day: DayPlan): string => {
    const activities = getDayActivities(day)
    const categories = [...new Set(activities.map(a => a.poi?.category).filter(Boolean))]
    
    if (categories.length === 0) return 'Plan your perfect day'
    
    const descriptions = {
      'attraction': 'landmarks',
      'restaurant': 'dining',
      'cafe-bakery': 'cafes',
      'shopping': 'shopping',
      'art-museums': 'culture'
    }
    
    const desc = categories
      .slice(0, 3)
      .map(cat => descriptions[cat as keyof typeof descriptions] || cat)
      .join(', ')
    
    return `Explore ${desc} and more`
  }

  return (
    <div className="space-y-4 pb-20">
      {days.map((day, index) => {
        const isExpanded = expandedDay === day.id
        const activities = getDayActivities(day)
        const dayImage = dayImages[index % dayImages.length]
        
        return (
          <motion.div
            key={day.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="overflow-hidden border-0 shadow-sm">
              {/* Day Header with Hero Image */}
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={dayImage}
                  alt={`Day ${day.dayNumber}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 400px"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Day Info Overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium text-white/80">
                      DAY {day.dayNumber}
                    </span>
                    <span className="text-xs text-white/60">
                      {format(new Date(day.date), 'MMM d')}
                    </span>
                  </div>
                  <h3 className="text-xl font-bold mb-1">
                    {getDayHighlight(day)}
                  </h3>
                  <p className="text-sm text-white/80">
                    {getDayDescription(day)}
                  </p>
                </div>
              </div>

              {/* Expand/View Details Button */}
              <button
                onClick={() => toggleDay(day.id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
              >
                <span className="text-blue-600 font-medium text-sm">
                  View Details
                </span>
                <ChevronRight 
                  className={cn(
                    "h-4 w-4 text-blue-600 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              </button>

              {/* Expanded Content */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="overflow-hidden"
                  >
                    <div className="px-4 pb-4 bg-gray-50">
                      {activities.length === 0 ? (
                        <div className="py-8 text-center">
                          <p className="text-gray-500 mb-4">No activities planned yet</p>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => onEditDay?.(day.id)}
                          >
                            Add Activities
                          </Button>
                        </div>
                      ) : (
                        <div className="space-y-3 pt-3">
                          {activities.map((activity, idx) => {
                            const Icon = getCategoryIcon(activity.poi?.category || '')
                            
                            return (
                              <motion.div
                                key={activity.id}
                                initial={{ x: -20, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                onClick={() => onActivityClick?.(activity.id)}
                                className="bg-white rounded-lg p-3 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                              >
                                <div className="flex items-start gap-3">
                                  {/* Time Badge */}
                                  <div className="flex-shrink-0">
                                    <Badge variant="secondary" className="font-mono text-xs">
                                      {activity.startTime}
                                    </Badge>
                                  </div>

                                  {/* Icon */}
                                  <div className="flex-shrink-0 mt-0.5">
                                    <div className={cn(
                                      "w-8 h-8 rounded-full flex items-center justify-center",
                                      activity.poi?.category === 'restaurant' ? "bg-orange-100 text-orange-600" :
                                      activity.poi?.category === 'attraction' ? "bg-blue-100 text-blue-600" :
                                      activity.poi?.category === 'shopping' ? "bg-purple-100 text-purple-600" :
                                      "bg-gray-100 text-gray-600"
                                    )}>
                                      <Icon className="h-4 w-4" />
                                    </div>
                                  </div>

                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-gray-900 truncate">
                                      {activity.poi?.name}
                                    </h4>
                                    
                                    {activity.poi?.location?.address && (
                                      <p className="text-xs text-gray-500 mt-0.5 truncate">
                                        {activity.poi.location.address}
                                      </p>
                                    )}

                                    {/* Meta info */}
                                    <div className="flex items-center gap-3 mt-1">
                                      {activity.duration && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {Math.floor(activity.duration / 60)}h {activity.duration % 60}m
                                        </span>
                                      )}
                                      
                                      {activity.poi?.price && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <DollarSign className="h-3 w-3" />
                                          {activity.poi.price}
                                        </span>
                                      )}
                                      
                                      {activity.poi?.rating && (
                                        <span className="text-xs text-gray-500 flex items-center gap-1">
                                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                          {activity.poi.rating}
                                        </span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Navigate */}
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-8 w-8 flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      // Handle navigation
                                    }}
                                  >
                                    <Navigation className="h-4 w-4" />
                                  </Button>
                                </div>
                              </motion.div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}