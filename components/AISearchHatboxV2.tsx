"use client"

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Search,
  Mic,
  X,
  Sparkles,
  Send,
  Loader2,
  MapPin,
  Calendar,
  DollarSign,
  Users,
  Clock,
  Star,
  Plus,
  ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePlanStore } from '@/store/planStore'
import { useDebounce } from '@/hooks/useDebounce'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'
import Image from 'next/image'
import styles from './AISearchHatboxV2.module.css'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  tips?: { emoji: string; text: string }[]
  recommendations?: RecommendationItem[]
}

interface RecommendationItem {
  id: string
  type: 'place' | 'event'
  name: string
  description: string
  openingHours?: string
  price?: string
  priceLevel?: number
  rating?: number
  imageUrl?: string
  location?: {
    lat: number
    lng: number
    address?: string
  }
  category?: string
}

interface QuickReplyChip {
  text: string
  icon?: React.ReactNode
}

const STORAGE_KEY = 'tripnav-ai-chat-history'
const MAX_STORED_MESSAGES = 15

// Recommendation Card Component
function RecommendationCard({ 
  item, 
  onAdd 
}: { 
  item: RecommendationItem
  onAdd: () => void 
}) {
  const [isAdding, setIsAdding] = useState(false)
  
  const handleAdd = async () => {
    setIsAdding(true)
    await onAdd()
    setIsAdding(false)
  }
  
  return (
    <Card className="p-3 hover:shadow-md transition-shadow">
      <div className="grid grid-cols-[64px_1fr] gap-3">
        {/* Thumbnail */}
        <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-gray-100">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="64px"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <MapPin className="h-6 w-6 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="min-w-0">
          <h4 className="font-semibold text-sm line-clamp-1 mb-1">{item.name}</h4>
          
          {/* Meta info */}
          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-600 mb-2">
            {item.openingHours && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {item.openingHours}
              </span>
            )}
            
            {item.price && (
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {item.price}
              </span>
            )}
            
            {item.rating && (
              <span className="flex items-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                {item.rating.toFixed(1)}
              </span>
            )}
          </div>
          
          {/* Description */}
          <p className="text-xs text-gray-600 line-clamp-2 mb-2">
            {item.description.length > 80 
              ? item.description.substring(0, 80) + '…'
              : item.description
            }
          </p>
          
          {/* Add button */}
          <Button
            size="sm"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            onClick={handleAdd}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <>
                <Plus className="h-3 w-3 mr-1" />
                Add to Itinerary
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  )
}

export function AISearchHatboxV2() {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [quickReplies, setQuickReplies] = useState<QuickReplyChip[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)
  const { itinerary, searchPoisByQuery, addPoiToDay, getSelectedDay } = usePlanStore()

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Load chat history on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setMessages(parsed.slice(-MAX_STORED_MESSAGES))
      } catch (e) {
        console.error('Failed to load chat history:', e)
      }
    }
  }, [])

  // Save chat history
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_STORED_MESSAGES)))
    }
  }, [messages])

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExpanded) {
        setIsExpanded(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExpanded])

  // Generate contextual quick replies
  const generateQuickReplies = useCallback((destination: string, messageContent?: string) => {
    const baseReplies: QuickReplyChip[] = [
      { text: "Hidden gems", icon: <Sparkles className="h-3 w-3" /> },
      { text: "Budget options", icon: <DollarSign className="h-3 w-3" /> },
      { text: "Family friendly", icon: <Users className="h-3 w-3" /> },
      { text: "Best time to visit", icon: <Calendar className="h-3 w-3" /> },
      { text: "Local transport", icon: <MapPin className="h-3 w-3" /> }
    ]

    // Add context-specific replies based on the last message
    if (messageContent?.toLowerCase().includes('museum') || messageContent?.toLowerCase().includes('art')) {
      baseReplies.unshift({ text: "Gallery hours", icon: <Clock className="h-3 w-3" /> })
    }
    
    if (messageContent?.toLowerCase().includes('food') || messageContent?.toLowerCase().includes('restaurant')) {
      baseReplies.unshift({ text: "Vegetarian options", icon: <Users className="h-3 w-3" /> })
    }

    return baseReplies.slice(0, 5)
  }, [])

  // Extract recommendations from AI response
  const extractRecommendations = (content: string): RecommendationItem[] => {
    // This is a simplified extraction - in production, you'd parse structured data from the AI
    const recommendations: RecommendationItem[] = []
    
    // Look for recommendation patterns in the content
    const recommendationRegex = /(?:recommend|suggest|visit|try)\s+([^.]+?)(?:\.|,)/gi
    const matches = content.matchAll(recommendationRegex)
    
    for (const match of matches) {
      const name = match[1].trim()
      if (name.length > 3 && name.length < 50) {
        recommendations.push({
          id: `rec-${Date.now()}-${Math.random()}`,
          type: 'place',
          name: name.charAt(0).toUpperCase() + name.slice(1),
          description: `Popular destination in ${itinerary?.destination || 'the area'}`,
          openingHours: '9:00 AM - 6:00 PM',
          price: '€10-15',
          priceLevel: 2,
          rating: 4.5,
          category: 'attraction'
        })
      }
    }
    
    return recommendations
  }

  // Handle AI response
  const handleAIQuery = async (userQuery: string) => {
    if (!userQuery.trim()) return

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userQuery,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setIsLoading(true)
    setQuery('')

    try {
      // Check if it's a simple place search (just a city/place name)
      const isSimpleSearch = userQuery.split(' ').length <= 3 && !userQuery.includes('?')
      
      if (isSimpleSearch) {
        // Fallback to regular POI search
        const results = await searchPoisByQuery(userQuery)
        if (results.length > 0) {
          setIsExpanded(false)
          toast.info(`Found ${results.length} places for "${userQuery}"`)
          return
        }
      }

      // Make AI request
      const response = await fetch('/api/ai/chat/v2', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userQuery,
          context: {
            destination: itinerary?.destination,
            currentDay: itinerary?.days?.[0],
            previousMessages: messages.slice(-4) // Last 4 messages for context
          }
        })
      })

      if (!response.ok) throw new Error('AI request failed')

      const data = await response.json()
      const aiContent = data.content
      const recommendations = data.recommendations || []
      
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: aiContent,
        timestamp: new Date(),
        recommendations
      }

      setMessages(prev => [...prev, aiMessage])
      
      // Generate pro tips
      const tips = generateProTips(userQuery, aiContent)
      
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, tips, recommendations }
            : msg
        )
      )

      // Update quick replies
      setQuickReplies(generateQuickReplies(itinerary?.destination || '', aiContent))

    } catch (error) {
      console.error('AI query error:', error)
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  // Generate contextual pro tips
  const generateProTips = (query: string, response: string): { emoji: string; text: string }[] => {
    const tips: { emoji: string; text: string }[] = []
    
    if (response.toLowerCase().includes('museum') || response.toLowerCase().includes('art')) {
      tips.push({ emoji: '🎨', text: 'Ask about skip-the-line tickets for popular museums' })
    }
    
    if (response.toLowerCase().includes('restaurant') || response.toLowerCase().includes('food')) {
      tips.push({ emoji: '🍽️', text: 'Try asking about local food markets for authentic experiences' })
    }
    
    if (response.toLowerCase().includes('hotel') || response.toLowerCase().includes('stay')) {
      tips.push({ emoji: '🏨', text: 'Ask about neighborhoods to find the perfect area to stay' })
    }

    // Always add a general tip
    tips.push({ emoji: '💡', text: 'Be specific! Try "romantic dinner spots with a view" or "rainy day activities for kids"' })

    return tips.slice(0, 3)
  }

  // Handle adding recommendation to itinerary
  const handleAddToItinerary = async (item: RecommendationItem) => {
    const selectedDay = getSelectedDay()
    if (!selectedDay) {
      toast.error('Please select a day first')
      return
    }

    // Create POI from recommendation
    const poi = {
      id: `poi-${Date.now()}`,
      name: item.name,
      category: item.category || 'activity' as any,
      location: item.location || {
        lat: 48.8566 + (Math.random() - 0.5) * 0.1, // Demo coordinates near Paris
        lng: 2.3522 + (Math.random() - 0.5) * 0.1,
        address: item.location?.address || ''
      },
      description: item.description,
      rating: item.rating,
      price: item.priceLevel,
      imageUrl: item.imageUrl
    }

    // Add to selected day
    addPoiToDay(poi, selectedDay.id)
    
    // Show success toast
    toast.success(
      <div className="flex items-center gap-2">
        <MapPin className="h-4 w-4" />
        <span>{item.name} added to Day {selectedDay.dayNumber}</span>
      </div>
    )
    
    // Collapse chat after a short delay
    setTimeout(() => {
      setIsExpanded(false)
    }, 1500)
  }

  // Handle input submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      handleAIQuery(query.trim())
    }
  }

  // Handle expansion
  const handleExpand = () => {
    setIsExpanded(true)
    if (!quickReplies.length && itinerary?.destination) {
      setQuickReplies(generateQuickReplies(itinerary.destination))
    }
  }

  return (
    <>
      {/* Search Input */}
      <div className={cn(
        "relative transition-all duration-300",
        isExpanded && !isMobile && "z-50"
      )}>
        <form onSubmit={handleSubmit} className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              ref={inputRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value)
                if (!isExpanded && e.target.value.length > 0) {
                  handleExpand()
                }
              }}
              onFocus={() => {
                setIsFocused(true)
                if (messages.length > 0) {
                  handleExpand()
                }
              }}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask TripNav AI about any destination..."
              className={cn(
                "pl-10 pr-24 h-11 bg-white border-gray-200 transition-all",
                "placeholder:text-gray-400",
                (isFocused || isExpanded) && "ring-2 ring-blue-500 border-blue-500",
                isExpanded && !isMobile && "rounded-b-none"
              )}
              autoComplete="off"
            />
            
            {/* Action buttons */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
              {query && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => setQuery('')}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7"
                onClick={() => {
                  toast.info('Voice input coming soon!')
                }}
              >
                <Mic className="h-3 w-3" />
              </Button>
              {query && (
                <Button
                  type="submit"
                  size="icon"
                  className="h-7 w-7 bg-blue-600 hover:bg-blue-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-3 w-3 animate-spin" />
                  ) : (
                    <Send className="h-3 w-3" />
                  )}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Chat Hatbox */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute bg-white border border-gray-200 shadow-lg",
              isMobile 
                ? "fixed inset-0 top-0 z-50" 
                : "top-full left-0 right-0 rounded-b-lg z-40 mt-[-1px] border-t-0"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold">TripNav AI</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsExpanded(false)}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Chat messages */}
            <ScrollArea 
              ref={scrollRef}
              className={cn(
                "px-4 py-3",
                isMobile ? "h-[calc(100vh-180px)]" : "max-h-[70vh]"
              )}
              style={{ overscrollBehavior: 'contain' }}
            >
              <div className={cn(
                "mx-auto",
                "w-full max-w-2xl", // Centered container with max width
              )}>
                {messages.length === 0 ? (
                  <div className="text-center py-8">
                    <Sparkles className="h-12 w-12 text-blue-200 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2">Hi! I'm your AI travel guide.</p>
                    <p className="text-sm text-gray-500">Ask me anything about {itinerary?.destination || 'your destination'}!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={cn(
                          "flex",
                          message.role === 'user' ? "justify-end" : "justify-start"
                        )}
                      >
                        <div
                          className={cn(
                            "rounded-xl px-4 py-2",
                            message.role === 'user' 
                              ? "bg-blue-600 text-white max-w-[80%]" 
                              : "bg-gray-100 text-gray-900 max-w-full",
                            message.role === 'assistant' && styles['ai-bubble']
                          )}
                        >
                          {message.role === 'assistant' ? (
                            <div>
                              {/* AI message with readable formatting */}
                              <div 
                                className="prose prose-sm max-w-none"
                                style={{ 
                                  fontSize: '16px',
                                  lineHeight: '1.6',
                                  maxWidth: '65ch'
                                }}
                              >
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => <p className="mb-3">{children}</p>,
                                    h1: ({ children }) => <h1 className="text-lg font-semibold mb-2">{children}</h1>,
                                    h2: ({ children }) => <h2 className="text-lg font-semibold mb-2">{children}</h2>,
                                    h3: ({ children }) => <h3 className="text-base font-semibold mb-2">{children}</h3>,
                                    ul: ({ children }) => <ul className="list-disc pl-5 mb-3">{children}</ul>,
                                    ol: ({ children }) => <ol className="list-decimal pl-5 mb-3">{children}</ol>,
                                    li: ({ children }) => <li className="mb-1">{children}</li>,
                                  }}
                                >
                                  {message.content}
                                </ReactMarkdown>
                              </div>
                              
                              {/* Recommendations */}
                              {message.recommendations && message.recommendations.length > 0 && (
                                <div className="mt-4 space-y-3">
                                  {message.recommendations.map((item) => (
                                    <RecommendationCard
                                      key={item.id}
                                      item={item}
                                      onAdd={() => handleAddToItinerary(item)}
                                    />
                                  ))}
                                </div>
                              )}
                              
                              {/* Pro tips */}
                              {message.tips && message.tips.length > 0 && (
                                <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                                  {message.tips.map((tip, idx) => (
                                    <p key={idx} className="text-sm text-gray-600">
                                      {tip.emoji} {tip.text}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm">{message.content}</p>
                          )}
                        </div>
                      </div>
                    ))}
                    
                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="bg-gray-100 rounded-xl px-4 py-2">
                          <div className="flex gap-1">
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Quick reply chips */}
            {quickReplies.length > 0 && !isLoading && (
              <div className="px-4 py-3 border-t bg-gray-50">
                <div className="flex flex-wrap gap-2">
                  {quickReplies.map((chip, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() => handleAIQuery(chip.text)}
                    >
                      {chip.icon}
                      {chip.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Mobile floating close button */}
            {isMobile && (
              <Button
                className="fixed bottom-20 right-4 rounded-full shadow-lg z-50"
                size="icon"
                variant="secondary"
                onClick={() => setIsExpanded(false)}
              >
                <X className="h-5 w-5" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}