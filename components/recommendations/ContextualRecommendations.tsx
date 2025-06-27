'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Skeleton } from '@/components/ui/skeleton'
import { 
  MapPin, 
  Activity, 
  Calendar,
  DollarSign,
  Info,
  AlertCircle,
  TrendingUp,
  Sparkles,
  ChevronRight,
  Star,
  Clock,
  Users,
  Heart,
  RefreshCw
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { RecommendationEngine, type Recommendation, type UserContext } from '@/lib/services/recommendation-engine'
import { toast } from 'sonner'

interface ContextualRecommendationsProps {
  userContext: UserContext
  onAction?: (recommendation: Recommendation) => void
  className?: string
  compact?: boolean
}

export default function ContextualRecommendations({
  userContext,
  onAction,
  className,
  compact = false
}: ContextualRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedType, setSelectedType] = useState<string | null>(null)

  useEffect(() => {
    loadRecommendations()
  }, [userContext])

  const loadRecommendations = async () => {
    setLoading(true)
    try {
      const engine = new RecommendationEngine(userContext)
      const recs = await engine.getRecommendations(compact ? 5 : 15)
      setRecommendations(recs)
    } catch (error) {
      console.error('Error loading recommendations:', error)
      toast.error('Failed to load recommendations')
    } finally {
      setLoading(false)
    }
  }

  const handleAction = (recommendation: Recommendation) => {
    if (onAction) {
      onAction(recommendation)
    } else if (recommendation.action) {
      // Default action handling
      switch (recommendation.action.type) {
        case 'search':
          // Trigger search with the value
          window.location.href = `/search?q=${encodeURIComponent(recommendation.action.value)}`
          break
        case 'link':
          // Navigate to link
          window.location.href = recommendation.action.value
          break
        case 'add':
          // Add to current itinerary
          toast.success(`Added ${recommendation.title} to your itinerary`)
          break
      }
    }
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'destination': return MapPin
      case 'activity': return Activity
      case 'tour': return Users
      case 'tip': return Info
      case 'warning': return AlertCircle
      default: return Sparkles
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'destination': return 'bg-blue-500'
      case 'activity': return 'bg-green-500'
      case 'tour': return 'bg-purple-500'
      case 'tip': return 'bg-yellow-500'
      case 'warning': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const filteredRecommendations = selectedType
    ? recommendations.filter(r => r.type === selectedType)
    : recommendations

  const types = Array.from(new Set(recommendations.map(r => r.type)))

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            Personalized Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  if (recommendations.length === 0) {
    return null
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5" />
            For You
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={loadRecommendations}
            className="h-8 w-8"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        {!compact && (
          <CardDescription>
            Personalized suggestions based on your preferences and context
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {!compact && types.length > 1 && (
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            <Badge
              variant={selectedType === null ? 'default' : 'outline'}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => setSelectedType(null)}
            >
              All ({recommendations.length})
            </Badge>
            {types.map(type => {
              const count = recommendations.filter(r => r.type === type).length
              return (
                <Badge
                  key={type}
                  variant={selectedType === type ? 'default' : 'outline'}
                  className="cursor-pointer whitespace-nowrap"
                  onClick={() => setSelectedType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)} ({count})
                </Badge>
              )
            })}
          </div>
        )}

        <ScrollArea className={compact ? 'h-[300px]' : 'h-[500px]'}>
          <div className="space-y-3 pr-4">
            <AnimatePresence mode="popLayout">
              {filteredRecommendations.map((recommendation, index) => {
                const Icon = getIcon(recommendation.type)
                const typeColor = getTypeColor(recommendation.type)
                
                return (
                  <motion.div
                    key={recommendation.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card 
                      className={cn(
                        'cursor-pointer transition-all hover:shadow-md',
                        recommendation.type === 'warning' && 'border-red-500'
                      )}
                      onClick={() => handleAction(recommendation)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start gap-3">
                          <div className={cn(
                            'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                            typeColor,
                            'text-white'
                          )}>
                            <Icon className="w-5 h-5" />
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className="font-medium text-sm line-clamp-1">
                                {recommendation.title}
                              </h4>
                              {recommendation.relevanceScore > 0.8 && (
                                <Badge variant="secondary" className="flex-shrink-0">
                                  <TrendingUp className="w-3 h-3 mr-1" />
                                  Hot
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {recommendation.description}
                            </p>
                            
                            <div className="flex items-center justify-between mt-2">
                              <span className="text-xs text-muted-foreground">
                                {recommendation.reason}
                              </span>
                              
                              {recommendation.action && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 px-2 text-xs"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    handleAction(recommendation)
                                  }}
                                >
                                  {recommendation.action.label}
                                  <ChevronRight className="w-3 h-3 ml-1" />
                                </Button>
                              )}
                            </div>

                            {/* Additional data display */}
                            {recommendation.data && (
                              <div className="flex gap-3 mt-2">
                                {recommendation.data.rating && (
                                  <span className="text-xs flex items-center gap-1">
                                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    {recommendation.data.rating}
                                  </span>
                                )}
                                {recommendation.data.price && (
                                  <span className="text-xs flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" />
                                    {recommendation.data.price}
                                  </span>
                                )}
                                {recommendation.data.duration && (
                                  <span className="text-xs flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {recommendation.data.duration}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>
        </ScrollArea>

        {!compact && recommendations.length > 10 && (
          <div className="mt-4 text-center">
            <Button variant="outline" size="sm">
              Load More Recommendations
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}