import { useState, useEffect, useRef, useCallback } from 'react'

interface UseVoiceInputOptions {
  onResult?: (transcript: string) => void
  onError?: (error: string) => void
  onInterimResult?: (transcript: string) => void
  language?: string
  continuous?: boolean
  interimResults?: boolean
}

interface UseVoiceInputReturn {
  isListening: boolean
  isSupported: boolean
  startListening: () => void
  stopListening: () => void
  transcript: string
  interimTranscript: string
  error: string | null
  confidence: number
}

export function useVoiceInput({
  onResult,
  onError,
  onInterimResult,
  language = 'en-US',
  continuous = false,
  interimResults = true
}: UseVoiceInputOptions = {}): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [interimTranscript, setInterimTranscript] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [confidence, setConfidence] = useState(0)
  const recognitionRef = useRef<any>(null)
  const isListeningRef = useRef(false)

  useEffect(() => {
    // Check if speech recognition is supported
    if (typeof window !== 'undefined') {
      const SpeechRecognition = 
        (window as any).SpeechRecognition || 
        (window as any).webkitSpeechRecognition

      if (SpeechRecognition) {
        setIsSupported(true)
        
        const recognition = new SpeechRecognition()
        recognition.continuous = continuous
        recognition.interimResults = interimResults
        recognition.lang = language
        recognition.maxAlternatives = 1

        recognition.onresult = (event: any) => {
          let finalTranscript = ''
          let interimText = ''
          let avgConfidence = 0
          let confidenceCount = 0

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const result = event.results[i]
            if (result.isFinal) {
              finalTranscript += result[0].transcript
              avgConfidence += result[0].confidence
              confidenceCount++
            } else {
              interimText += result[0].transcript
            }
          }

          if (finalTranscript) {
            setTranscript(prev => continuous ? prev + ' ' + finalTranscript : finalTranscript)
            setConfidence(confidenceCount > 0 ? avgConfidence / confidenceCount : 0)
            onResult?.(finalTranscript)
          }

          if (interimText && interimResults) {
            setInterimTranscript(interimText)
            onInterimResult?.(interimText)
          }
        }

        recognition.onerror = (event: any) => {
          const errorMessage = getErrorMessage(event.error)
          setError(errorMessage)
          onError?.(errorMessage)
          setIsListening(false)
          isListeningRef.current = false
        }

        recognition.onend = () => {
          if (isListeningRef.current && continuous) {
            // Restart if continuous mode is enabled
            try {
              recognition.start()
            } catch (e) {
              setIsListening(false)
              isListeningRef.current = false
            }
          } else {
            setIsListening(false)
            isListeningRef.current = false
          }
        }

        recognition.onstart = () => {
          setError(null)
          setInterimTranscript('')
        }

        recognitionRef.current = recognition
      }
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors when stopping
        }
      }
    }
  }, [language, continuous, interimResults, onResult, onError, onInterimResult])

  const startListening = useCallback(() => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true)
      isListeningRef.current = true
      setTranscript('')
      setInterimTranscript('')
      setError(null)
      
      try {
        recognitionRef.current.start()
      } catch (e) {
        setError('Failed to start voice recognition')
        setIsListening(false)
        isListeningRef.current = false
      }
    }
  }, [isListening])

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      isListeningRef.current = false
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore errors when stopping
      }
      setIsListening(false)
    }
  }, [isListening])

  return {
    isListening,
    isSupported,
    startListening,
    stopListening,
    transcript,
    interimTranscript,
    error,
    confidence
  }
}

function getErrorMessage(error: string): string {
  switch (error) {
    case 'no-speech':
      return 'No speech was detected. Please try again.'
    case 'audio-capture':
      return 'No microphone was found. Please ensure it is plugged in and enabled.'
    case 'not-allowed':
      return 'Permission to use microphone was denied. Please allow microphone access.'
    case 'network':
      return 'Network error occurred. Please check your connection.'
    case 'aborted':
      return 'Voice input was cancelled.'
    default:
      return `Voice recognition error: ${error}`
  }
} 