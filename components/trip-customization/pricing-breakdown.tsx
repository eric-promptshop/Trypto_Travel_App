"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { 
  TrendingUp, 
  TrendingDown, 
  Loader2, 
  DollarSign, 
  Calendar, 
  Users, 
  Clock, 
  Info,
  ChevronDown,
  ChevronUp,
  Building,
  MapPin,
  Plane,
  Utensils,
  ShoppingBag
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { PricingUpdate, PricingHistory, CurrencyOption } from "./pricing-service"

// Types
interface PriceChangeAnimationProps {
  currentValue: number
  previousValue?: number | undefined
  currency: string
  duration?: number
}

interface CategoryBreakdownProps {
  breakdown: PricingUpdate['breakdown']
  total: number
  currency: string
  isLoading?: boolean
}

interface PricingComparisonProps {
  original: PricingUpdate
  current: PricingUpdate
  currency: string
}

interface DailyBreakdownProps {
  byDay: PricingUpdate['byDay']
  currency: string
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

interface PricingBreakdownProps {
  pricing: PricingUpdate | null
  history: PricingHistory | null
  isCalculating: boolean
  error: string | null
  selectedCurrency: string
  availableCurrencies: CurrencyOption[]
  onCurrencyChange: (currency: string) => void
  className?: string
}

// Utility functions
const formatCurrency = (amount: number, currency: string): string => {
  const currencyMap: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'JPY': '¥',
    'CAD': 'C$',
    'AUD': 'A$'
  }
  
  const symbol = currencyMap[currency] || currency
  const decimals = currency === 'JPY' ? 0 : 2
  
  return `${symbol}${amount.toLocaleString(undefined, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })}`
}

const getCategoryIcon = (category: string) => {
  const iconMap: Record<string, React.ReactNode> = {
    accommodations: <Building className="h-4 w-4" />,
    activities: <MapPin className="h-4 w-4" />,
    transportation: <Plane className="h-4 w-4" />,
    meals: <Utensils className="h-4 w-4" />,
    miscellaneous: <ShoppingBag className="h-4 w-4" />
  }
  return iconMap[category] || <DollarSign className="h-4 w-4" />
}

const getCategoryColor = (category: string): string => {
  const colorMap: Record<string, string> = {
    accommodations: 'bg-blue-500',
    activities: 'bg-green-500',
    transportation: 'bg-purple-500',
    meals: 'bg-orange-500',
    miscellaneous: 'bg-gray-500'
  }
  return colorMap[category] || 'bg-gray-500'
}

// Price Change Animation Component
const PriceChangeAnimation: React.FC<PriceChangeAnimationProps> = ({
  currentValue,
  previousValue,
  currency,
  duration = 1000
}) => {
  const [animatedValue, setAnimatedValue] = useState(previousValue || currentValue)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    if (previousValue !== undefined && previousValue !== currentValue) {
      setIsAnimating(true)
      const startTime = Date.now()
      const startValue = previousValue
      const difference = currentValue - startValue

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        
        // Easing function for smooth animation
        const easeOutCubic = 1 - Math.pow(1 - progress, 3)
        
        const newValue = startValue + (difference * easeOutCubic)
        setAnimatedValue(newValue)

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          setIsAnimating(false)
        }
      }

      requestAnimationFrame(animate)
    } else {
      setAnimatedValue(currentValue)
    }
  }, [currentValue, previousValue, duration])

  const change = previousValue !== undefined ? currentValue - previousValue : 0
  const changePercent = previousValue ? ((change / previousValue) * 100) : 0

  return (
    <div className="flex items-center gap-2">
      <span className={cn(
        "text-2xl font-bold transition-colors duration-300",
        isAnimating && "text-blue-600"
      )}>
        {formatCurrency(animatedValue, currency)}
      </span>
      
      {change !== 0 && (
        <div className={cn(
          "flex items-center gap-1 text-sm",
          change > 0 ? "text-red-600" : "text-green-600"
        )}>
          {change > 0 ? (
            <TrendingUp className="h-3 w-3" />
          ) : (
            <TrendingDown className="h-3 w-3" />
          )}
          <span>
            {change > 0 ? '+' : ''}{formatCurrency(Math.abs(change), currency)}
          </span>
          <span className="text-muted-foreground">
            ({changePercent > 0 ? '+' : ''}{changePercent.toFixed(1)}%)
          </span>
        </div>
      )}
    </div>
  )
}

// Category Breakdown Component
const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  breakdown,
  total,
  currency,
  isLoading = false
}) => {
  const categories = Object.entries(breakdown).filter(([_, amount]) => amount.amount > 0)
  
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-4 w-4 bg-gray-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
            </div>
            <div className="h-4 w-16 bg-gray-200 rounded animate-pulse" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {categories.map(([category, amount]) => {
        const percentage = total > 0 ? (amount.amount / total) * 100 : 0
        
        return (
          <div key={category} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getCategoryIcon(category)}
                <span className="text-sm font-medium capitalize">
                  {category}
                </span>
              </div>
              <span className="text-sm font-semibold">
                {formatCurrency(amount.amount, currency)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className={cn("h-2 rounded-full transition-all duration-500", getCategoryColor(category))}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground min-w-[40px]">
                {percentage.toFixed(1)}%
              </span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Pricing Comparison Component
const PricingComparison: React.FC<PricingComparisonProps> = ({
  original,
  current,
  currency
}) => {
  const totalChange = current.total.amount - original.total.amount
  const percentChange = original.total.amount > 0 ? ((totalChange / original.total.amount) * 100) : 0
  const isIncrease = totalChange > 0

  return (
    <Alert className={cn(
      "border-l-4",
      isIncrease ? "border-l-red-500 bg-red-50" : "border-l-green-50 bg-green-50"
    )}>
      <div className="flex items-center gap-2">
        {isIncrease ? (
          <TrendingUp className="h-4 w-4 text-red-600" />
        ) : (
          <TrendingDown className="h-4 w-4 text-green-600" />
        )}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              Price {isIncrease ? 'Increase' : 'Decrease'}
            </span>
            <div className="text-right">
              <div className={cn(
                "text-sm font-semibold",
                isIncrease ? "text-red-600" : "text-green-600"
              )}>
                {isIncrease ? '+' : ''}{formatCurrency(Math.abs(totalChange), currency)}
              </div>
              <div className="text-xs text-muted-foreground">
                {percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}% from original
              </div>
            </div>
          </div>
        </div>
      </div>
    </Alert>
  )
}

// Daily Breakdown Component
const DailyBreakdown: React.FC<DailyBreakdownProps> = ({
  byDay,
  currency,
  isExpanded = false,
  onToggleExpanded
}) => {
  if (byDay.length === 0) return null

  return (
    <div className="space-y-3">
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggleExpanded}
        className="flex items-center gap-2 p-0 h-auto font-medium"
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
        Daily Breakdown ({byDay.length} days)
      </Button>

      {isExpanded && (
        <div className="space-y-2 pl-4 border-l-2 border-gray-200">
          {byDay.map((day, index) => (
            <div key={day.date} className="space-y-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Day {index + 1}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(day.date).toLocaleDateString()}
                  </span>
                </div>
                <span className="text-sm font-semibold">
                  {formatCurrency(day.total.amount, currency)}
                </span>
              </div>
              
              {/* Mini category breakdown for each day */}
              <div className="flex items-center gap-1 ml-5">
                {Object.entries(day.breakdown).map(([category, amount]) => {
                  if (amount.amount === 0) return null
                  return (
                    <TooltipProvider key={category}>
                      <Tooltip>
                        <TooltipTrigger>
                          <div className={cn(
                            "h-2 w-8 rounded-full",
                            getCategoryColor(category)
                          )} />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="text-xs">
                            {category}: {formatCurrency(amount.amount, currency)}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// Main Pricing Breakdown Component
export const PricingBreakdown: React.FC<PricingBreakdownProps> = ({
  pricing,
  history,
  isCalculating,
  error,
  selectedCurrency,
  availableCurrencies,
  onCurrencyChange,
  className
}) => {
  const [showDailyBreakdown, setShowDailyBreakdown] = useState(false)
  const [previousTotal, setPreviousTotal] = useState<number | undefined>()

  // Track previous total for animation
  useEffect(() => {
    if (pricing && !isCalculating) {
      setPreviousTotal(prev => prev !== pricing.total.amount ? prev : undefined)
    }
  }, [pricing, isCalculating])

  // Update previous total after animation
  useEffect(() => {
    if (pricing && previousTotal !== undefined) {
      const timer = setTimeout(() => {
        setPreviousTotal(pricing.total.amount)
      }, 1100) // Slightly longer than animation duration
      return () => clearTimeout(timer)
    }
    return undefined
  }, [pricing, previousTotal])

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert className="border-red-200 bg-red-50">
            <Info className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">Trip Pricing</CardTitle>
            <CardDescription>
              Real-time cost breakdown and estimates
            </CardDescription>
          </div>
          
          {/* Currency Selector */}
          <Select value={selectedCurrency} onValueChange={onCurrencyChange}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableCurrencies.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  {currency.symbol} {currency.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Loading State */}
        {isCalculating && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-sm text-muted-foreground">
                Calculating pricing...
              </span>
            </div>
          </div>
        )}

        {/* Total Price with Animation */}
        {pricing && !isCalculating && (
          <>
            <div className="text-center space-y-2">
              <div className="text-sm text-muted-foreground">Total Trip Cost</div>
              <PriceChangeAnimation
                currentValue={pricing.total.amount}
                previousValue={previousTotal}
                currency={selectedCurrency}
              />
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>Updated {pricing.timestamp.toLocaleTimeString()}</span>
                {pricing.confidence && (
                  <>
                    <span>•</span>
                    <span>{(pricing.confidence * 100).toFixed(0)}% confidence</span>
                  </>
                )}
              </div>
            </div>

            <Separator />

            {/* Price Comparison */}
            {history && (
              <>
                <PricingComparison
                  original={history.original}
                  current={history.current}
                  currency={selectedCurrency}
                />
                <Separator />
              </>
            )}

            {/* Category Breakdown */}
            <div className="space-y-4">
              <h4 className="text-sm font-semibold">Cost Breakdown</h4>
              <CategoryBreakdown
                breakdown={pricing.breakdown}
                total={pricing.total.amount}
                currency={selectedCurrency}
                isLoading={isCalculating}
              />
            </div>

            <Separator />

            {/* Daily Breakdown */}
            <DailyBreakdown
              byDay={pricing.byDay}
              currency={selectedCurrency}
              isExpanded={showDailyBreakdown}
              onToggleExpanded={() => setShowDailyBreakdown(!showDailyBreakdown)}
            />
          </>
        )}

        {/* Empty State */}
        {!pricing && !isCalculating && !error && (
          <div className="text-center py-8 text-muted-foreground">
            <DollarSign className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">
              Select accommodations and activities to see pricing
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default PricingBreakdown 