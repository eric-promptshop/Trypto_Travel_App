'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Mic, MicOff, Loader2 } from 'lucide-react'
import { useVoiceInput } from '@/hooks/use-voice-input'
import { toast } from 'sonner'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

interface VoiceSearchButtonProps {
  onTranscript: (transcript: string) => void
  onInterimTranscript?: (transcript: string) => void
  className?: string
  size?: 'sm' | 'default' | 'lg' | 'icon'
  variant?: 'default' | 'outline' | 'ghost' | 'secondary'
  showTooltip?: boolean
  language?: string
}

export default function VoiceSearchButton({
  onTranscript,
  onInterimTranscript,
  className,
  size = 'icon',
  variant = 'outline',
  showTooltip = true,
  language = 'en-US'
}: VoiceSearchButtonProps) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  
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
      onTranscript(text)
      if (confidence > 0.8) {
        toast.success('Voice input captured successfully')
      }
    },
    onInterimResult: onInterimTranscript,
    onError: (err) => {
      toast.error(err)
      if (err.includes('Permission')) {
        setHasPermission(false)
      }
    },
    language,
    continuous: false,
    interimResults: true
  })

  useEffect(() => {
    // Check microphone permission on mount
    if (isSupported && navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then(result => {
          setHasPermission(result.state === 'granted')
          result.addEventListener('change', () => {
            setHasPermission(result.state === 'granted')
          })
        })
        .catch(() => {
          // Permissions API not supported for microphone
          setHasPermission(null)
        })
    }
  }, [isSupported])

  const handleClick = () => {
    if (!isSupported) {
      toast.error('Voice input is not supported in your browser')
      return
    }

    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  if (!isSupported) {
    return null
  }

  const button = (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleClick}
      className={cn(
        'relative transition-all',
        isListening && 'ring-2 ring-primary ring-offset-2 animate-pulse',
        className
      )}
      aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
    >
      {isListening ? (
        <>
          <MicOff className={cn('h-4 w-4', size === 'icon' ? '' : 'mr-2')} />
          {size !== 'icon' && 'Listening...'}
          <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse" />
        </>
      ) : (
        <>
          <Mic className={cn('h-4 w-4', size === 'icon' ? '' : 'mr-2')} />
          {size !== 'icon' && 'Voice Search'}
        </>
      )}
    </Button>
  )

  if (!showTooltip) {
    return button
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {button}
        </TooltipTrigger>
        <TooltipContent>
          <p>
            {isListening 
              ? 'Click to stop listening' 
              : hasPermission === false
              ? 'Microphone permission required'
              : 'Click to start voice input'}
          </p>
          {!isListening && (
            <p className="text-xs text-muted-foreground mt-1">
              Try: "Plan a family trip to Paris"
            </p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}