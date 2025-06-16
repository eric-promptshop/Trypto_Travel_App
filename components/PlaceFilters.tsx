"use client"

import React, { useState } from 'react'
import {
  Filter,
  Star,
  DollarSign,
  MapPin,
  ChevronDown,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'

export interface PlaceFilters {
  priceRange?: [number, number]
  minRating?: number
  maxDistance?: number
}

interface PlaceFiltersProps {
  filters: PlaceFilters
  onFiltersChange: (filters: PlaceFilters) => void
  className?: string
}

export function PlaceFiltersComponent({ 
  filters, 
  onFiltersChange,
  className 
}: PlaceFiltersProps) {
  const [open, setOpen] = useState(false)
  
  // Count active filters
  const activeFilterCount = [
    filters.priceRange,
    filters.minRating,
    filters.maxDistance
  ].filter(Boolean).length
  
  const clearFilters = () => {
    onFiltersChange({})
  }
  
  const updatePriceRange = (min: number, max: number) => {
    onFiltersChange({
      ...filters,
      priceRange: min === 1 && max === 4 ? undefined : [min, max]
    })
  }
  
  const updateMinRating = (rating: number) => {
    onFiltersChange({
      ...filters,
      minRating: rating === 0 ? undefined : rating
    })
  }
  
  const updateMaxDistance = (distance: number) => {
    onFiltersChange({
      ...filters,
      maxDistance: distance === 10 ? undefined : distance
    })
  }
  
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn("gap-2", className)}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5">
              {activeFilterCount}
            </Badge>
          )}
          <ChevronDown className={cn(
            "h-3 w-3 transition-transform",
            open && "rotate-180"
          )} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-medium">Filters</h3>
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="h-8 px-2 text-xs"
              >
                Clear all
              </Button>
            )}
          </div>
          
          {/* Price Range */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-3.5 w-3.5" />
              Price Range
            </Label>
            <div className="flex gap-2">
              {[1, 2, 3, 4].map((price) => (
                <Button
                  key={price}
                  variant={
                    filters.priceRange &&
                    price >= filters.priceRange[0] &&
                    price <= filters.priceRange[1]
                      ? "default"
                      : "outline"
                  }
                  size="sm"
                  className="flex-1 h-8"
                  onClick={() => {
                    const currentMin = filters.priceRange?.[0] || 1
                    const currentMax = filters.priceRange?.[1] || 4
                    
                    if (filters.priceRange && 
                        price >= currentMin && 
                        price <= currentMax &&
                        currentMin === currentMax) {
                      // Clicking the only selected price clears the filter
                      updatePriceRange(1, 4)
                    } else if (!filters.priceRange) {
                      // No filter set, select just this price
                      updatePriceRange(price, price)
                    } else {
                      // Extend or shrink the range
                      const newMin = Math.min(price, currentMin)
                      const newMax = Math.max(price, currentMax)
                      updatePriceRange(newMin, newMax)
                    }
                  }}
                >
                  {'$'.repeat(price)}
                </Button>
              ))}
            </div>
            {filters.priceRange && (
              <p className="text-xs text-muted-foreground">
                {'$'.repeat(filters.priceRange[0])} - {'$'.repeat(filters.priceRange[1])}
              </p>
            )}
          </div>
          
          {/* Minimum Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Star className="h-3.5 w-3.5" />
              Minimum Rating
            </Label>
            <RadioGroup
              value={filters.minRating?.toString() || "0"}
              onValueChange={(value) => updateMinRating(parseFloat(value))}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="0" id="rating-any" />
                <Label htmlFor="rating-any" className="text-sm font-normal cursor-pointer">
                  Any rating
                </Label>
              </div>
              {[4.5, 4.0, 3.5, 3.0].map((rating) => (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                  <Label 
                    htmlFor={`rating-${rating}`} 
                    className="text-sm font-normal cursor-pointer flex items-center gap-1"
                  >
                    <Star className="h-3 w-3 fill-current text-yellow-500" />
                    {rating}+
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>
          
          {/* Maximum Distance */}
          <div className="space-y-2">
            <Label className="text-sm font-medium flex items-center gap-2">
              <MapPin className="h-3.5 w-3.5" />
              Maximum Distance
            </Label>
            <div className="px-2">
              <Slider
                value={[filters.maxDistance || 10]}
                onValueChange={([value]) => updateMaxDistance(value)}
                max={10}
                min={0.5}
                step={0.5}
                className="w-full"
              />
            </div>
            <p className="text-xs text-muted-foreground text-center">
              {filters.maxDistance ? `${filters.maxDistance} km` : 'Any distance'}
            </p>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}