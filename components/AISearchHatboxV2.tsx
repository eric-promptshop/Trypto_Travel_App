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
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Chip } from '@/components/ui/chip'
import { ChipTray } from '@/components/ui/chip-tray'
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea'
import { usePlanStore } from '@/store/planStore'
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

// Default quick reply categories
const DEFAULT_CATEGORIES = [
  { text: 'Art & Museums', icon: null },
  { text: 'Bars & Nightlife', icon: null },
  { text: 'Cafe & Bakery', icon: null },
  { text: 'Restaurants', icon: null },
  { text: 'Hotels', icon: null },
  { text: 'Attractions', icon: null },
  { text: 'Shopping', icon: null },
  { text: 'Beauty & Fashion', icon: null },
  { text: 'Transport', icon: null },
]

const STORAGE_KEY = 'tripnav-ai-chat-history'
const MAX_STORED_MESSAGES = 15

// Recommendation Card Component
function RecommendationCard({ 
  item, 
  onAdd 
}: { 
  item: RecommendationItem
  onAdd: () => void | Promise<void>
}) {
  const [isAdding, setIsAdding] = useState(false)
  
  const handleAdd = async () => {
    try {
      setIsAdding(true)
      await onAdd()
    } catch (error) {
      console.error('Error adding recommendation:', error)
    } finally {
      setIsAdding(false)
    }
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
  const [isExpanded, setIsExpanded] = useState(true) // Start expanded by default
  const [isFocused, setIsFocused] = useState(false)
  const [query, setQuery] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [quickReplies, setQuickReplies] = useState<QuickReplyChip[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false)
  
  const itinerary = usePlanStore((state) => state.itinerary)
  const searchPoisByQuery = usePlanStore((state) => state.searchPoisByQuery)
  const addPoiToDay = usePlanStore((state) => state.addPoiToDay)
  const getSelectedDay = usePlanStore((state) => state.getSelectedDay)

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Detect keyboard visibility on mobile
  useEffect(() => {
    if (!isMobile) return

    const handleFocus = () => setIsKeyboardVisible(true)
    const handleBlur = () => setIsKeyboardVisible(false)

    // Listen to all input elements
    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)

    return () => {
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
    }
  }, [isMobile])

  // Don't persist chat history for cleaner experience
  // Remove localStorage loading to start fresh each time

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      // Add a small delay to ensure DOM is updated
      setTimeout(() => {
        if (chatContainerRef.current) {
          chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
        }
      }, 100)
    }
  }, [messages])

  // Keyboard shortcuts removed - chat always stays open

  // Generate contextual quick replies
  const generateQuickReplies = useCallback((destination: string, messageContent?: string) => {
    // If we've asked about a specific category, show related queries
    if (messageContent?.toLowerCase().includes('restaurant') || messageContent?.toLowerCase().includes('food')) {
      return [
        { text: "Best local cuisine", icon: null },
        { text: "Vegetarian options", icon: null },
        { text: "Fine dining spots", icon: null },
        { text: "Budget eats", icon: null },
        { text: "Food markets", icon: null }
      ]
    }
    
    if (messageContent?.toLowerCase().includes('museum') || messageContent?.toLowerCase().includes('art')) {
      return [
        { text: "Must-see museums", icon: null },
        { text: "Art galleries", icon: null },
        { text: "Gallery hours", icon: null },
        { text: "Museum passes", icon: null },
        { text: "Contemporary art", icon: null }
      ]
    }
    
    // Default to destination-specific queries
    return [
      { text: `Best of ${destination || 'this city'}`, icon: null },
      { text: "Hidden gems", icon: null },
      { text: "Local favorites", icon: null },
      { text: "Day trip ideas", icon: null },
      { text: "Evening activities", icon: null },
      { text: "Budget tips", icon: null },
      { text: "Transport guide", icon: null },
      { text: "Weather & packing", icon: null },
      { text: "Safety tips", icon: null }
    ]
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

    // Clear previous messages for cleaner experience
    setMessages([])

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userQuery,
      timestamp: new Date()
    }

    setMessages([userMessage])
    setIsLoading(true)
    setQuery('')

    try {
      // Check if it's a simple place search (just a city/place name)
      const isSimpleSearch = userQuery.split(' ').length <= 3 && !userQuery.includes('?')
      
      if (isSimpleSearch && searchPoisByQuery) {
        // Fallback to regular POI search
        const results = await searchPoisByQuery(userQuery)
        if (results.length > 0) {
          // Show results in chat instead of collapsing
          const aiMessage: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: `I found ${results.length} places matching "${userQuery}". Here are some top results:`,
            timestamp: new Date(),
            recommendations: results.slice(0, 3).map(poi => ({
              id: poi.id,
              type: 'place' as const,
              name: poi.name,
              description: poi.description || 'Popular destination',
              rating: poi.rating,
              priceLevel: poi.price,
              category: poi.category,
              location: poi.location
            }))
          }
          setMessages(prev => [...prev, aiMessage])
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
    try {
      if (!getSelectedDay || !addPoiToDay) {
        toast.error('Unable to add to itinerary. Please refresh the page.')
        return
      }
      
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
        address: (item.location as any)?.address || ''
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
    
      // Chat stays open after adding items
    } catch (error) {
      console.error('Error adding to itinerary:', error)
      toast.error('Failed to add to itinerary')
    }
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
    // Don't clear messages since chat is always open
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
                // Don't auto-expand on focus to keep interface clean
              }}
              onBlur={() => setIsFocused(false)}
              placeholder="Ask TripNav AI about any destination..."
              className={cn(
                "pl-10 pr-24 h-11 bg-white border-gray-200 transition-all",
                "placeholder:text-gray-400 text-left",
                (isFocused || isExpanded) && "ring-2 ring-blue-500 border-blue-500",
                isExpanded && !isMobile && "rounded-b-none",
                isMobile && styles.chatInput
              )}
              style={{
                fontSize: '16px',
                textAlign: 'left'
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                  e.preventDefault()
                  handleSubmit(e as any)
                }
              }}
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
          <>
            {/* Mobile backdrop removed - chat stays open */}
            
          <motion.div
            initial={{ opacity: 0, y: isMobile ? 100 : -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: isMobile ? 100 : -10 }}
            transition={{ duration: 0.2, type: "spring", damping: 25 }}
            className={cn(
              "bg-white border border-gray-200 shadow-lg flex flex-col",
              isMobile 
                ? "fixed inset-x-0 bottom-0 z-50 rounded-t-2xl max-h-[80vh]" 
                : "absolute top-full left-0 right-0 rounded-b-lg z-40 mt-[-1px] border-t-0 h-[600px]"
            )}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold">TripNav AI</h3>
              </div>
              {/* Close button removed - chat always open */}
            </div>

            {/* Chat messages */}
            <div 
              ref={chatContainerRef}
              className={cn(
                "flex-1 overflow-y-auto scroll-smooth",
                "min-h-0" // Important for flex child
              )}
              style={{ overscrollBehavior: 'contain' }}
            >
              <div 
                className={cn(
                  "mx-auto px-4 py-3",
                  "w-full max-w-2xl", // Centered container with max width
                )}
              >
                {messages.length === 0 ? (
                  <div className="text-center py-4">
                    <Sparkles className="h-12 w-12 text-blue-200 mx-auto mb-3" />
                    <p className="text-gray-600 mb-2 text-base">Hi! I'm your AI travel guide.</p>
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
                            "rounded-2xl",
                            message.role === 'user' 
                              ? "bg-brand-blue-500 text-white max-w-[80%] px-4 py-3 ml-auto" 
                              : "bg-[#f7f7fb] dark:bg-gray-800 text-gray-900 dark:text-gray-100 max-w-[65ch] p-0",
                            message.role === 'assistant' && styles.aiBubble
                          )}
                        >
                          {message.role === 'assistant' ? (
                            <div className="p-4 sm:p-6">
                              {/* AI message with improved readability */}
                              <div className="space-y-4 prose prose-sm sm:prose-base max-w-none">
                                <ReactMarkdown
                                  components={{
                                    p: ({ children }) => (
                                      <p className="text-sm sm:text-base leading-relaxed mb-3 sm:mb-4 text-gray-700">
                                        {children}
                                      </p>
                                    ),
                                    h1: ({ children }) => (
                                      <h1 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-gray-900 mt-3 sm:mt-4">
                                        {children}
                                      </h1>
                                    ),
                                    h2: ({ children }) => (
                                      <h2 className="text-base sm:text-lg font-semibold mb-2 sm:mb-3 text-gray-900 mt-3 sm:mt-4">
                                        {children}
                                      </h2>
                                    ),
                                    h3: ({ children }) => (
                                      <h3 className="text-sm sm:text-base font-semibold mb-2 text-gray-900 mt-2 sm:mt-3">
                                        {children}
                                      </h3>
                                    ),
                                    strong: ({ children }) => (
                                      <strong className="font-semibold text-gray-900">{children}</strong>
                                    ),
                                    ul: ({ children }) => (
                                      <ul className="list-none space-y-2 my-3 sm:my-4 pl-0">{children}</ul>
                                    ),
                                    ol: ({ children }) => (
                                      <ol className="list-decimal list-inside space-y-2 my-3 sm:my-4 pl-3 sm:pl-4">
                                        {children}
                                      </ol>
                                    ),
                                    li: ({ children }) => (
                                      <li className="flex items-start gap-2 text-sm sm:text-base">
                                        <span className="text-blue-600 mt-0.5 sm:mt-1">•</span>
                                        <span className="flex-1">{children}</span>
                                      </li>
                                    ),
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
                                <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-200 space-y-2">
                                  {message.tips.map((tip, idx) => (
                                    <p key={idx} className="text-xs sm:text-sm text-gray-600">
                                      {tip.emoji} {tip.text}
                                    </p>
                                  ))}
                                </div>
                              )}
                            </div>
                          ) : (
                            <p className="text-sm sm:text-base">{message.content}</p>
                          )}
                        </div>
                        {/* Timestamp */}
                        <p className={cn(
                          "text-[11px] text-gray-400 dark:text-gray-500 mt-1",
                          message.role === 'user' ? "text-right" : "text-left"
                        )}>
                          {new Date(message.timestamp).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </p>
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
            </div>
            
            {/* Sticky chip tray - always visible at bottom when no messages */}
            {messages.length === 0 && (
              <ChipTray
                chips={DEFAULT_CATEGORIES}
                onChipClick={handleAIQuery}
                isLoading={isLoading}
                isKeyboardVisible={isKeyboardVisible}
                className={isMobile ? "" : "border-t-0"}
              />
            )}

            {/* Mobile input area and quick replies */}
            {isMobile && messages.length > 0 && (
              <div className="border-t bg-white dark:bg-gray-900 p-4">
                <form onSubmit={handleSubmit} className="flex gap-2 items-end">
                  <AutoResizeTextarea
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Ask TripNav AI anything..."
                    className="flex-1"
                    minRows={1}
                    maxRows={6}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                        e.preventDefault()
                        handleSubmit(e as any)
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-brand-blue-500 hover:bg-brand-blue-600 h-10 w-10 rounded-full flex-shrink-0"
                    disabled={isLoading || !query.trim()}
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button>
                </form>
                
                {/* Quick reply chips */}
                <div className="mt-3 -mx-4 px-4 overflow-x-auto scrollbar-hide">
                  <div className="flex gap-2 pb-1" style={{ scrollSnapType: 'x mandatory' }}>
                    {(messages.length === 0 ? DEFAULT_CATEGORIES : quickReplies).map((chip, idx) => (
                      <Chip
                        key={idx}
                        onClick={() => handleAIQuery(chip.text)}
                        icon={chip.icon}
                        className="flex-shrink-0"
                        style={{ scrollSnapAlign: 'start' }}
                        aria-label={`Send quick reply ${chip.text}`}
                        disabled={isLoading}
                      >
                        {chip.text}
                      </Chip>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Desktop quick reply chips and input */}
            {!isMobile && messages.length > 0 && (
              <div className="border-t bg-white dark:bg-gray-900">
                {/* Chips */}
                <div className="px-4 pt-3 pb-2">
                  <div className="flex flex-wrap gap-2 max-w-2xl mx-auto">
                    {quickReplies.map((chip, idx) => (
                      <Chip
                        key={idx}
                        onClick={() => handleAIQuery(chip.text)}
                        icon={chip.icon}
                        aria-label={`Send quick reply ${chip.text}`}
                        disabled={isLoading}
                      >
                        {chip.text}
                      </Chip>
                    ))}
                  </div>
                </div>
                
                {/* Input area */}
                <div className="px-4 pb-4">
                  <form onSubmit={handleSubmit} className="flex gap-2 items-end max-w-2xl mx-auto">
                    <AutoResizeTextarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="Ask TripNav AI anything..."
                      className="flex-1"
                      minRows={1}
                      maxRows={6}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                          e.preventDefault()
                          handleSubmit(e as any)
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-brand-blue-500 hover:bg-brand-blue-600 h-10 w-10 rounded-full flex-shrink-0"
                      disabled={isLoading || !query.trim()}
                    >
                      {isLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </Button>
                  </form>
                </div>
              </div>
            )}

            {/* Close button removed - chat stays open */}
          </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}