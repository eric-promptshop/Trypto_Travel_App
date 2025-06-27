'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import VoiceSearchButton from '@/components/voice/VoiceSearchButton'
import VoiceInputModal from '@/components/voice/VoiceInputModal'
import { 
  Sparkles, 
  Send, 
  Loader2, 
  MapPin, 
  Calendar,
  Users,
  DollarSign,
  Heart,
  Lightbulb,
  TrendingUp,
  Clock,
  Globe,
  Plane
} from 'lucide-react'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface EnhancedItineraryBuilderProps {
  onSubmit: (query: string) => void
  isLoading?: boolean
  className?: string
}

interface Suggestion {
  id: string
  type: 'destination' | 'activity' | 'duration' | 'budget' | 'style'
  label: string
  icon: React.ElementType
  value: string
  trending?: boolean
}

interface RecentSearch {
  id: string
  query: string
  timestamp: Date
  destination?: string
}

export default function EnhancedItineraryBuilder({
  onSubmit,
  isLoading = false,
  className
}: EnhancedItineraryBuilderProps) {
  const [query, setQuery] = useState('')
  const [showVoiceModal, setShowVoiceModal] = useState(false)
  const [activeTab, setActiveTab] = useState('type')
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([])
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([])
  const [interimVoiceText, setInterimVoiceText] = useState('')
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('recentTravelSearches')
    if (saved) {
      setRecentSearches(JSON.parse(saved))
    }
  }, [])

  const suggestions: Suggestion[] = [
    // Destinations
    { id: 'd1', type: 'destination', label: 'Paris, France', icon: MapPin, value: 'Paris', trending: true },
    { id: 'd2', type: 'destination', label: 'Tokyo, Japan', icon: MapPin, value: 'Tokyo' },
    { id: 'd3', type: 'destination', label: 'Bali, Indonesia', icon: MapPin, value: 'Bali', trending: true },
    { id: 'd4', type: 'destination', label: 'New York, USA', icon: MapPin, value: 'New York' },
    { id: 'd5', type: 'destination', label: 'Santorini, Greece', icon: MapPin, value: 'Santorini' },
    
    // Activities
    { id: 'a1', type: 'activity', label: 'Beach & Relaxation', icon: Heart, value: 'beach relaxation' },
    { id: 'a2', type: 'activity', label: 'Adventure & Hiking', icon: TrendingUp, value: 'adventure hiking' },
    { id: 'a3', type: 'activity', label: 'Cultural Exploration', icon: Globe, value: 'cultural exploration' },
    { id: 'a4', type: 'activity', label: 'Food & Wine', icon: Heart, value: 'food wine tasting' },
    { id: 'a5', type: 'activity', label: 'City Tours', icon: MapPin, value: 'city tours sightseeing' },
    
    // Duration
    { id: 'dur1', type: 'duration', label: 'Weekend (2-3 days)', icon: Clock, value: 'weekend trip' },
    { id: 'dur2', type: 'duration', label: 'Week (5-7 days)', icon: Calendar, value: 'week long trip' },
    { id: 'dur3', type: 'duration', label: '10-14 days', icon: Calendar, value: '10 to 14 days' },
    
    // Budget
    { id: 'b1', type: 'budget', label: 'Budget-friendly', icon: DollarSign, value: 'budget travel' },
    { id: 'b2', type: 'budget', label: 'Mid-range', icon: DollarSign, value: 'mid-range budget' },
    { id: 'b3', type: 'budget', label: 'Luxury', icon: DollarSign, value: 'luxury travel' },
    
    // Travel Style
    { id: 's1', type: 'style', label: 'Family-friendly', icon: Users, value: 'family with kids' },
    { id: 's2', type: 'style', label: 'Romantic', icon: Heart, value: 'romantic couple' },
    { id: 's3', type: 'style', label: 'Solo Travel', icon: Users, value: 'solo traveler' },
    { id: 's4', type: 'style', label: 'Group/Friends', icon: Users, value: 'group of friends' }
  ]

  const handleSubmit = () => {
    if (!query.trim() && selectedSuggestions.length === 0) {
      toast.error('Please describe your trip or select some options')
      return
    }

    const fullQuery = buildFullQuery()
    
    // Save to recent searches
    const newSearch: RecentSearch = {
      id: Date.now().toString(),
      query: fullQuery,
      timestamp: new Date(),
      destination: extractDestination(fullQuery)
    }
    
    const updated = [newSearch, ...recentSearches.slice(0, 4)]
    setRecentSearches(updated)
    localStorage.setItem('recentTravelSearches', JSON.stringify(updated))
    
    onSubmit(fullQuery)
  }

  const buildFullQuery = () => {
    const parts = []
    
    // Add manual query
    if (query.trim()) {
      parts.push(query.trim())
    }
    
    // Add selected suggestions
    const suggestionTexts = selectedSuggestions
      .map(id => suggestions.find(s => s.id === id)?.value)
      .filter(Boolean)
    
    if (suggestionTexts.length > 0) {
      parts.push(suggestionTexts.join(', '))
    }
    
    return parts.join('. ')
  }

  const extractDestination = (text: string): string | undefined => {
    const destinations = suggestions
      .filter(s => s.type === 'destination')
      .map(s => s.value)
    
    for (const dest of destinations) {
      if (text.toLowerCase().includes(dest.toLowerCase())) {
        return dest
      }
    }
    
    return undefined
  }

  const toggleSuggestion = (id: string) => {
    setSelectedSuggestions(prev =>
      prev.includes(id)
        ? prev.filter(s => s !== id)
        : [...prev, id]
    )
  }

  const handleVoiceInput = (transcript: string) => {
    setQuery(transcript)
    textareaRef.current?.focus()
  }

  const handleRecentSearch = (search: RecentSearch) => {
    setQuery(search.query)
    textareaRef.current?.focus()
  }

  const groupedSuggestions = {
    destination: suggestions.filter(s => s.type === 'destination'),
    activity: suggestions.filter(s => s.type === 'activity'),
    duration: suggestions.filter(s => s.type === 'duration'),
    budget: suggestions.filter(s => s.type === 'budget'),
    style: suggestions.filter(s => s.type === 'style')
  }

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          AI Travel Planner
        </CardTitle>
        <CardDescription>
          Describe your dream trip or use voice input for a personalized itinerary
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main Input Area */}
        <div className="relative">
          <Textarea
            ref={textareaRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tell me about your ideal trip... (e.g., 'I want a romantic 5-day trip to Paris with wine tasting')"
            className="min-h-[100px] pr-12 resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.metaKey) {
                handleSubmit()
              }
            }}
          />
          
          {/* Voice Input Indicator */}
          {interimVoiceText && (
            <div className="absolute bottom-2 left-2 right-2 text-sm text-muted-foreground italic">
              {interimVoiceText}
            </div>
          )}
          
          {/* Voice Button */}
          <div className="absolute top-2 right-2">
            <VoiceSearchButton
              onTranscript={handleVoiceInput}
              onInterimTranscript={setInterimVoiceText}
              size="sm"
              variant="ghost"
            />
          </div>
        </div>

        {/* Smart Suggestions */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="type">
              <MapPin className="w-4 h-4 mr-1" />
              Where
            </TabsTrigger>
            <TabsTrigger value="activity">
              <Heart className="w-4 h-4 mr-1" />
              What
            </TabsTrigger>
            <TabsTrigger value="duration">
              <Clock className="w-4 h-4 mr-1" />
              When
            </TabsTrigger>
            <TabsTrigger value="budget">
              <DollarSign className="w-4 h-4 mr-1" />
              Budget
            </TabsTrigger>
            <TabsTrigger value="style">
              <Users className="w-4 h-4 mr-1" />
              Style
            </TabsTrigger>
          </TabsList>

          <TabsContent value="type" className="space-y-3">
            <p className="text-sm text-muted-foreground">Popular destinations</p>
            <div className="flex flex-wrap gap-2">
              {groupedSuggestions.destination.map(suggestion => {
                const Icon = suggestion.icon
                return (
                  <Badge
                    key={suggestion.id}
                    variant={selectedSuggestions.includes(suggestion.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSuggestion(suggestion.id)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {suggestion.label}
                    {suggestion.trending && (
                      <TrendingUp className="w-3 h-3 ml-1 text-green-500" />
                    )}
                  </Badge>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="activity" className="space-y-3">
            <p className="text-sm text-muted-foreground">What kind of experience?</p>
            <div className="flex flex-wrap gap-2">
              {groupedSuggestions.activity.map(suggestion => {
                const Icon = suggestion.icon
                return (
                  <Badge
                    key={suggestion.id}
                    variant={selectedSuggestions.includes(suggestion.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSuggestion(suggestion.id)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {suggestion.label}
                  </Badge>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="duration" className="space-y-3">
            <p className="text-sm text-muted-foreground">How long is your trip?</p>
            <div className="flex flex-wrap gap-2">
              {groupedSuggestions.duration.map(suggestion => {
                const Icon = suggestion.icon
                return (
                  <Badge
                    key={suggestion.id}
                    variant={selectedSuggestions.includes(suggestion.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSuggestion(suggestion.id)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {suggestion.label}
                  </Badge>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="budget" className="space-y-3">
            <p className="text-sm text-muted-foreground">What's your budget range?</p>
            <div className="flex flex-wrap gap-2">
              {groupedSuggestions.budget.map(suggestion => {
                const Icon = suggestion.icon
                return (
                  <Badge
                    key={suggestion.id}
                    variant={selectedSuggestions.includes(suggestion.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSuggestion(suggestion.id)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {suggestion.label}
                  </Badge>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="style" className="space-y-3">
            <p className="text-sm text-muted-foreground">Travel style</p>
            <div className="flex flex-wrap gap-2">
              {groupedSuggestions.style.map(suggestion => {
                const Icon = suggestion.icon
                return (
                  <Badge
                    key={suggestion.id}
                    variant={selectedSuggestions.includes(suggestion.id) ? 'default' : 'outline'}
                    className="cursor-pointer transition-all hover:scale-105"
                    onClick={() => toggleSuggestion(suggestion.id)}
                  >
                    <Icon className="w-3 h-3 mr-1" />
                    {suggestion.label}
                  </Badge>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>

        {/* Recent Searches */}
        {recentSearches.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Recent searches
            </p>
            <div className="space-y-1">
              {recentSearches.map(search => (
                <button
                  key={search.id}
                  className="w-full text-left p-2 rounded-lg hover:bg-muted transition-colors text-sm"
                  onClick={() => handleRecentSearch(search)}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate flex-1">
                      {search.destination && (
                        <Plane className="w-3 h-3 inline mr-1" />
                      )}
                      {search.query}
                    </span>
                    <span className="text-xs text-muted-foreground ml-2">
                      {new Date(search.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            onClick={handleSubmit}
            disabled={isLoading || (!query.trim() && selectedSuggestions.length === 0)}
            className="flex-1"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4 mr-2" />
                Generate Itinerary
              </>
            )}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowVoiceModal(true)}
            disabled={isLoading}
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Voice Assistant
          </Button>
        </div>

        {/* Voice Input Modal */}
        <VoiceInputModal
          isOpen={showVoiceModal}
          onClose={() => setShowVoiceModal(false)}
          onTranscript={(transcript) => {
            setQuery(transcript)
            handleSubmit()
          }}
        />
      </CardContent>
    </Card>
  )
}