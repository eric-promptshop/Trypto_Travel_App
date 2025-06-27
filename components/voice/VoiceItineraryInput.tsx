'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Mic, MicOff, Volume2 } from 'lucide-react'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface VoiceItineraryInputProps {
  onSubmit: (transcript: string) => void
  className?: string
}

export default function VoiceItineraryInput({
  onSubmit,
  className
}: VoiceItineraryInputProps) {
  const [showTranscript, setShowTranscript] = useState(false)
  
  const {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    error,
    confidence
  } = useVoiceInput({
    onResult: (text) => {
      if (text.length > 10) {
        setShowTranscript(true)
      }
    },
    continuous: false,
    interimResults: true
  })

  const handleSubmit = () => {
    if (transcript) {
      onSubmit(transcript)
      setShowTranscript(false)
    }
  }

  const handleToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      setShowTranscript(true)
      startListening()
    }
  }

  if (!isSupported) {
    return null
  }

  const displayText = interimTranscript || transcript

  return (
    <div className={cn('relative', className)}>
      <AnimatePresence>
        {showTranscript && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="mb-4"
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Volume2 className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">
                        {isListening ? 'Listening...' : 'Voice Input'}
                      </span>
                      {confidence > 0 && (
                        <span className="text-xs text-muted-foreground">
                          ({Math.round(confidence * 100)}% confident)
                        </span>
                      )}
                    </div>
                    
                    {error ? (
                      <p className="text-sm text-destructive">{error}</p>
                    ) : displayText ? (
                      <p className="text-sm">{displayText}</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">
                        Start speaking to describe your trip...
                      </p>
                    )}
                  </div>

                  {transcript && !isListening && (
                    <Button
                      size="sm"
                      onClick={handleSubmit}
                      className="flex-shrink-0"
                    >
                      Use This
                    </Button>
                  )}
                </div>

                {/* Visual feedback */}
                {isListening && (
                  <div className="mt-3 h-1 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-primary"
                      animate={{
                        x: ['-100%', '100%']
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <Button
        variant={isListening ? 'destructive' : 'outline'}
        size="lg"
        onClick={handleToggle}
        className={cn(
          'w-full transition-all',
          isListening && 'animate-pulse'
        )}
      >
        {isListening ? (
          <>
            <MicOff className="w-5 h-5 mr-2" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="w-5 h-5 mr-2" />
            Describe Your Trip by Voice
          </>
        )}
      </Button>

      {!showTranscript && (
        <p className="text-xs text-center text-muted-foreground mt-2">
          Click and speak naturally about your travel plans
        </p>
      )}
    </div>
  )
}