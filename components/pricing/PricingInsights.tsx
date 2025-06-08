"use client"

import { useState, useEffect } from 'react'
import { pricingEngine, type BudgetOptimization, type MarketData } from '@/lib/pricing/pricing-engine'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  AlertTriangle, 
  Lightbulb, 
  Calendar,
  Users,
  Target,
  Sparkles,
  Info,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface PricingInsightsProps {
  tripData: {
    destination: string
    startDate: string
    endDate: string
    groupSize: number
    targetBudget?: number
  }
  activities: Array<{
    id: string
    title: string
    type: string
    basePrice: number
    currentPrice?: number
  }>
  onActivityUpdate?: (activityId: string, newPrice: number) => void
  className?: string
}

export function PricingInsights({ 
  tripData, 
  activities, 
  onActivityUpdate,
  className = ""
}: PricingInsightsProps) {
  const [pricingData, setPricingData] = useState<any>(null)
  const [budgetOptimization, setBudgetOptimization] = useState<BudgetOptimization | null>(null)
  const [marketData, setMarketData] = useState<MarketData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showOptimizations, setShowOptimizations] = useState(false)

  useEffect(() => {
    const calculatePricing = async () => {
      setIsLoading(true)
      try {
        // Calculate real-time pricing
        const pricing = await pricingEngine.calculateTripPricing({
          ...tripData,
          activities: activities.map(a => ({
            id: a.id,
            basePrice: a.basePrice,
            type: a.type,
            title: a.title
          }))
        })

        setPricingData(pricing)

        // Calculate budget optimization
        const optimization = pricingEngine.optimizeBudget(
          activities.map(a => ({
            id: a.id,
            price: a.currentPrice || a.basePrice,
            type: a.type,
            title: a.title
          })),
          tripData.targetBudget,
          tripData.groupSize
        )

                 setBudgetOptimization(optimization)

        // Get market data for main activity types
        const uniqueTypes = [...new Set(activities.map(a => a.type))]
        if (uniqueTypes.length > 0 && tripData.destination && tripData.startDate && tripData.endDate) {
          const market = await pricingEngine.getMarketData(
            tripData.destination as string,
            uniqueTypes[0] as string,
            { start: tripData.startDate as string, end: tripData.endDate as string }
          )
          setMarketData(market)
        }

      } catch (error) {
        console.error('Error calculating pricing:', error)
      } finally {
        setIsLoading(false)
      }
    }

    if (activities.length > 0) {
      calculatePricing()
    }
  }, [tripData, activities])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="h-4 w-4 text-red-500" />
      case 'down': return <TrendingDown className="h-4 w-4 text-green-500" />
      default: return <Minus className="h-4 w-4 text-gray-500" />
    }
  }

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'up': return 'text-red-600 bg-red-50'
      case 'down': return 'text-green-600 bg-green-50'
      default: return 'text-gray-600 bg-gray-50'
    }
  }

  if (isLoading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card>
          <CardHeader>
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-3">
              <div className="h-8 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Main Pricing Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Trip Pricing Summary
              </CardTitle>
              <CardDescription>
                Real-time pricing based on current market conditions
              </CardDescription>
            </div>
            {pricingData?.totals.totalSavings > 0 && (
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                <Sparkles className="h-3 w-3 mr-1" />
                {formatCurrency(pricingData.totals.totalSavings)} saved
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {pricingData && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(pricingData.totals.currentPrice)}
                  </p>
                  <p className="text-sm text-gray-600">Total Cost</p>
                </div>
                
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(pricingData.totals.perPersonPrice)}
                  </p>
                  <p className="text-sm text-gray-600">Per Person</p>
                </div>

                {pricingData.totals.originalPrice !== pricingData.totals.currentPrice && (
                  <div className="text-center">
                    <p className="text-lg text-gray-500 line-through">
                      {formatCurrency(pricingData.totals.originalPrice)}
                    </p>
                    <p className="text-sm text-green-600">Original Price</p>
                  </div>
                )}

                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Live Pricing</span>
                  </div>
                </div>
              </div>

              {/* Pricing Factors */}
              <Separator />
              <div className="space-y-2">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Pricing Factors
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <Badge variant="outline" className="justify-center">
                    {pricingData.priceFactors.season} season
                  </Badge>
                  <Badge variant="outline" className="justify-center">
                    {pricingData.priceFactors.dayOfWeek}
                  </Badge>
                  <Badge variant="outline" className="justify-center">
                    {pricingData.priceFactors.demandLevel} demand
                  </Badge>
                </div>
              </div>

              {/* Recommendations */}
              {pricingData.recommendations && pricingData.recommendations.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Lightbulb className="h-4 w-4" />
                      Pricing Tips
                    </h4>
                    <ul className="space-y-1 text-sm text-gray-600">
                      {pricingData.recommendations.map((rec: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <span className="text-blue-500 mt-1">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Budget Analysis */}
      {budgetOptimization && tripData.targetBudget && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Budget Analysis
            </CardTitle>
            <CardDescription>
              Track your spending against your target budget
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Budget Progress</span>
                <span>
                  {formatCurrency(budgetOptimization.currentTotal)} / {formatCurrency(tripData.targetBudget)}
                </span>
              </div>
              <Progress 
                value={Math.min((budgetOptimization.currentTotal / tripData.targetBudget) * 100, 100)}
                className={budgetOptimization.isOverBudget ? "bg-red-100" : "bg-green-100"}
              />
              {budgetOptimization.isOverBudget && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    You're {formatCurrency(budgetOptimization.overageAmount)} over budget
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {budgetOptimization.suggestions.length > 0 && (
              <div className="space-y-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowOptimizations(!showOptimizations)}
                  className="w-full"
                >
                  {showOptimizations ? 'Hide' : 'Show'} Budget Optimization Suggestions
                </Button>

                <AnimatePresence>
                  {showOptimizations && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2"
                    >
                      {budgetOptimization.suggestions.slice(0, 3).map((suggestion, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-3 bg-blue-50 rounded-lg border border-blue-200"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h5 className="font-medium text-blue-900">{suggestion.title}</h5>
                              <p className="text-sm text-blue-700 mt-1">{suggestion.description}</p>
                            </div>
                            <div className="text-right ml-3">
                              <p className="text-sm font-medium text-green-600">
                                Save {formatCurrency(suggestion.potentialSavings)}
                              </p>
                              <Badge 
                                variant={suggestion.impact === 'high' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {suggestion.impact} impact
                              </Badge>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Market Insights */}
      {marketData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Market Insights
            </CardTitle>
            <CardDescription>
              Current market trends for {tripData.destination}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="text-center">
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(marketData.averagePrice)}
                </p>
                <p className="text-sm text-gray-600">Market Average</p>
              </div>
              
              <div className="text-center">
                <p className="text-sm text-gray-600">Price Range</p>
                <p className="font-medium">
                  {formatCurrency(marketData.priceRange.min)} - {formatCurrency(marketData.priceRange.max)}
                </p>
              </div>

              <div className="text-center">
                <div className="flex items-center justify-center gap-1">
                  {getTrendIcon(marketData.trending)}
                  <span className={`text-sm px-2 py-1 rounded ${getTrendColor(marketData.trending)}`}>
                    {marketData.trending === 'up' ? 'Rising' : 
                     marketData.trending === 'down' ? 'Falling' : 'Stable'}
                  </span>
                </div>
              </div>
            </div>

            {marketData.recommendations.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900">Market Recommendations</h4>
                  <ul className="space-y-1 text-sm text-gray-600">
                    {marketData.recommendations.slice(0, 3).map((rec, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <span className="text-blue-500 mt-1">•</span>
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      {/* Price History Trend (Mock) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Price Monitoring
          </CardTitle>
          <CardDescription>
            Track price changes for your trip
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="h-12 w-12 mx-auto mb-2 text-gray-300" />
            <p>Price tracking will appear here</p>
            <p className="text-sm">We'll monitor prices and notify you of changes</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 