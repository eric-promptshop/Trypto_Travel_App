'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { Mic, MicOff, Volume2, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

interface VoiceInputModalProps {
  isOpen: boolean
  onClose: () => void
  onTranscript: (transcript: string) => void
  title?: string
  placeholder?: string
  examples?: string[]
  language?: string
}

export default function VoiceInputModal({
  isOpen,
  onClose,
  onTranscript,
  title = 'Tell us about your trip',
  placeholder = 'Listening for your travel plans...',
  examples = [
    'Plan a romantic getaway to Santorini',
    'Family vacation to Disney World for 5 days',
    'Adventure trip to New Zealand with hiking',
    'Weekend in New York City for shopping and shows'
  ],
  language = 'en-US'
}: VoiceInputModalProps) {
  const [selectedExample, setSelectedExample] = useState<number | null>(null)
  const [showExamples, setShowExamples] = useState(true)

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
      // Auto-submit if confidence is high enough
      if (confidence > 0.7 && text.length > 10) {
        handleSubmit(text)
      }
    },
    language,
    continuous: false,
    interimResults: true
  })

  useEffect(() => {
    if (isOpen && isSupported) {
      // Auto-start listening when modal opens
      setTimeout(() => {
        startListening()
      }, 500)
    }
    
    return () => {
      if (isListening) {
        stopListening()
      }
    }
  }, [isOpen])

  useEffect(() => {
    // Hide examples when user starts speaking
    if (interimTranscript) {
      setShowExamples(false)
    }
  }, [interimTranscript])

  const handleSubmit = (text: string) => {
    stopListening()
    onTranscript(text)
    onClose()
  }

  const handleExampleClick = (example: string, index: number) => {
    setSelectedExample(index)
    setTimeout(() => {
      handleSubmit(example)
    }, 300)
  }

  const displayText = interimTranscript || transcript

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl">{title}</DialogTitle>
        </DialogHeader>

        <div className="py-8">
          {/* Microphone Animation */}
          <div className="flex justify-center mb-8">
            <motion.div
              className={cn(
                'relative w-24 h-24 rounded-full flex items-center justify-center',
                isListening ? 'bg-primary/10' : 'bg-muted'
              )}
              animate={isListening ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              {isListening && (
                <>
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20"
                    animate={{
                      scale: [1, 1.5, 2],
                      opacity: [0.5, 0.2, 0]
                    }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary/20"
                    animate={{
                      scale: [1, 1.5, 2],
                      opacity: [0.5, 0.2, 0]
                    }}
                    transition={{
                      duration: 2,
                      delay: 0.5,
                      repeat: Infinity,
                      ease: "easeOut"
                    }}
                  />
                </>
              )}
              <Mic className={cn(
                'w-10 h-10',
                isListening ? 'text-primary' : 'text-muted-foreground'
              )} />
            </motion.div>
          </div>

          {/* Status Text */}
          <div className="text-center mb-6">
            {error ? (
              <p className="text-destructive">{error}</p>
            ) : displayText ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2"
              >
                <p className="text-lg font-medium">{displayText}</p>
                {transcript && confidence > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Confidence: {Math.round(confidence * 100)}%
                  </p>
                )}
              </motion.div>
            ) : (
              <p className="text-muted-foreground animate-pulse">{placeholder}</p>
            )}
          </div>

          {/* Example Prompts */}
          <AnimatePresence>
            {showExamples && !displayText && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3"
              >
                <p className="text-sm text-center text-muted-foreground mb-3">
                  Or try one of these examples:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {examples.map((example, index) => (
                    <motion.button
                      key={index}
                      className={cn(
                        'text-left p-3 rounded-lg border text-sm transition-all',
                        'hover:border-primary hover:bg-primary/5',
                        selectedExample === index && 'border-primary bg-primary/10'
                      )}
                      onClick={() => handleExampleClick(example, index)}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Volume2 className="w-4 h-4 inline mr-2 text-muted-foreground" />
                      {example}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Action Buttons */}
          <div className="flex justify-center gap-3 mt-8">
            {isListening ? (
              <Button
                variant="destructive"
                onClick={() => stopListening()}
                className="gap-2"
              >
                <MicOff className="w-4 h-4" />
                Stop Listening
              </Button>
            ) : (
              <Button
                onClick={() => startListening()}
                disabled={!isSupported}
                className="gap-2"
              >
                <Mic className="w-4 h-4" />
                Start Again
              </Button>
            )}
            
            {transcript && (
              <Button
                variant="default"
                onClick={() => handleSubmit(transcript)}
              >
                Use This Input
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={onClose}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
          </div>
        </div>

        {/* Visual Feedback */}
        {isListening && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-muted overflow-hidden">
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
      </DialogContent>
    </Dialog>
  )
}