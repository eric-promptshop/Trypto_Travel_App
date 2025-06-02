"use client"

import * as React from "react"
import { Mic, MicOff, Square, Loader2, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Types for speech recognition API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList
  resultIndex: number
}

interface SpeechRecognitionErrorEvent extends Event {
  error: 'no-speech' | 'aborted' | 'audio-capture' | 'network' | 'not-allowed' | 'service-not-allowed' | 'bad-grammar' | 'language-not-supported'
  message?: string
}

interface SpeechRecognitionResult {
  readonly isFinal: boolean
  readonly length: number
  item(index: number): SpeechRecognitionAlternative
  [index: number]: SpeechRecognitionAlternative
}

interface SpeechRecognitionAlternative {
  readonly transcript: string
  readonly confidence: number
}

interface SpeechRecognitionResultList {
  readonly length: number
  item(index: number): SpeechRecognitionResult
  [index: number]: SpeechRecognitionResult
}

interface SpeechGrammarList {
  readonly length: number
  addFromString(string: string, weight?: number): void
  addFromURI(src: string, weight?: number): void
  item(index: number): SpeechGrammar
  [index: number]: SpeechGrammar
}

interface SpeechGrammar {
  src: string
  weight: number
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean
  grammars: SpeechGrammarList
  interimResults: boolean
  lang: string
  maxAlternatives: number
  serviceURI: string
  start(): void
  stop(): void
  abort(): void
  onaudiostart: ((this: SpeechRecognition, ev: Event) => any) | null
  onaudioend: ((this: SpeechRecognition, ev: Event) => any) | null
  onend: ((this: SpeechRecognition, ev: Event) => any) | null
  onerror: ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any) | null
  onnomatch: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onresult: ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any) | null
  onsoundstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onsoundend: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechstart: ((this: SpeechRecognition, ev: Event) => any) | null
  onspeechend: ((this: SpeechRecognition, ev: Event) => any) | null
  onstart: ((this: SpeechRecognition, ev: Event) => any) | null
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition
    webkitSpeechRecognition: new () => SpeechRecognition
  }
}

// Hook for managing voice input functionality
interface UseVoiceInputOptions {
  language?: string
  continuous?: boolean
  interimResults?: boolean
  onTranscript?: (transcript: string, isFinal: boolean) => void
  onError?: (error: string) => void
}

export const useVoiceInput = ({
  language = 'en-US',
  continuous = false,
  interimResults = true,
  onTranscript,
  onError
}: UseVoiceInputOptions = {}) => {
  const [isListening, setIsListening] = React.useState(false)
  const [isSupported, setIsSupported] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [transcript, setTranscript] = React.useState('')
  const recognitionRef = React.useRef<SpeechRecognition | null>(null)

  // Check browser support
  React.useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
    
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition()
    }
  }, [])

  // Initialize speech recognition
  React.useEffect(() => {
    if (!recognitionRef.current) return

    const recognition = recognitionRef.current
    recognition.continuous = continuous
    recognition.interimResults = interimResults
    recognition.lang = language

    recognition.onstart = () => {
      setIsListening(true)
      setError(null)
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = ''
      let interimTranscript = ''

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result && result.length > 0) {
          const alternative = result[0]
          if (alternative) {
            if (result.isFinal) {
              finalTranscript += alternative.transcript
            } else {
              interimTranscript += alternative.transcript
            }
          }
        }
      }

      const currentTranscript = finalTranscript || interimTranscript
      setTranscript(currentTranscript)
      onTranscript?.(currentTranscript, !!finalTranscript)
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false)
      let errorMessage = 'Speech recognition error occurred'
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.'
          break
        case 'aborted':
          errorMessage = 'Speech recognition was aborted.'
          break
        case 'audio-capture':
          errorMessage = 'Audio capture failed. Please check your microphone.'
          break
        case 'network':
          errorMessage = 'Network error occurred. Please check your connection.'
          break
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access and try again.'
          break
        case 'service-not-allowed':
          errorMessage = 'Speech recognition service not allowed.'
          break
        case 'language-not-supported':
          errorMessage = 'Language not supported for speech recognition.'
          break
      }
      
      setError(errorMessage)
      onError?.(errorMessage)
    }

    recognition.onend = () => {
      setIsListening(false)
    }

    return () => {
      if (recognition) {
        recognition.onstart = null
        recognition.onresult = null
        recognition.onerror = null
        recognition.onend = null
      }
    }
  }, [language, continuous, interimResults, onTranscript, onError])

  const startListening = React.useCallback(() => {
    if (!recognitionRef.current || !isSupported) return
    
    setError(null)
    setTranscript('')
    
    try {
      recognitionRef.current.start()
    } catch (error) {
      setError('Failed to start speech recognition')
    }
  }, [isSupported])

  const stopListening = React.useCallback(() => {
    if (!recognitionRef.current) return
    
    try {
      recognitionRef.current.stop()
    } catch (error) {
      console.warn('Error stopping speech recognition:', error)
    }
  }, [])

  const abortListening = React.useCallback(() => {
    if (!recognitionRef.current) return
    
    try {
      recognitionRef.current.abort()
    } catch (error) {
      console.warn('Error aborting speech recognition:', error)
    }
  }, [])

  return {
    isListening,
    isSupported,
    error,
    transcript,
    startListening,
    stopListening,
    abortListening
  }
}

// Voice control button component
interface VoiceControlButtonProps {
  isListening: boolean
  isSupported: boolean
  error?: string | null
  onClick: () => void
  disabled?: boolean
  size?: 'sm' | 'lg' | 'default' | 'icon'
  className?: string
}

export const VoiceControlButton: React.FC<VoiceControlButtonProps> = ({
  isListening,
  isSupported,
  error,
  onClick,
  disabled = false,
  size = 'default',
  className
}) => {
  const buttonId = React.useId()
  const statusId = React.useId()

  if (!isSupported) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="outline"
              size={size}
              disabled
              className={cn("text-muted-foreground", className)}
              aria-label="Voice input not supported in this browser"
              aria-describedby={statusId}
            >
              <MicOff className="h-4 w-4" />
              <span id={statusId} className="sr-only">
                Voice input is not supported in your current browser
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Voice input not supported in this browser</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const buttonVariant = error ? 'destructive' : isListening ? 'default' : 'outline'
  const Icon = error ? AlertCircle : isListening ? (isListening ? Square : Mic) : Mic

  // Generate accessible button text
  const getAccessibleText = () => {
    if (error) return 'Voice input error - click to retry'
    if (isListening) return 'Stop voice recording'
    return 'Start voice recording'
  }

  // Generate status for screen readers
  const getStatusText = () => {
    if (error) return `Voice input error: ${error}`
    if (isListening) return 'Voice recording is active. Speak now.'
    return 'Voice recording is ready'
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={buttonVariant}
            size={size}
            onClick={onClick}
            disabled={disabled}
            aria-label={getAccessibleText()}
            aria-pressed={isListening}
            aria-describedby={statusId}
            className={cn(
              "transition-all duration-200",
              isListening && "animate-pulse",
              "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
              className
            )}
          >
            {isListening ? (
              <div className="flex items-center gap-1">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="sr-only">Listening...</span>
              </div>
            ) : (
              <Icon className="h-4 w-4" />
            )}
            <span id={statusId} className="sr-only" aria-live="polite">
              {getStatusText()}
            </span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{getAccessibleText()}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}

// Enhanced input component with voice capabilities
interface VoiceInputProps extends React.ComponentProps<"input"> {
  onVoiceTranscript?: (transcript: string) => void
  voiceLanguage?: string
  showVoiceButton?: boolean
  voiceButtonPosition?: 'right' | 'left'
  error?: string
}

export const VoiceInput = React.forwardRef<HTMLInputElement, VoiceInputProps>(
  ({ 
    onVoiceTranscript, 
    voiceLanguage = 'en-US',
    showVoiceButton = true,
    voiceButtonPosition = 'right',
    error,
    className,
    ...props 
  }, ref) => {
    const [inputValue, setInputValue] = React.useState(props.value || '')
    const [voiceError, setVoiceError] = React.useState<string | null>(null)
    const [transcript, setTranscript] = React.useState('')
    const [isListening, setIsListening] = React.useState(false)
    
    const transcriptId = React.useId()
    const statusId = React.useId()
    const inputRef = React.useRef<HTMLInputElement>(null)

    const { 
      isListening: hookIsListening, 
      isSupported, 
      error: hookError, 
      startListening, 
      stopListening 
    } = useVoiceInput({
      language: voiceLanguage,
      onTranscript: (transcriptText, isFinal) => {
        setTranscript(transcriptText)
        setIsListening(hookIsListening)
        
        if (isFinal) {
          const newValue = transcriptText.trim()
          setInputValue(newValue)
          onVoiceTranscript?.(newValue)
          
          // Create a synthetic event to trigger onChange
          const syntheticEvent = {
            target: { value: newValue },
            currentTarget: { value: newValue }
          } as React.ChangeEvent<HTMLInputElement>
          
          props.onChange?.(syntheticEvent)
          
          // Clear transcript and refocus input
          setTranscript('')
          if (inputRef.current) {
            inputRef.current.focus()
          }
        }
      },
      onError: (errorMessage) => {
        setVoiceError(errorMessage)
        setIsListening(false)
        setTranscript('')
      }
    })

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Ctrl/Cmd + Shift + V to start/stop voice input
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'V') {
        e.preventDefault()
        handleVoiceToggle()
      }
      
      // Escape to stop voice input
      if (e.key === 'Escape' && isListening) {
        e.preventDefault()
        stopListening()
      }
      
      // Call original onKeyDown if provided
      props.onKeyDown?.(e)
    }

    const displayError = error || voiceError || hookError

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value)
      props.onChange?.(e)
    }

    const handleVoiceToggle = () => {
      if (isListening) {
        stopListening()
      } else {
        startListening()
      }
    }

    // Combine refs
    const combinedRef = React.useCallback((node: HTMLInputElement) => {
      inputRef.current = node
      if (typeof ref === 'function') {
        ref(node)
      } else if (ref) {
        ref.current = node
      }
    }, [ref])

    return (
      <div className="relative">
        <input
          ref={combinedRef}
          {...props}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          aria-describedby={cn(
            displayError && `${props.name}-error`,
            isSupported && showVoiceButton && statusId,
            transcript && transcriptId
          )}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            showVoiceButton && voiceButtonPosition === 'right' && "pr-12",
            showVoiceButton && voiceButtonPosition === 'left' && "pl-12",
            displayError && "border-destructive focus-visible:ring-destructive",
            className
          )}
        />
        
        {/* Voice button */}
        {showVoiceButton && isSupported && (
          <div className={cn(
            "absolute top-1/2 transform -translate-y-1/2",
            voiceButtonPosition === 'right' ? "right-2" : "left-2"
          )}>
            <VoiceControlButton
              isListening={isListening}
              isSupported={isSupported}
              error={voiceError || hookError}
              onClick={handleVoiceToggle}
              size="sm"
            />
          </div>
        )}
        
        {/* Live transcript display for screen readers */}
        {transcript && (
          <div id={transcriptId} className="sr-only" aria-live="polite">
            Voice input in progress: {transcript}
          </div>
        )}
        
        {/* Voice input status */}
        {isSupported && showVoiceButton && (
          <div id={statusId} className="sr-only" aria-live="polite">
            {isListening 
              ? 'Voice recording active. Speak clearly or press Escape to stop.'
              : 'Voice input ready. Press Ctrl+Shift+V to start recording.'
            }
          </div>
        )}
        
        {/* Error display */}
        {displayError && (
          <Alert className="mt-2" variant="destructive" role="alert">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription id={`${props.name}-error`}>
              {displayError}
            </AlertDescription>
          </Alert>
        )}
        
        {/* Keyboard shortcut instructions */}
        {isSupported && showVoiceButton && (
          <div className="sr-only">
            <p>
              Keyboard shortcuts: Ctrl+Shift+V to toggle voice input, 
              Escape to stop recording.
            </p>
          </div>
        )}
      </div>
    )
  }
)

VoiceInput.displayName = "VoiceInput"

export { VoiceInput as default } 