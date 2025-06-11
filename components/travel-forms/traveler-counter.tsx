"use client"

import * as React from "react"
import { Minus, Plus, Users } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form"

interface TravelerCounterProps {
  adults: number
  children: number
  infants: number
  onAdultsChange: (count: number) => void
  onChildrenChange: (count: number) => void
  onInfantsChange: (count: number) => void
  disabled?: boolean
  className?: string
  maxTotal?: number
}

interface CounterRowProps {
  label: string
  description: string
  value: number
  onChange: (value: number) => void
  min?: number
  max?: number
  disabled?: boolean
}

const CounterRow: React.FC<CounterRowProps> = ({
  label,
  description,
  value,
  onChange,
  min = 0,
  max = 20,
  disabled = false
}) => {
  const handleDecrement = () => {
    if (value > min) {
      onChange(value - 1)
    }
  }

  const handleIncrement = () => {
    if (value < max) {
      onChange(value + 1)
    }
  }

  return (
    <div className="flex items-center justify-between py-3">
      <div className="flex-1">
        <div className="font-medium">{label}</div>
        <div className="text-sm text-muted-foreground">{description}</div>
      </div>
      
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleDecrement}
          disabled={disabled || value <= min}
          className="touch-target shrink-0"
        >
          <Minus className="h-3 w-3" />
          <span className="sr-only">Decrease {label}</span>
        </Button>
        
        <span className="w-12 text-center font-medium">{value}</span>
        
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={handleIncrement}
          disabled={disabled || value >= max}
          className="touch-target shrink-0"
        >
          <Plus className="h-3 w-3" />
          <span className="sr-only">Increase {label}</span>
        </Button>
      </div>
    </div>
  )
}

export const TravelerCounter: React.FC<TravelerCounterProps> = ({
  adults,
  children,
  infants,
  onAdultsChange,
  onChildrenChange,
  onInfantsChange,
  disabled = false,
  className,
  maxTotal = 20
}) => {
  const totalTravelers = adults + children + infants

  // Calculate max for each category based on total limit
  const getMaxForCategory = (currentValue: number, otherValues: number[]) => {
    const otherTotal = otherValues.reduce((sum, val) => sum + val, 0)
    return Math.min(20, maxTotal - otherTotal + currentValue)
  }

  const maxAdults = getMaxForCategory(adults, [children, infants])
  const maxChildren = getMaxForCategory(children, [adults, infants])
  const maxInfants = getMaxForCategory(infants, [adults, children])

  return (
    <FormItem className={cn("space-y-0", className)}>
      <FormLabel className="flex items-center gap-2">
        <Users className="h-4 w-4" />
        Travelers
      </FormLabel>
      
      <div className="rounded-lg border p-4 space-y-1">
        <CounterRow
          label="Adults"
          description="Ages 18+"
          value={adults}
          onChange={onAdultsChange}
          min={1}
          max={maxAdults}
          disabled={disabled}
        />
        
        <div className="border-t" />
        
        <CounterRow
          label="Children"
          description="Ages 2-17"
          value={children}
          onChange={onChildrenChange}
          min={0}
          max={maxChildren}
          disabled={disabled}
        />
        
        <div className="border-t" />
        
        <CounterRow
          label="Infants"
          description="Under 2"
          value={infants}
          onChange={onInfantsChange}
          min={0}
          max={maxInfants}
          disabled={disabled}
        />
      </div>
      
      {/* Summary */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <span>Total travelers: {totalTravelers}</span>
        {totalTravelers >= maxTotal && (
          <span className="text-amber-600">Maximum capacity reached</span>
        )}
      </div>
      
      <FormMessage />
    </FormItem>
  )
} 