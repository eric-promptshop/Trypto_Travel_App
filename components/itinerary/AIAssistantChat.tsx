"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  X, 
  Send, 
  Loader2, 
  MapPin, 
  Calendar, 
  Cloud,
  Package,
  Lightbulb,
  RefreshCw,
  Mic,
  MicOff
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { useVoiceInput } from '@/components/ui/voice-input'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
}

interface AIAssistantChatProps {
  tripId: string
  currentDay?: any
  currentDestination?: any
  onClose: () => void
  onUpdateItinerary: (updates: any) => void
}

export function AIAssistantChat({
  tripId,
  currentDay,
  currentDestination,
  onClose,
  onUpdateItinerary
}: AIAssistantChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: `Hello! I'm Trypto, your AI travel assistant. I can help you with:
      
• Weather updates and packing suggestions
• Local recommendations for ${currentDestination?.name || 'your destination'}
• Activity suggestions for Day ${currentDay?.dayNumber || '1'}
• Modifying your itinerary
• Travel tips and advice

What would you like to know?`,
      timestamp: new Date(),
      suggestions: [
        "What's the weather like?",
        "Suggest a restaurant for dinner",
        "Add a morning activity",
        "What should I pack?"
      ]
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollAreaRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  // Voice input
  const {
    isListening,
    isSupported,
    startListening,
    stopListening
  } = useVoiceInput({
    onTranscript: (transcript, isFinal) => {
      if (isFinal && transcript) {
        setInput(transcript)
      }
    }
  })
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight
    }
  }, [messages])
  
  const handleSend = async () => {
    if (!input.trim() || isLoading) return
    
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date()
    }
    
    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsLoading(true)
    
    try {
      // Call AI API
      const response = await fetch('/api/form-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          context: {
            tripId,
            currentDay,
            currentDestination,
            mode: 'itinerary_assistant'
          }
        })
      })
      
      if (!response.ok) throw new Error('Failed to get AI response')
      
      const data = await response.json()
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
        suggestions: data.suggestions
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // If the response includes itinerary updates
      if (data.itineraryUpdates) {
        onUpdateItinerary(data.itineraryUpdates)
      }
    } catch (error) {
      console.error('Error getting AI response:', error)
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error. Please try again.',
        timestamp: new Date()
      }])
    } finally {
      setIsLoading(false)
    }
  }
  
  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }
  
  const getWeatherInfo = async () => {
    // Example function to get weather info
    handleSuggestionClick("What's the weather forecast for my trip?")
  }
  
  const suggestActivity = async () => {
    handleSuggestionClick(`Suggest a unique activity for Day ${currentDay?.dayNumber || '1'}`)
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, x: 400 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 400 }}
      transition={{ type: "spring", damping: 25, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-blue-500 text-white text-xs">T</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="font-semibold">Trypto Assistant</h3>
            <p className="text-xs text-gray-500">AI Travel Guide</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      {/* Quick Actions */}
      <div className="p-3 border-b">
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={getWeatherInfo}
          >
            <Cloud className="h-3 w-3" />
            Weather
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => handleSuggestionClick("What should I pack?")}
          >
            <Package className="h-3 w-3" />
            Packing
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1"
            onClick={suggestActivity}
          >
            <Lightbulb className="h-3 w-3" />
            Ideas
          </Button>
        </div>
      </div>
      
      {/* Messages */}
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3",
                message.role === 'user' && "flex-row-reverse"
              )}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className={cn(
                  message.role === 'assistant' ? "bg-blue-500 text-white" : "bg-gray-500 text-white",
                  "text-xs"
                )}>
                  {message.role === 'assistant' ? 'T' : 'U'}
                </AvatarFallback>
              </Avatar>
              
              <div className={cn(
                "flex-1 space-y-2",
                message.role === 'user' && "flex flex-col items-end"
              )}>
                <Card className={cn(
                  "p-3",
                  message.role === 'user' ? "bg-blue-50" : "bg-gray-50"
                )}>
                  <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                </Card>
                
                {message.suggestions && message.suggestions.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {message.suggestions.map((suggestion, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-gray-200 text-xs"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        {suggestion}
                      </Badge>
                    ))}
                  </div>
                )}
                
                <p className="text-xs text-gray-400">
                  {message.timestamp.toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-500 text-white text-xs">T</AvatarFallback>
              </Avatar>
              <Card className="p-3 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Thinking...</span>
                </div>
              </Card>
            </div>
          )}
        </div>
      </ScrollArea>
      
      {/* Input */}
      <div className="p-4 border-t">
        <form
          onSubmit={(e) => {
            e.preventDefault()
            handleSend()
          }}
          className="flex gap-2"
        >
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything about your trip..."
              disabled={isLoading}
              className="pr-10"
            />
            {isSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full"
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4 text-red-500" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            )}
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            size="icon"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </motion.div>
  )
}