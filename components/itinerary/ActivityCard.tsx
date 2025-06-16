"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { 
  Clock,
  MapPin,
  DollarSign,
  Star,
  ExternalLink,
  MoreHorizontal,
  Edit,
  Trash2,
  Copy,
  Share
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface ActivityCardProps {
  activity: {
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
  isSelected?: boolean
  isHighlighted?: boolean
  onSelect?: () => void
  onEdit?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
  readonly?: boolean
}

const categoryColors = {
  dining: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', icon: '🍽️' },
  activity: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', icon: '🎯' },
  transport: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', icon: '🚗' },
  accommodation: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: '🏨' },
  shopping: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', icon: '🛍️' },
  tour: { bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700', icon: '🎫' }
}

export function ActivityCard({
  activity,
  isSelected,
  isHighlighted,
  onSelect,
  onEdit,
  onDelete,
  onDuplicate,
  readonly = false
}: ActivityCardProps) {
  const category = activity.category || 'activity'
  const categoryStyle = categoryColors[category]
  
  return (
    <motion.div
      whileHover={{ scale: readonly ? 1 : 1.02 }}
      whileTap={{ scale: readonly ? 1 : 0.98 }}
      transition={{ duration: 0.2 }}
    >
      <Card
        className={cn(
          "cursor-pointer transition-all duration-200 group",
          categoryStyle.bg,
          categoryStyle.border,
          "border-2",
          isSelected && "ring-2 ring-blue-500 ring-offset-2",
          isHighlighted && !isSelected && "ring-2 ring-orange-400 ring-offset-1",
          "hover:shadow-md"
        )}
        onClick={onSelect}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-3">
            {/* Category Icon */}
            <div className="flex-shrink-0">
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-lg",
                "bg-white shadow-sm"
              )}>
                {categoryStyle.icon}
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900 line-clamp-1">
                    {activity.name}
                  </h4>
                  
                  {/* Meta Information */}
                  <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-gray-600">
                    {activity.time && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{activity.time}</span>
                        {activity.duration && (
                          <span className="text-gray-400">• {activity.duration}min</span>
                        )}
                      </div>
                    )}
                    
                    {activity.location.address && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        <span className="line-clamp-1">{activity.location.address}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Description */}
                  {activity.description && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                      {activity.description}
                    </p>
                  )}
                  
                  {/* Bottom Row - Badges and Info */}
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      {activity.isRecommendedTour && (
                        <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                          Recommended
                        </Badge>
                      )}
                      
                      {activity.provider && (
                        <span className="text-xs text-gray-500">
                          by {activity.provider}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      {activity.price && (
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <DollarSign className="h-3 w-3" />
                          <span>{activity.price}</span>
                        </div>
                      )}
                      
                      {activity.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                          <span className="text-sm font-medium">{activity.rating}</span>
                        </div>
                      )}
                      
                      {activity.bookingUrl && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 w-7 p-0"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  window.open(activity.bookingUrl, '_blank')
                                }}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Book now</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Actions Menu */}
                {!readonly && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onEdit?.()
                      }}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        onDuplicate?.()
                      }}>
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicate
                      </DropdownMenuItem>
                      <DropdownMenuItem>
                        <Share className="h-4 w-4 mr-2" />
                        Share
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem 
                        className="text-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDelete?.()
                        }}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              {/* Image Preview (if available) */}
              {activity.image && (
                <div className="mt-3 relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={activity.image}
                    alt={activity.name}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}