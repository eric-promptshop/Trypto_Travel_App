"use client"

import * as React from "react"
import { useState } from "react"
import { 
  History, 
  Plus, 
  Minus, 
  Edit3, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  RotateCcw,
  Eye,
  EyeOff
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { PricingHistory, PricingUpdate, CurrencyOption } from "./pricing-service"

// Types
interface PricingHistoryTrackerProps {
  history: PricingHistory | null
  currentPricing: PricingUpdate | null
  selectedCurrency: string
  onResetHistory?: () => void
  className?: string
}

interface ChangeItemProps {
  change: PricingHistory['changes'][0]
  currency: string
  isLatest?: boolean
}

interface PricingSummaryProps {
  original: PricingUpdate
  current: PricingUpdate
  currency: string
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

const formatTimeAgo = (timestamp: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - timestamp.getTime()
  const diffMinutes = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMinutes / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

const getChangeIcon = (changeType: string) => {
  const iconMap = {
    'add': <Plus className="h-3 w-3" />,
    'remove': <Minus className="h-3 w-3" />,
    'modify': <Edit3 className="h-3 w-3" />
  }
  return iconMap[changeType as keyof typeof iconMap] || <Edit3 className="h-3 w-3" />
}

const getComponentColor = (component: string): string => {
  const colorMap = {
    'accommodation': 'bg-blue-100 text-blue-800',
    'activity': 'bg-green-100 text-green-800',
    'transportation': 'bg-purple-100 text-purple-800'
  }
  return colorMap[component as keyof typeof colorMap] || 'bg-gray-100 text-gray-800'
}

// Change Item Component
const ChangeItem: React.FC<ChangeItemProps> = ({ change, currency, isLatest = false }) => {
  const isIncrease = change.priceDifference.amount > 0
  const changeTypeColors = {
    'add': 'border-green-200 bg-green-50',
    'remove': 'border-red-200 bg-red-50',
    'modify': 'border-blue-200 bg-blue-50'
  }

  return (
    <div className={cn(
      "p-3 rounded-lg border-l-4 space-y-2",
      changeTypeColors[change.changeType],
      isLatest && "ring-2 ring-blue-500 ring-opacity-30"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getChangeIcon(change.changeType)}
          <div>
            <div className="text-sm font-medium">
              {change.changeType === 'add' ? 'Added' : 
               change.changeType === 'remove' ? 'Removed' : 'Modified'} {change.componentName}
            </div>
            <div className="text-xs text-muted-foreground">
              {formatTimeAgo(change.timestamp)}
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <Badge variant="outline" className={getComponentColor(change.component)}>
            {change.component}
          </Badge>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm">
          {isIncrease ? (
            <TrendingUp className="h-3 w-3 text-red-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-green-500" />
          )}
          <span className={cn(
            "font-medium",
            isIncrease ? "text-red-600" : "text-green-600"
          )}>
            {isIncrease ? '+' : ''}{formatCurrency(Math.abs(change.priceDifference.amount), currency)}
          </span>
        </div>
        
        <div className="text-xs text-muted-foreground">
          Total: {formatCurrency(change.newTotal.amount, currency)}
        </div>
      </div>
    </div>
  )
}

// Pricing Summary Component
const PricingSummary: React.FC<PricingSummaryProps> = ({ original, current, currency }) => {
  const totalChange = current.total.amount - original.total.amount
  const percentChange = original.total.amount > 0 ? ((totalChange / original.total.amount) * 100) : 0
  const isIncrease = totalChange > 0

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Original Price</div>
          <div className="text-lg font-semibold">
            {formatCurrency(original.total.amount, currency)}
          </div>
        </div>
        
        <div className="text-center p-3 bg-gray-50 rounded-lg">
          <div className="text-xs text-muted-foreground mb-1">Current Price</div>
          <div className="text-lg font-semibold">
            {formatCurrency(current.total.amount, currency)}
          </div>
        </div>
      </div>

      <div className={cn(
        "text-center p-3 rounded-lg border",
        isIncrease ? "border-red-200 bg-red-50" : "border-green-200 bg-green-50"
      )}>
        <div className="flex items-center justify-center gap-2">
          {isIncrease ? (
            <TrendingUp className="h-4 w-4 text-red-600" />
          ) : (
            <TrendingDown className="h-4 w-4 text-green-600" />
          )}
          <div className={cn(
            "font-semibold",
            isIncrease ? "text-red-600" : "text-green-600"
          )}>
            {isIncrease ? '+' : ''}{formatCurrency(Math.abs(totalChange), currency)}
          </div>
          <div className="text-sm text-muted-foreground">
            ({percentChange > 0 ? '+' : ''}{percentChange.toFixed(1)}%)
          </div>
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          {isIncrease ? 'Price increase' : 'Price savings'} from original
        </div>
      </div>
    </div>
  )
}

// Main Pricing History Tracker Component
export const PricingHistoryTracker: React.FC<PricingHistoryTrackerProps> = ({
  history,
  currentPricing,
  selectedCurrency,
  onResetHistory,
  className
}) => {
  const [isExpanded, setIsExpanded] = useState(true)

  if (!history || !currentPricing) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p className="text-sm">
              Make changes to your trip to see pricing history
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const sortedChanges = [...history.changes].sort((a, b) => 
    b.timestamp.getTime() - a.timestamp.getTime()
  )

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <History className="h-5 w-5" />
              Pricing History
            </CardTitle>
            <CardDescription>
              Track changes to your trip costs over time
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  {isExpanded ? 'Collapse history' : 'Expand history'}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            {onResetHistory && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onResetHistory}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    Reset pricing history
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Pricing Summary */}
        <PricingSummary
          original={history.original}
          current={history.current}
          currency={selectedCurrency}
        />

        {isExpanded && (
          <>
            <Separator />
            
            {/* Changes Timeline */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold">Recent Changes</h4>
                <Badge variant="secondary" className="text-xs">
                  {sortedChanges.length} {sortedChanges.length === 1 ? 'change' : 'changes'}
                </Badge>
              </div>

              {sortedChanges.length > 0 ? (
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {sortedChanges.map((change, index) => (
                      <ChangeItem
                        key={`${change.timestamp.getTime()}-${index}`}
                        change={change}
                        currency={selectedCurrency}
                        isLatest={index === 0}
                      />
                    ))}
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p className="text-sm">No changes recorded yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default PricingHistoryTracker 