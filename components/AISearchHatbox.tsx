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
  Plane
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { usePlanStore } from '@/store/planStore'
import { useDebounce } from '@/hooks/useDebounce'
import ReactMarkdown from 'react-markdown'
import { toast } from 'sonner'

interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  tips?: { emoji: string; text: string }[]
}

interface QuickReplyChip {
  text: string
  icon?: React.ReactNode
}

const STORAGE_KEY = 'tripnav-ai-chat-history'
const MAX_STORED_MESSAGES = 10

export function AISearchHatbox() {
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
  const { itinerary, searchPoisByQuery } = usePlanStore()

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
      const response = await fetch('/api/ai/chat', {
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

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let aiContent = ''
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: '',
        timestamp: new Date()
      }

      setMessages(prev => [...prev, aiMessage])

      // Stream the response
      while (reader) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        aiContent += chunk
        
        setMessages(prev => 
          prev.map(msg => 
            msg.id === aiMessage.id 
              ? { ...msg, content: aiContent }
              : msg
          )
        )
      }

      // Generate pro tips
      const tips = generateProTips(userQuery, aiContent)
      setMessages(prev => 
        prev.map(msg => 
          msg.id === aiMessage.id 
            ? { ...msg, tips }
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
                (isFocused || isExpanded) && "ring-2 ring-indigo-500 border-indigo-500",
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
                  className="h-7 w-7 bg-indigo-600 hover:bg-indigo-700"
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

        {/* Blinking cursor effect when empty and focused */}
        {isFocused && !query && !isExpanded && (
          <div className="absolute left-10 top-1/2 -translate-y-1/2 pointer-events-none">
            <div className="w-0.5 h-5 bg-indigo-600 animate-pulse" />
          </div>
        )}
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
              "absolute top-full left-0 right-0 bg-white border border-gray-200 shadow-lg",
              isMobile ? "fixed inset-0 top-14 z-50" : "rounded-b-lg max-h-[600px] z-40",
              !isMobile && "mt-[-1px] border-t-0"
            )}
          >
            {/* Header for mobile */}
            {isMobile && (
              <div className="flex items-center justify-between p-4 border-b">
                <h3 className="font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-indigo-600" />
                  TripNav AI
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(false)}
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}

            {/* Chat messages */}
            <ScrollArea 
              ref={scrollRef}
              className={cn(
                "px-4 py-3",
                isMobile ? "h-[calc(100vh-200px)]" : "max-h-[400px]"
              )}
            >
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-indigo-200 mx-auto mb-3" />
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
                          "max-w-[80%] rounded-lg px-4 py-2",
                          message.role === 'user' 
                            ? "bg-indigo-600 text-white" 
                            : "bg-gray-100 text-gray-900"
                        )}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm max-w-none">
                            <ReactMarkdown>{message.content}</ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        {/* Pro tips */}
                        {message.tips && message.tips.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-gray-200 space-y-2">
                            {message.tips.map((tip, idx) => (
                              <p key={idx} className="text-xs text-gray-600">
                                {tip.emoji} {tip.text}
                              </p>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 rounded-lg px-4 py-2">
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
            </ScrollArea>

            {/* Quick reply chips */}
            {quickReplies.length > 0 && !isLoading && (
              <div className="px-4 py-3 border-t">
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

            {/* Mobile floating map button */}
            {isMobile && (
              <Button
                className="fixed bottom-20 right-4 rounded-full shadow-lg z-50"
                size="icon"
                onClick={() => setIsExpanded(false)}
              >
                <MapPin className="h-5 w-5" />
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}