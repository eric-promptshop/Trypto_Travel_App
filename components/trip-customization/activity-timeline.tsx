"use client"

import * as React from "react"
import { 
  Clock, 
  MapPin, 
  Star, 
  Trash2,
  AlertTriangle,
  Calendar,
  Users,
  DollarSign,
  Plus,
  Edit
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types for selected activities (extending the base Activity interface)
interface SelectedActivity {
  id: string
  name: string
  description: string
  category: 'adventure' | 'cultural' | 'culinary' | 'nature' | 'entertainment' | 'shopping' | 'historical' | 'art' | 'sports' | 'nightlife'
  imageUrl: string
  location: {
    address: string
    city: string
    coordinates: [number, number]
  }
  duration: {
    min: number
    max: number
    typical: number
  }
  pricing: {
    currency: string
    adult: number
    child?: number
    isFree: boolean
  }
  rating: {
    overall: number
    reviewCount: number
  }
  selectedDate: string // ISO date string
  selectedTimeSlot: string // "09:00"
  participants: {
    adults: number
    children: number
  }
  totalPrice: number
}

interface TimeConflict {
  activityIds: string[]
  startTime: string
  endTime: string
  conflictType: 'overlap' | 'back-to-back' | 'travel-time'
}

interface DaySchedule {
  date: string
  activities: SelectedActivity[]
  conflicts: TimeConflict[]
  totalDuration: number // in minutes
  totalPrice: number
  isEmpty: boolean
}

interface ActivityTimelineProps {
  selectedActivities: SelectedActivity[]
  tripDates: {
    startDate: Date
    endDate: Date
  }
  onActivityRemove: (activityId: string) => void
  onActivityTimeChange?: (activityId: string, newTime: string) => void
  onActivityDateChange?: (activityId: string, newDate: string) => void
  onAddActivityClick?: (date: string) => void
  className?: string
}

// Utility functions
const formatTime = (timeString: string): string => {
  const timeParts = timeString.split(':')
  if (timeParts.length !== 2) return timeString // fallback for invalid format
  
  const hours = timeParts[0]
  const minutes = timeParts[1]
  const hour = parseInt(hours || '0')
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minutes} ${ampm}`
}

const formatDuration = (minutes: number): string => {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  
  if (hours === 0) return `${mins}min`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}min`
}

const formatPrice = (price: number, currency: string) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0
  }).format(price)
}

const addMinutesToTime = (timeString: string, minutes: number): string => {
  const timeParts = timeString.split(':')
  if (timeParts.length !== 2) return timeString // fallback for invalid format
  
  const hours = parseInt(timeParts[0] || '0')
  const mins = parseInt(timeParts[1] || '0')
  const totalMinutes = hours * 60 + mins + minutes
  const newHours = Math.floor(totalMinutes / 60) % 24
  const newMins = totalMinutes % 60
  return `${newHours.toString().padStart(2, '0')}:${newMins.toString().padStart(2, '0')}`
}

const detectConflicts = (activities: SelectedActivity[]): TimeConflict[] => {
  const conflicts: TimeConflict[] = []
  
  for (let i = 0; i < activities.length; i++) {
    for (let j = i + 1; j < activities.length; j++) {
      const activityA = activities[i]
      const activityB = activities[j]
      
      if (!activityA || !activityB) continue // safety check
      
      const startA = activityA.selectedTimeSlot
      const endA = addMinutesToTime(startA, activityA.duration.typical)
      const startB = activityB.selectedTimeSlot
      const endB = addMinutesToTime(startB, activityB.duration.typical)
      
      // Check for overlap
      if ((startA <= startB && endA > startB) || (startB <= startA && endB > startA)) {
        conflicts.push({
          activityIds: [activityA.id, activityB.id],
          startTime: startA < startB ? startA : startB,
          endTime: endA > endB ? endA : endB,
          conflictType: 'overlap'
        })
      }
    }
  }
  
  return conflicts
}

// Activity Card for Timeline
const TimelineActivityCard: React.FC<{
  activity: SelectedActivity
  onRemove: (id: string) => void
  hasConflict: boolean
  className?: string
}> = ({ activity, onRemove, hasConflict, className }) => {
  const endTime = addMinutesToTime(activity.selectedTimeSlot, activity.duration.typical)

  return (
    <Card className={cn(
      "transition-all duration-200",
      hasConflict && "border-red-300 bg-red-50",
      className
    )}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <img
            src={activity.imageUrl}
            alt={activity.name}
            className="w-16 h-16 rounded object-cover flex-shrink-0"
          />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <h4 className="font-semibold text-base leading-tight mb-1">
                  {activity.name}
                </h4>
                <p className="text-sm text-gray-600 line-clamp-2">
                  {activity.description}
                </p>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemove(activity.id)}
                className="h-8 w-8 p-0 text-gray-500 hover:text-red-500 flex-shrink-0 ml-2"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatTime(activity.selectedTimeSlot)} - {formatTime(endTime)}</span>
              </div>
              
              <div className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                <span className="truncate">{activity.location.address.split(',')[0]}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="text-xs">
                  {formatDuration(activity.duration.typical)}
                </Badge>
                <Badge variant="outline" className="text-xs capitalize">
                  {activity.category}
                </Badge>
                {hasConflict && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Conflict
                  </Badge>
                )}
              </div>
              
              <div className="text-right">
                <span className="font-semibold">
                  {activity.pricing.isFree ? 'Free' : formatPrice(activity.totalPrice, activity.pricing.currency)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Empty Day State
const EmptyDayState: React.FC<{
  date: string
  onAddActivity?: (date: string) => void
}> = ({ date, onAddActivity }) => {
  const dateObj = new Date(date)
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })

  return (
    <Card className="border-dashed border-2 border-gray-300">
      <CardContent className="p-8 text-center">
        <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No activities planned
        </h3>
        <p className="text-gray-600 mb-4">
          Add some activities to make the most of your {dayName}
        </p>
        {onAddActivity && (
          <Button 
            variant="outline" 
            onClick={() => onAddActivity(date)}
            className="gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Activity
          </Button>
        )}
      </CardContent>
    </Card>
  )
}

// Day Schedule Component
const DayScheduleCard: React.FC<{
  daySchedule: DaySchedule
  onActivityRemove: (id: string) => void
  onAddActivity?: (date: string) => void
}> = ({ daySchedule, onActivityRemove, onAddActivity }) => {
  const dateObj = new Date(daySchedule.date)
  const dayName = dateObj.toLocaleDateString('en-US', { weekday: 'long' })
  const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

  if (daySchedule.isEmpty) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">{dayName}</h3>
            <p className="text-sm text-gray-600">{dateString}</p>
          </div>
        </div>
        <EmptyDayState date={daySchedule.date} {...(onAddActivity && { onAddActivity })} />
      </div>
    )
  }

  // Sort activities by time
  const sortedActivities = [...daySchedule.activities].sort((a, b) => 
    a.selectedTimeSlot.localeCompare(b.selectedTimeSlot)
  )

  const conflictActivityIds = new Set(
    daySchedule.conflicts.flatMap(conflict => conflict.activityIds)
  )

  return (
    <div className="space-y-4">
      {/* Day Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">{dayName}</h3>
          <p className="text-sm text-gray-600">{dateString}</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-600">
            {daySchedule.activities.length} activities • {formatDuration(daySchedule.totalDuration)}
          </div>
          <div className="font-semibold">
            {formatPrice(daySchedule.totalPrice, 'EUR')}
          </div>
        </div>
      </div>

      {/* Conflict Alerts */}
      {daySchedule.conflicts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {daySchedule.conflicts.length} time conflict{daySchedule.conflicts.length > 1 ? 's' : ''} detected. 
            Please adjust activity times to avoid overlaps.
          </AlertDescription>
        </Alert>
      )}

      {/* Activities Timeline */}
      <div className="space-y-3">
        {sortedActivities.map((activity) => (
          <TimelineActivityCard
            key={activity.id}
            activity={activity}
            onRemove={onActivityRemove}
            hasConflict={conflictActivityIds.has(activity.id)}
          />
        ))}
      </div>

      {/* Add Activity Button */}
      {onAddActivity && (
        <Button 
          variant="outline" 
          className="w-full gap-2" 
          onClick={() => onAddActivity(daySchedule.date)}
        >
          <Plus className="h-4 w-4" />
          Add Another Activity
        </Button>
      )}
    </div>
  )
}

// Main ActivityTimeline Component
export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  selectedActivities,
  tripDates,
  onActivityRemove,
  onActivityTimeChange,
  onActivityDateChange,
  onAddActivityClick,
  className
}) => {
  // Generate day schedules
  const daySchedules = React.useMemo(() => {
    const schedules: DaySchedule[] = []
    const startDate = new Date(tripDates.startDate)
    const endDate = new Date(tripDates.endDate)
    
    // Generate schedule for each day of the trip
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      const dateString = currentDate.toISOString().split('T')[0] || ''
      const dayActivities = selectedActivities.filter(
        activity => activity.selectedDate === dateString
      )
      
      const conflicts = detectConflicts(dayActivities)
      const totalDuration = dayActivities.reduce(
        (sum, activity) => sum + activity.duration.typical, 0
      )
      const totalPrice = dayActivities.reduce(
        (sum, activity) => sum + activity.totalPrice, 0
      )
      
      schedules.push({
        date: dateString,
        activities: dayActivities,
        conflicts,
        totalDuration,
        totalPrice,
        isEmpty: dayActivities.length === 0
      })
      
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    return schedules
  }, [selectedActivities, tripDates])

  const totalActivities = selectedActivities.length
  const totalPrice = selectedActivities.reduce((sum, activity) => sum + activity.totalPrice, 0)
  const totalConflicts = daySchedules.reduce((sum, day) => sum + day.conflicts.length, 0)

  return (
    <div className={cn("space-y-6", className)}>
      {/* Summary Header */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold">Activity Timeline</h2>
            <p className="text-gray-600">
              Your daily activity schedule
            </p>
          </div>
          
          <div className="flex items-center gap-4 text-sm">
            <div className="text-center">
              <div className="font-semibold text-lg">{totalActivities}</div>
              <div className="text-gray-600">Activities</div>
            </div>
            <Separator orientation="vertical" className="h-8" />
            <div className="text-center">
              <div className="font-semibold text-lg">
                {formatPrice(totalPrice, 'EUR')}
              </div>
              <div className="text-gray-600">Total</div>
            </div>
            {totalConflicts > 0 && (
              <>
                <Separator orientation="vertical" className="h-8" />
                <div className="text-center">
                  <div className="font-semibold text-lg text-red-600">{totalConflicts}</div>
                  <div className="text-gray-600">Conflicts</div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Day-by-Day Schedule */}
      <div className="space-y-8">
        {daySchedules.map((daySchedule) => (
          <DayScheduleCard
            key={daySchedule.date}
            daySchedule={daySchedule}
            onActivityRemove={onActivityRemove}
            {...(onAddActivityClick && { onAddActivity: onAddActivityClick })}
          />
        ))}
      </div>

      {/* Empty State for No Activities */}
      {totalActivities === 0 && (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">
            No activities selected yet
          </h3>
          <p className="text-gray-600 mb-6">
            Start building your itinerary by selecting activities from the activity selector
          </p>
          {onAddActivityClick && (
            <Button 
              onClick={() => onAddActivityClick(daySchedules[0]?.date || new Date().toISOString().split('T')[0] || '')}
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Select Activities
            </Button>
          )}
        </div>
      )}
    </div>
  )
} 