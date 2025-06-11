"use client"

import React, { useState } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { VoiceInput, useVoiceInput, VoiceControlButton } from '@/components/ui/voice-input'
import { VoiceCommandInput } from '@/components/ui/voice-command-input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { DestinationSelector } from '@/components/travel-forms/destination-selector'

interface TestFormData {
  primaryDestination: string
  additionalDestinations: string[]
}

export default function VoiceTestPage() {
  const [inputValue, setInputValue] = useState('')
  const [destination, setDestination] = useState('')
  const [additionalDestinations, setAdditionalDestinations] = useState<string[]>([])

  // Form provider for DestinationSelector
  const form = useForm<TestFormData>({
    defaultValues: {
      primaryDestination: '',
      additionalDestinations: []
    }
  })

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Voice Input Test
          </h1>
          <p className="text-lg text-gray-600">
            Testing voice-to-text functionality for travel forms
          </p>
        </div>

        <div className="space-y-6">
          {/* Basic Voice Input Test */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Voice Input</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Voice-enabled text input:
                </label>
                <VoiceInput
                  placeholder="Type or speak your message..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onVoiceTranscript={(transcript) => {
                    setInputValue(transcript)
                    console.log('Voice transcript:', transcript)
                  }}
                />
              </div>
              <div className="text-sm text-muted-foreground">
                Current value: {inputValue || 'No input yet'}
              </div>
            </CardContent>
          </Card>

          {/* Destination Selector with Voice */}
          <Card>
            <CardHeader>
              <CardTitle>Destination Selector with Voice</CardTitle>
            </CardHeader>
            <CardContent>
              <FormProvider {...form}>
                <DestinationSelector
                  primaryDestination={destination}
                  additionalDestinations={additionalDestinations}
                  onPrimaryDestinationChange={setDestination}
                  onAdditionalDestinationsChange={setAdditionalDestinations}
                  placeholder="Say or type a destination..."
                />
              </FormProvider>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div>Primary: {destination || 'None selected'}</div>
                <div>Additional: {additionalDestinations.length > 0 ? additionalDestinations.join(', ') : 'None selected'}</div>
              </div>
            </CardContent>
          </Card>

          {/* Voice Hook Test */}
          <Card>
            <CardHeader>
              <CardTitle>Voice Hook Usage Example</CardTitle>
            </CardHeader>
            <CardContent>
              <VoiceHookExample />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Component demonstrating direct use of the voice hook
function VoiceHookExample() {
  const [transcript, setTranscript] = useState('')
  const [finalTranscript, setFinalTranscript] = useState('')

  const { 
    isListening, 
    isSupported, 
    error, 
    startListening, 
    stopListening 
  } = useVoiceInput({
    onTranscript: (text, isFinal) => {
      setTranscript(text)
      if (isFinal) {
        setFinalTranscript(text)
      }
    }
  })

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <VoiceControlButton
          isListening={isListening}
          isSupported={isSupported}
          error={error}
          onClick={isListening ? stopListening : startListening}
        />
        <div className="text-sm">
          {!isSupported && "Voice input not supported"}
          {isSupported && !isListening && "Click microphone to start"}
          {isListening && "Listening..."}
          {error && `Error: ${error}`}
        </div>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Live transcript:</strong> {transcript || 'Say something...'}
        </div>
        <div>
          <strong>Final result:</strong> {finalTranscript || 'No final result yet'}
        </div>
      </div>
    </div>
  )
} 