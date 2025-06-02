"use client"

import * as React from "react"
import { Search } from "lucide-react"
import { Command as CommandPrimitive } from "cmdk"
import { cn } from "@/lib/utils"
import { useVoiceInput, VoiceControlButton } from "./voice-input"

interface VoiceCommandInputProps extends React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input> {
  voiceLanguage?: string
  showVoiceButton?: boolean
  onVoiceTranscript?: (transcript: string) => void
}

const VoiceCommandInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  VoiceCommandInputProps
>(({ className, voiceLanguage = 'en-US', showVoiceButton = true, onVoiceTranscript, value, onValueChange, ...props }, ref) => {
  const [inputValue, setInputValue] = React.useState(value || '')

  const { 
    isListening, 
    isSupported, 
    error: voiceError, 
    startListening, 
    stopListening 
  } = useVoiceInput({
    language: voiceLanguage,
    onTranscript: (transcript, isFinal) => {
      if (isFinal) {
        const newValue = transcript.trim()
        setInputValue(newValue)
        onVoiceTranscript?.(newValue)
        onValueChange?.(newValue)
      }
    }
  })

  const handleInputChange = (value: string) => {
    setInputValue(value)
    onValueChange?.(value)
  }

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening()
    } else {
      startListening()
    }
  }

  React.useEffect(() => {
    setInputValue(value || '')
  }, [value])

  return (
    <div className="flex items-center border-b px-3 relative" cmdk-input-wrapper="">
      <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
      <CommandPrimitive.Input
        ref={ref}
        value={inputValue}
        onValueChange={handleInputChange}
        className={cn(
          "flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
          showVoiceButton && isSupported && "pr-10",
          className
        )}
        {...props}
      />
      
      {showVoiceButton && isSupported && (
        <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
          <VoiceControlButton
            isListening={isListening}
            isSupported={isSupported}
            error={voiceError}
            onClick={handleVoiceToggle}
            size="sm"
            className="h-6 w-6 min-w-0 p-0"
          />
        </div>
      )}
    </div>
  )
})

VoiceCommandInput.displayName = "VoiceCommandInput"

export { VoiceCommandInput } 