"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Sparkles,
  Route,
  Clock,
  Utensils,
  Coffee,
  MapPin,
  X,
  Check,
  Loader2
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { usePlanStore, AISuggestion, TimeSlot } from '@/store/planStore'

interface AIQuickSuggestProps {
  dayId: string
  className?: string
}

export function AIQuickSuggest({ dayId, className }: AIQuickSuggestProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [expandedSuggestionId, setExpandedSuggestionId] = useState<string | null>(null)
  
  const {
    suggestions,
    setSuggestions,
    applySuggestion,
    dismissSuggestion,
    appliedSuggestions,
    getSelectedDay,
    getTimeGaps,
    itinerary
  } = usePlanStore()
  
  // Fetch AI suggestions based on current day context
  useEffect(() => {
    fetchSuggestions()
  }, [dayId])
  
  const fetchSuggestions = async () => {
    setIsLoading(true)
    
    try {
      const day = getSelectedDay()
      if (!day) return
      
      const gaps = getTimeGaps(dayId)
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Generate contextual suggestions
      const newSuggestions: AISuggestion[] = []
      
      // Route optimization suggestion
      if (day.slots.length >= 3) {
        newSuggestions.push({
          id: `optimize-${Date.now()}`,
          type: 'optimize_route',
          description: 'Optimize route to save 25 minutes',
          context: { dayId }
        })
      }
      
      // Gap filling suggestions
      gaps.forEach((gap, index) => {
        if (gap.duration >= 90) {
          const mealTime = getMealType(gap.start)
          if (mealTime) {
            newSuggestions.push({
              id: `meal-${Date.now()}-${index}`,
              type: 'add_meal',
              description: `Add ${mealTime} recommendation`,
              context: {
                dayId,
                gapStart: gap.start,
                gapEnd: gap.end
              }
            })
          } else {
            newSuggestions.push({
              id: `fill-${Date.now()}-${index}`,
              type: 'fill_gap',
              description: `Fill ${formatDuration(gap.duration)} gap with activity`,
              context: {
                dayId,
                gapStart: gap.start,
                gapEnd: gap.end
              }
            })
          }
        }
      })
      
      setSuggestions(newSuggestions.filter(s => !appliedSuggestions.includes(s.id)))
    } catch (error) {
      console.error('Error fetching suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleApplySuggestion = async (suggestion: AISuggestion) => {
    setExpandedSuggestionId(suggestion.id)
    
    try {
      // Simulate fetching detailed suggestion data
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // Apply the suggestion
      applySuggestion(suggestion.id)
      
      toast.success(
        <div className="flex items-center justify-between w-full">
          <span>Applied: {suggestion.description}</span>
          <button
            onClick={() => {
              // TODO: Implement undo
              toast.dismiss()
            }}
            className="ml-4 text-sm font-medium hover:underline"
          >
            Undo
          </button>
        </div>,
        { duration: 5000 }
      )
      
      setExpandedSuggestionId(null)
    } catch (error) {
      toast.error('Failed to apply suggestion')
      setExpandedSuggestionId(null)
    }
  }
  
  const getSuggestionIcon = (type: AISuggestion['type']) => {
    switch (type) {
      case 'optimize_route':
        return Route
      case 'fill_gap':
        return Clock
      case 'add_meal':
        return Utensils
      case 'add_transport':
        return MapPin
      default:
        return Sparkles
    }
  }
  
  const getSuggestionColor = (type: AISuggestion['type']) => {
    switch (type) {
      case 'optimize_route':
        return 'text-blue-600 bg-blue-50 hover:bg-blue-100'
      case 'fill_gap':
        return 'text-purple-600 bg-purple-50 hover:bg-purple-100'
      case 'add_meal':
        return 'text-orange-600 bg-orange-50 hover:bg-orange-100'
      case 'add_transport':
        return 'text-green-600 bg-green-50 hover:bg-green-100'
      default:
        return 'text-gray-600 bg-gray-50 hover:bg-gray-100'
    }
  }
  
  if (isLoading && suggestions.length === 0) {
    return (
      <div className={cn("flex items-center gap-2 p-4", className)}>
        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
        <span className="text-sm text-gray-500">Finding suggestions...</span>
      </div>
    )
  }
  
  if (suggestions.length === 0) {
    return null
  }
  
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2 px-4">
        <Sparkles className="h-4 w-4 text-blue-600" />
        <span className="text-sm font-medium">AI Suggestions</span>
      </div>
      
      <div className="px-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {suggestions.map((suggestion) => {
            const Icon = getSuggestionIcon(suggestion.type)
            const isExpanded = expandedSuggestionId === suggestion.id
            const isApplied = appliedSuggestions.includes(suggestion.id)
            
            return (
              <motion.div
                key={suggestion.id}
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <Card
                  className={cn(
                    "p-3 cursor-pointer transition-all",
                    isExpanded && "shadow-md",
                    isApplied && "opacity-50"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => !isApplied && handleApplySuggestion(suggestion)}
                      disabled={isApplied || isExpanded}
                      className="flex items-center gap-3 flex-1 text-left"
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
                        getSuggestionColor(suggestion.type)
                      )}>
                        {isExpanded ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Icon className="h-4 w-4" />
                        )}
                      </div>
                      
                      <div className="flex-1">
                        <p className="text-sm font-medium">{suggestion.description}</p>
                        {suggestion.context?.gapStart && (
                          <p className="text-xs text-gray-500 mt-0.5">
                            {suggestion.context.gapStart} - {suggestion.context.gapEnd}
                          </p>
                        )}
                      </div>
                      
                      {isApplied && (
                        <Badge variant="secondary" className="text-xs">
                          Applied
                        </Badge>
                      )}
                    </button>
                    
                    {!isApplied && !isExpanded && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 ml-2"
                        onClick={(e) => {
                          e.stopPropagation()
                          dismissSuggestion(suggestion.id)
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Expanded preview (ghost rows) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="mt-3 pt-3 border-t space-y-2"
                      >
                        <p className="text-xs text-gray-500">Preview:</p>
                        {/* Ghost activity rows */}
                        <div className="space-y-1">
                          <GhostActivity time="14:00" name="Musée d'Orsay" />
                          <GhostActivity time="15:30" name="Café de Flore" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

// Ghost activity preview component
function GhostActivity({ time, name }: { time: string; name: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-md bg-gray-50 opacity-60">
      <div className="text-xs font-medium text-gray-500">{time}</div>
      <div className="text-sm text-gray-600">{name}</div>
      <Badge variant="outline" className="text-xs ml-auto">
        Suggested
      </Badge>
    </div>
  )
}

// Helper functions
function getMealType(time: string): string | null {
  const [hours] = time.split(':').map(Number)
  if (hours >= 7 && hours <= 10) return 'breakfast'
  if (hours >= 11 && hours <= 14) return 'lunch'
  if (hours >= 18 && hours <= 21) return 'dinner'
  return null
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours > 0) {
    return `${hours}h ${mins > 0 ? `${mins}m` : ''}`
  }
  return `${mins}m`
}