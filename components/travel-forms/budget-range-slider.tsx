"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import { FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface BudgetRangeSliderProps {
  minValue: number
  maxValue: number
  onMinChange: (value: number) => void
  onMaxChange: (value: number) => void
  currency: string
  onCurrencyChange: (currency: string) => void
  disabled?: boolean
  className?: string
  minLimit?: number
  maxLimit?: number
}

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar' },
]

const formatCurrency = (value: number, currency: string): string => {
  const currencyInfo = currencies.find(c => c.code === currency)
  const symbol = currencyInfo?.symbol || '$'
  
  if (value >= 1000000) {
    return `${symbol}${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${symbol}${(value / 1000).toFixed(0)}K`
  }
  return `${symbol}${value.toLocaleString()}`
}

export const BudgetRangeSlider: React.FC<BudgetRangeSliderProps> = ({
  minValue,
  maxValue,
  onMinChange,
  onMaxChange,
  currency,
  onCurrencyChange,
  disabled = false,
  className,
  minLimit = 0,
  maxLimit = 50000
}) => {
  const [localMin, setLocalMin] = React.useState(minValue.toString())
  const [localMax, setLocalMax] = React.useState(maxValue.toString())

  // Update local state when props change
  React.useEffect(() => {
    setLocalMin(minValue.toString())
  }, [minValue])

  React.useEffect(() => {
    setLocalMax(maxValue.toString())
  }, [maxValue])

  const handleSliderChange = (values: number[]) => {
    const [min, max] = values
    if (min !== undefined && max !== undefined) {
      onMinChange(min)
      onMaxChange(max)
    }
  }

  const handleMinInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalMin(value)
    
    const numValue = parseInt(value, 10) || 0
    if (numValue >= minLimit && numValue <= maxValue) {
      onMinChange(numValue)
    }
  }

  const handleMaxInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setLocalMax(value)
    
    const numValue = parseInt(value, 10) || 0
    if (numValue >= minValue && numValue <= maxLimit) {
      onMaxChange(numValue)
    }
  }

  const handleMinInputBlur = () => {
    const numValue = parseInt(localMin, 10) || minLimit
    const clampedValue = Math.max(minLimit, Math.min(numValue, maxValue))
    onMinChange(clampedValue)
    setLocalMin(clampedValue.toString())
  }

  const handleMaxInputBlur = () => {
    const numValue = parseInt(localMax, 10) || maxLimit
    const clampedValue = Math.max(minValue, Math.min(numValue, maxLimit))
    onMaxChange(clampedValue)
    setLocalMax(clampedValue.toString())
  }

  return (
    <FormItem className={cn("space-y-4", className)}>
      <FormLabel>Budget Range</FormLabel>
      
      {/* Currency Selection */}
      <div className="flex items-center gap-2">
        <Select value={currency} onValueChange={onCurrencyChange} disabled={disabled}>
          <SelectTrigger className="w-[120px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {currencies.map((curr) => (
              <SelectItem key={curr.code} value={curr.code}>
                {curr.symbol} {curr.code}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <div className="text-sm text-muted-foreground">
          {formatCurrency(minValue, currency)} - {formatCurrency(maxValue, currency)}
        </div>
      </div>

      {/* Slider */}
      <div className="px-2">
        <Slider
          value={[minValue, maxValue]}
          onValueChange={handleSliderChange}
          min={minLimit}
          max={maxLimit}
          step={100}
          disabled={disabled}
          className="w-full"
        />
      </div>

      {/* Manual Input Fields */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Minimum</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {currencies.find(c => c.code === currency)?.symbol || '$'}
            </span>
            <Input
              type="number"
              value={localMin}
              onChange={handleMinInputChange}
              onBlur={handleMinInputBlur}
              className="pl-8"
              disabled={disabled}
              min={minLimit}
              max={maxValue}
              step="100"
            />
          </div>
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium">Maximum</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
              {currencies.find(c => c.code === currency)?.symbol || '$'}
            </span>
            <Input
              type="number"
              value={localMax}
              onChange={handleMaxInputChange}
              onBlur={handleMaxInputBlur}
              className="pl-8"
              disabled={disabled}
              min={minValue}
              max={maxLimit}
              step="100"
            />
          </div>
        </div>
      </div>

      {/* Budget Suggestions */}
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: 'Budget', min: 500, max: 2000 },
          { label: 'Mid-range', min: 2000, max: 5000 },
          { label: 'Luxury', min: 5000, max: 15000 },
        ].map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => {
              onMinChange(preset.min)
              onMaxChange(preset.max)
            }}
            disabled={disabled}
            className={cn(
              "px-3 py-2 text-xs rounded-md border transition-colors",
              "hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring",
              minValue === preset.min && maxValue === preset.max
                ? "bg-primary text-primary-foreground"
                : "bg-background text-foreground"
            )}
          >
            {preset.label}
            <br />
            <span className="text-muted-foreground">
              {formatCurrency(preset.min, currency)} - {formatCurrency(preset.max, currency)}
            </span>
          </button>
        ))}
      </div>

      <FormMessage />
    </FormItem>
  )
} 