"use client"

import * as React from "react"
import { CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { FormControl, FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface DateRangePickerProps {
  startDate?: Date
  endDate?: Date
  onStartDateChange: (date: Date | undefined) => void
  onEndDateChange: (date: Date | undefined) => void
  disabled?: boolean
  className?: string
  placeholder?: {
    start?: string
    end?: string
  }
  minDate?: Date
  maxDate?: Date
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  disabled = false,
  className,
  placeholder = {
    start: "Check-in date",
    end: "Check-out date"
  },
  minDate = new Date(),
  maxDate
}) => {
  const [isStartOpen, setIsStartOpen] = React.useState(false)
  const [isEndOpen, setIsEndOpen] = React.useState(false)

  const handleStartDateSelect = (date: Date | undefined) => {
    onStartDateChange(date)
    setIsStartOpen(false)
    
    // If end date is before new start date, clear it
    if (date && endDate && endDate <= date) {
      onEndDateChange(undefined)
    }
  }

  const handleEndDateSelect = (date: Date | undefined) => {
    onEndDateChange(date)
    setIsEndOpen(false)
  }

  const clearDates = () => {
    onStartDateChange(undefined)
    onEndDateChange(undefined)
  }

  return (
    <div className={cn("space-y-4", className)}>
      {/* Start Date */}
      <FormItem>
        <FormLabel>Travel Dates</FormLabel>
        <div className="flex flex-col sm:flex-row gap-2">
          <Popover open={isStartOpen} onOpenChange={setIsStartOpen}>
            <PopoverTrigger asChild>
              <FormControl>
                <Button
                  variant="outline"
                  className={cn(
                    "flex-1 justify-start text-left font-normal",
                    !startDate && "text-muted-foreground"
                  )}
                  disabled={disabled}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? format(startDate, "MMM dd, yyyy") : placeholder.start}
                </Button>
              </FormControl>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={startDate}
                onSelect={handleStartDateSelect}
                disabled={(date) => {
                  if (minDate && date < minDate) return true
                  if (maxDate && date > maxDate) return true
                  return false
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* End Date */}
          <Popover open={isEndOpen} onOpenChange={setIsEndOpen}>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "flex-1 justify-start text-left font-normal",
                  !endDate && "text-muted-foreground"
                )}
                disabled={disabled || !startDate}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {endDate ? format(endDate, "MMM dd, yyyy") : placeholder.end}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={endDate}
                onSelect={handleEndDateSelect}
                disabled={(date) => {
                  if (!startDate) return true
                  if (date <= startDate) return true
                  if (maxDate && date > maxDate) return true
                  return false
                }}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {/* Clear Button */}
          {(startDate || endDate) && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={clearDates}
              className="shrink-0"
              disabled={disabled}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Clear dates</span>
            </Button>
          )}
        </div>
        <FormMessage />
      </FormItem>

      {/* Duration Display */}
      {startDate && endDate && (
        <div className="text-sm text-muted-foreground">
          Duration: {Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))} days
        </div>
      )}
    </div>
  )
} 