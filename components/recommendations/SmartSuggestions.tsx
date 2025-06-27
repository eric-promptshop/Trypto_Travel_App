'use client'

import { useState, useEffect } from 'react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Sparkles,
  TrendingUp,
  Clock,
  MapPin,
  Calendar,
  Users,
  DollarSign,
  Sun,
  Cloud,
  Umbrella,
  Snowflake
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface SmartSuggestionsProps {
  query: string
  onSuggestionClick: (suggestion: string) => void
  className?: string
}

interface Suggestion {
  id: string
  text: string
  type: 'completion' | 'related' | 'trending' | 'seasonal'
  icon?: React.ElementType
  confidence?: number
}

export default function SmartSuggestions({
  query,
  onSuggestionClick,
  className
}: SmartSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([])
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (query.length > 2) {
      generateSuggestions(query)
      setIsVisible(true)
    } else {
      setIsVisible(false)
    }
  }, [query])

  const generateSuggestions = (input: string) => {
    const newSuggestions: Suggestion[] = []
    const lowerInput = input.toLowerCase()

    // Query completions
    if (lowerInput.includes('paris')) {
      newSuggestions.push(
        { id: 'c1', text: 'Paris for 5 days with museums and cafes', type: 'completion', icon: MapPin },
        { id: 'c2', text: 'Paris romantic getaway for couples', type: 'completion', icon: MapPin }
      )
    }

    if (lowerInput.includes('beach')) {
      newSuggestions.push(
        { id: 'c3', text: 'beach vacation in the Caribbean', type: 'completion', icon: Sun },
        { id: 'c4', text: 'beach resort with all-inclusive package', type: 'completion', icon: Sun }
      )
    }

    if (lowerInput.includes('family')) {
      newSuggestions.push(
        { id: 'c5', text: 'family trip to Disney World Orlando', type: 'completion', icon: Users },
        { id: 'c6', text: 'family-friendly destinations in Europe', type: 'completion', icon: Users }
      )
    }

    // Add duration suggestions if not specified
    if (!lowerInput.match(/\d+\s*(day|week|night)/)) {
      newSuggestions.push(
        { id: 'd1', text: `${input} for 5 days`, type: 'related', icon: Calendar },
        { id: 'd2', text: `${input} for a week`, type: 'related', icon: Calendar }
      )
    }

    // Add budget suggestions if not specified
    if (!lowerInput.includes('budget') && !lowerInput.includes('luxury')) {
      newSuggestions.push(
        { id: 'b1', text: `${input} on a budget`, type: 'related', icon: DollarSign },
        { id: 'b2', text: `luxury ${input}`, type: 'related', icon: DollarSign }
      )
    }

    // Seasonal suggestions
    const month = new Date().getMonth()
    if (month >= 11 || month <= 2) {
      // Winter
      newSuggestions.push(
        { id: 's1', text: 'Northern Lights in Iceland', type: 'seasonal', icon: Snowflake },
        { id: 's2', text: 'Ski trip to Swiss Alps', type: 'seasonal', icon: Snowflake }
      )
    } else if (month >= 3 && month <= 5) {
      // Spring
      newSuggestions.push(
        { id: 's3', text: 'Cherry blossoms in Japan', type: 'seasonal', icon: Cloud },
        { id: 's4', text: 'Tulip season in Netherlands', type: 'seasonal', icon: Cloud }
      )
    } else if (month >= 6 && month <= 8) {
      // Summer
      newSuggestions.push(
        { id: 's5', text: 'Greek islands hopping', type: 'seasonal', icon: Sun },
        { id: 's6', text: 'Road trip through California', type: 'seasonal', icon: Sun }
      )
    } else {
      // Fall
      newSuggestions.push(
        { id: 's7', text: 'Fall foliage in New England', type: 'seasonal', icon: Umbrella },
        { id: 's8', text: 'Oktoberfest in Munich', type: 'seasonal', icon: Umbrella }
      )
    }

    // Trending destinations
    newSuggestions.push(
      { id: 't1', text: 'Portugal coastal road trip', type: 'trending', icon: TrendingUp },
      { id: 't2', text: 'Dubai luxury experience', type: 'trending', icon: TrendingUp }
    )

    // Limit suggestions and sort by relevance
    setSuggestions(newSuggestions.slice(0, 6))
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'completion': return 'bg-blue-100 text-blue-700 hover:bg-blue-200'
      case 'related': return 'bg-purple-100 text-purple-700 hover:bg-purple-200'
      case 'trending': return 'bg-green-100 text-green-700 hover:bg-green-200'
      case 'seasonal': return 'bg-orange-100 text-orange-700 hover:bg-orange-200'
      default: return 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }
  }

  if (!isVisible || suggestions.length === 0) {
    return null
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className={cn('space-y-2', className)}
      >
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Sparkles className="w-4 h-4" />
          <span>Suggestions</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {suggestions.map((suggestion, index) => {
            const Icon = suggestion.icon
            return (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
              >
                <Badge
                  variant="outline"
                  className={cn(
                    'cursor-pointer transition-all px-3 py-1.5',
                    getTypeColor(suggestion.type)
                  )}
                  onClick={() => onSuggestionClick(suggestion.text)}
                >
                  {Icon && <Icon className="w-3 h-3 mr-1.5" />}
                  {suggestion.text}
                  {suggestion.type === 'trending' && (
                    <TrendingUp className="w-3 h-3 ml-1.5" />
                  )}
                </Badge>
              </motion.div>
            )
          })}
        </div>

        <div className="flex items-center gap-2 pt-2">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs"
            onClick={() => setIsVisible(false)}
          >
            Hide suggestions
          </Button>
          <span className="text-xs text-muted-foreground">
            Press Tab to accept top suggestion
          </span>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}