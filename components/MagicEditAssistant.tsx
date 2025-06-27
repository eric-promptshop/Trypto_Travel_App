"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Send, 
  Sparkles, 
  Mic, 
  MicOff, 
  Loader2, 
  Wand2,
  Clock,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  RefreshCw,
  MessageSquare
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useVoiceInput } from '@/hooks/use-voice-input'

interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  suggestions?: string[]
  itineraryChanges?: ItineraryChange[]
}

interface ItineraryChange {
  type: 'add' | 'remove' | 'modify' | 'reorder'
  target: string // activity id or day id
  description: string
  data?: any
}

interface MagicEditAssistantProps {
  itinerary: any
  onUpdateItinerary: (changes: ItineraryChange[]) => void
  className?: string
}

export function MagicEditAssistant({
  itinerary,
  onUpdateItinerary,
  className
}: MagicEditAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi! I'm your Magic Edit assistant 🪄 I can help you refine your itinerary in real-time. Try saying things like:\n\n• \"Add more cultural activities\"\n• \"I want less time in museums\"\n• \"Make day 2 more relaxing\"\n• \"Find me food tours\"\n\nWhat would you like to adjust?",
      timestamp: new Date(),
      suggestions: [
        "Add more cultural activities",
        "Make it more budget-friendly", 
        "I want more food experiences",
        "Less crowded places please"
      ]
    }
  ])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isProcessingChanges, setIsProcessingChanges] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const scrollAreaRef = useRef<HTMLDivElement>(null)

  // Voice input hook
  const {
    isListening,
    isSupported,
    startListening,
    stopListening
  } = useVoiceInput({
    onResult: (transcript) => {
      setInput(transcript)
      inputRef.current?.focus()
    },
    onError: (error) => {
      toast.error('Voice input failed. Please try again.')
      console.error('Voice input error:', error)
    }
  })

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTo({
          top: scrollContainer.scrollHeight,
          behavior: 'smooth'
        })
      }
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
      // Call Magic Edit API
      const response = await fetch('/api/ai/magic-edit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: input,
          itinerary,
          conversationHistory: messages.map(m => ({
            role: m.role,
            content: m.content
          }))
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to process magic edit request')
      }
      
      const data = await response.json()
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        suggestions: data.suggestions,
        itineraryChanges: data.itineraryChanges
      }
      
      setMessages(prev => [...prev, assistantMessage])
      
      // Apply itinerary changes if provided
      if (data.itineraryChanges && data.itineraryChanges.length > 0) {
        setIsProcessingChanges(true)
        try {
          await onUpdateItinerary(data.itineraryChanges)
          toast.success('Itinerary updated successfully!')
        } catch (error) {
          toast.error('Failed to update itinerary')
          console.error('Error updating itinerary:', error)
        } finally {
          setIsProcessingChanges(false)
        }
      }
      
    } catch (error) {
      console.error('Error with magic edit:', error)
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your request.',
        timestamp: new Date(),
        suggestions: ['Try rephrasing your request', 'Ask for something specific', 'Start a new conversation']
      }])
      toast.error('Magic edit failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
    inputRef.current?.focus()
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const quickActions = [
    { icon: Plus, label: 'Add Activities', query: 'Add more activities to my itinerary' },
    { icon: Clock, label: 'Adjust Timing', query: 'Adjust the timing of my activities' },
    { icon: MapPin, label: 'Change Locations', query: 'Suggest different locations' },
    { icon: RefreshCw, label: 'Reorder Days', query: 'Reorder my itinerary days' }
  ]

  return (
    <Card className={cn("flex flex-col h-full", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-purple-600" />
            Magic Edit
          </CardTitle>
          <Badge variant="secondary" className="text-xs gap-1">
            <Sparkles className="h-3 w-3" />
            AI Powered
          </Badge>
        </div>
        
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {quickActions.map((action, index) => (
            <Button
              key={index}
              variant="outline"
              size="sm"
              className="text-xs gap-1 h-7"
              onClick={() => setInput(action.query)}
            >
              <action.icon className="h-3 w-3" />
              {action.label}
            </Button>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-4 gap-3">
        {/* Messages */}
        <ScrollArea className="flex-1" ref={scrollAreaRef}>
          <div className="space-y-4">
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' && "flex-row-reverse"
                  )}
                >
                  <Avatar className="h-8 w-8 flex-shrink-0">
                    <AvatarFallback className={cn(
                      message.role === 'assistant' ? "bg-purple-500 text-white" : "bg-blue-500 text-white",
                      "text-xs"
                    )}>
                      {message.role === 'assistant' ? (
                        <Wand2 className="h-4 w-4" />
                      ) : (
                        'U'
                      )}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className={cn(
                    "flex-1 space-y-2",
                    message.role === 'user' && "flex flex-col items-end"
                  )}>
                    <div className={cn(
                      "p-3 rounded-lg max-w-[85%]",
                      message.role === 'user' 
                        ? "bg-blue-500 text-white" 
                        : "bg-gray-100 text-gray-900"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    </div>
                    
                    {/* Itinerary Changes Indicator */}
                    {message.itineraryChanges && message.itineraryChanges.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Edit2 className="h-3 w-3" />
                          {message.itineraryChanges.length} change{message.itineraryChanges.length !== 1 ? 's' : ''} applied
                        </Badge>
                        {isProcessingChanges && (
                          <Loader2 className="h-3 w-3 animate-spin text-gray-500" />
                        )}
                      </div>
                    )}
                    
                    {/* Suggestions */}
                    {message.suggestions && message.suggestions.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {message.suggestions.map((suggestion, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            className="text-xs h-6 px-2"
                            onClick={() => handleSuggestionClick(suggestion)}
                          >
                            {suggestion}
                          </Button>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-400">
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            
            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-purple-500 text-white text-xs">
                    <Wand2 className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm text-gray-500">Working on your request...</span>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </ScrollArea>
        
        {/* Input */}
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Tell me how to improve your itinerary..."
              disabled={isLoading}
              className="pr-10"
            />
            {isSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full w-10"
                onClick={isListening ? stopListening : startListening}
                disabled={isLoading}
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
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="bg-purple-600 hover:bg-purple-700 text-white px-4"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
} 