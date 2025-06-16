"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Calendar, Clock, Check } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import { usePlanStore, POI } from '@/store/planStore'

interface AddToDayButtonProps {
  poi: POI
  size?: 'sm' | 'default'
}

export function AddToDayButton({ poi, size = 'sm' }: AddToDayButtonProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedDayId, setSelectedDayId] = useState<string | null>(null)
  const [selectedTime, setSelectedTime] = useState<string>('09:00')
  const [isAdding, setIsAdding] = useState(false)
  const [justAdded, setJustAdded] = useState(false)
  
  const { itinerary, addPoiToDay, getTimeGaps } = usePlanStore()
  
  // Generate time slots
  const timeSlots = Array.from({ length: 28 }, (_, i) => {
    const hour = Math.floor(i / 2) + 8 // Start at 8 AM
    const minute = i % 2 === 0 ? '00' : '30'
    return `${hour.toString().padStart(2, '0')}:${minute}`
  })
  
  // Get available days from itinerary
  const availableDays = itinerary?.days || []
  
  // Smart time suggestions based on gaps
  const getTimeSuggestions = (dayId: string): string[] => {
    const gaps = getTimeGaps(dayId)
    const suggestions: string[] = []
    
    gaps.forEach(gap => {
      if (gap.duration >= 60) { // Only suggest for gaps >= 1 hour
        suggestions.push(gap.start)
        // Add midpoint if gap is large enough
        if (gap.duration >= 120) {
          const [startHour, startMin] = gap.start.split(':').map(Number)
          const midMinutes = startHour * 60 + startMin + gap.duration / 2
          const midHour = Math.floor(midMinutes / 60)
          const midMin = Math.floor(midMinutes % 60)
          suggestions.push(`${midHour.toString().padStart(2, '0')}:${midMin.toString().padStart(2, '0')}`)
        }
      }
    })
    
    return suggestions.slice(0, 3) // Return top 3 suggestions
  }
  
  const handleAdd = async () => {
    if (!selectedDayId || !itinerary) return
    
    setIsAdding(true)
    
    try {
      // Add POI to the selected day
      addPoiToDay(poi, selectedDayId, selectedTime)
      
      // Find the day for the success message
      const day = itinerary.days.find(d => d.id === selectedDayId)
      const dayLabel = day ? format(day.date, 'EEE d MMM') : 'the itinerary'
      
      // Show success toast with undo option
      const toastId = toast.success(
        <div className="flex items-center justify-between w-full">
          <span>Added to {dayLabel} at {selectedTime}</span>
          <button
            onClick={() => {
              // Implement undo functionality
              toast.dismiss(toastId)
              // TODO: Implement removePoiFromDay in store
            }}
            className="ml-4 text-sm font-medium hover:underline"
          >
            Undo
          </button>
        </div>,
        { duration: 5000 }
      )
      
      setJustAdded(true)
      setIsOpen(false)
      
      // Reset the "just added" state after animation
      setTimeout(() => {
        setJustAdded(false)
      }, 2000)
    } catch (error) {
      toast.error('Failed to add to itinerary')
    } finally {
      setIsAdding(false)
    }
  }
  
  // Auto-select first day if only one exists
  useEffect(() => {
    if (availableDays.length === 1 && !selectedDayId) {
      setSelectedDayId(availableDays[0].id)
    }
  }, [availableDays, selectedDayId])
  
  // Reset selection when popover closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedTime('09:00')
    }
  }, [isOpen])
  
  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={justAdded ? "default" : "outline"}
          size={size === 'sm' ? 'icon' : 'default'}
          className={cn(
            "transition-all",
            size === 'sm' && "h-8 w-8",
            justAdded && "bg-green-500 hover:bg-green-600"
          )}
          disabled={!itinerary || availableDays.length === 0}
        >
          <AnimatePresence mode="wait">
            {justAdded ? (
              <motion.div
                key="check"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
              >
                <Check className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div
                key="plus"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0 }}
                className="flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                {size === 'default' && <span>Add</span>}
              </motion.div>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-sm mb-1">Add to itinerary</h3>
            <p className="text-xs text-gray-500">{poi.name}</p>
          </div>
          
          {/* Day selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              Select day
            </label>
            <Select value={selectedDayId || ''} onValueChange={setSelectedDayId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a day" />
              </SelectTrigger>
              <SelectContent>
                {availableDays.map((day) => (
                  <SelectItem key={day.id} value={day.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>Day {day.dayNumber}</span>
                      <span className="text-xs text-gray-500 ml-2">
                        {format(day.date, 'EEE, MMM d')}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Time selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Select time
            </label>
            
            {/* Time suggestions */}
            {selectedDayId && getTimeSuggestions(selectedDayId).length > 0 && (
              <div className="flex gap-2 flex-wrap mb-2">
                <span className="text-xs text-gray-500">Suggested:</span>
                {getTimeSuggestions(selectedDayId).map((time) => (
                  <Button
                    key={time}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => setSelectedTime(time)}
                  >
                    {time}
                  </Button>
                ))}
              </div>
            )}
            
            <Select value={selectedTime} onValueChange={setSelectedTime}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {timeSlots.map((time) => (
                  <SelectItem key={time} value={time}>
                    {time}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {/* Add button */}
          <Button
            className="w-full"
            onClick={handleAdd}
            disabled={!selectedDayId || isAdding}
          >
            {isAdding ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              >
                <Clock className="h-4 w-4" />
              </motion.div>
            ) : (
              <>Add to Day {availableDays.find(d => d.id === selectedDayId)?.dayNumber}</>
            )}
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}