import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { parseVoiceTranscript, enableVoiceDebug } from '@/lib/voice-parser';
import { UseFormSetValue } from 'react-hook-form';

interface VoiceInputButtonProps {
  onTranscriptComplete?: (transcript: string) => void;
  setValue: UseFormSetValue<any>;
  navigateToReview: () => void;
  className?: string;
}

export function VoiceInputButton({ onTranscriptComplete, setValue, navigateToReview, className }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [displayTranscript, setDisplayTranscript] = useState('');
  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hideOverlayTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');
  const rafRef = useRef<number | null>(null);

  const SILENCE_LIMIT_MS = 3000;
  const MAX_SESSION_MS = 60000;
  const OVERLAY_HIDE_DELAY_MS = 500;

  const updateDisplayTranscript = useCallback((text: string) => {
    // Throttle updates with requestAnimationFrame
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    rafRef.current = requestAnimationFrame(() => {
      setDisplayTranscript(text);
      setIsOverlayVisible(true);
    });
  }, []);

  const handleTranscript = useCallback((transcript: string, isFinal: boolean) => {
    console.log('[Voice Input] Transcript received:', { transcript, isFinal });
    
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    if (isFinal && transcript) {
      accumulatedTranscriptRef.current = accumulatedTranscriptRef.current 
        ? `${accumulatedTranscriptRef.current} ${transcript}` 
        : transcript;
      updateDisplayTranscript(accumulatedTranscriptRef.current);
    } else if (transcript) {
      // Show interim results combined with accumulated
      const combined = accumulatedTranscriptRef.current 
        ? `${accumulatedTranscriptRef.current} ${transcript}`
        : transcript;
      updateDisplayTranscript(combined);
    }

    // Reset silence timer
    silenceTimerRef.current = setTimeout(() => {
      console.log('[Voice Input] Silence detected, stopping...');
      handleStopRef.current();
    }, SILENCE_LIMIT_MS);
  }, [updateDisplayTranscript]);

  const handleError = useCallback((error: string) => {
    console.error('Speech recognition error:', error);
    handleStopRef.current();
  }, []);
  
  const handleStopRef = useRef<() => void>(() => {});

  const { start, stop, isSupported } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onTranscript: handleTranscript,
    onError: handleError,
  });

  handleStopRef.current = useCallback(async () => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
    }
    stop();
    setIsListening(false);
    
    const finalText = accumulatedTranscriptRef.current.trim();
    if (finalText) {
      console.log('[Voice Input] Final transcript:', finalText);
      const parsed = parseVoiceTranscript(finalText);
      console.log('[Voice Input] Parsed fields:', parsed);
      
      // Apply parsed fields with proper validation
      let hasBasicFields = false;
      let appliedFields: Record<string, any> = {};
      const basicFieldsFound: string[] = [];
      
      // Process each parsed field
      for (const [key, value] of Object.entries(parsed)) {
        if (value !== undefined && value !== null && key !== 'specialRequests') {
          console.log(`[Voice Input] Attempting to set ${key} to:`, value);
          
          try {
            // For debugging, let's see what happens with setValue
            const result = await setValue(key as any, value, { 
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true 
            });
            
            console.log(`[Voice Input] setValue result for ${key}:`, result);
            appliedFields[key] = value;
            
            if (['destination', 'startDate', 'endDate', 'travelers'].includes(key)) {
              basicFieldsFound.push(key);
              hasBasicFields = true;
            }
          } catch (error) {
            console.error(`[Voice Input] Error setting ${key}:`, error);
          }
        }
      }
      
      console.log('[Voice Input] Applied fields:', appliedFields);
      console.log('[Voice Input] Basic fields found:', basicFieldsFound);
      console.log('[Voice Input] Has basic fields:', hasBasicFields);
      
      // Let's also check if the form validation passes
      if (hasBasicFields) {
        console.log('[Voice Input] Attempting navigation to review...');
        // Add a small delay to ensure form state is updated
        setTimeout(() => {
          navigateToReview();
        }, 100);
      } else if (Object.keys(appliedFields).length > 0) {
        console.log('[Voice Input] Some fields parsed but missing basic fields:', {
          foundFields: Object.keys(appliedFields),
          missingBasicFields: ['destination', 'startDate', 'endDate', 'travelers'].filter(
            field => !basicFieldsFound.includes(field)
          )
        });
      } else {
        console.log('[Voice Input] No fields could be parsed from the transcript');
        console.log('[Voice Input] Consider these patterns:', {
          destination: 'I\'m going to [place]',
          dates: 'leaving on [date] returning [date]',
          travelers: '[number] people',
          budget: 'budget is [amount] per person'
        });
      }
      
      if (onTranscriptComplete) {
        onTranscriptComplete(finalText);
      }
    }
    
    // Hide overlay after delay
    if (hideOverlayTimerRef.current) {
      clearTimeout(hideOverlayTimerRef.current);
    }
    hideOverlayTimerRef.current = setTimeout(() => {
      setIsOverlayVisible(false);
      setDisplayTranscript('');
    }, OVERLAY_HIDE_DELAY_MS);
    
    accumulatedTranscriptRef.current = '';
  }, [onTranscriptComplete, setValue, navigateToReview, stop]);
  
  const handleStop = handleStopRef.current;

  const handleToggle = useCallback(() => {
    if (isListening) {
      handleStop();
    } else {
      // Clear any pending hide timer
      if (hideOverlayTimerRef.current) {
        clearTimeout(hideOverlayTimerRef.current);
      }
      accumulatedTranscriptRef.current = '';
      setDisplayTranscript('');
      setIsOverlayVisible(false);
      setIsListening(true);
      
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('[Voice Input] Max session time reached, stopping...');
        if (isListening) {
          handleStop();
        }
      }, MAX_SESSION_MS);
      
      abortControllerRef.current.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
      });
      
      console.log('[Voice Input] Starting speech recognition...');
      console.log('[Voice Input] Try saying something like:');
      console.log('  - "I\'m going to Paris from July 10th to July 18th"');
      console.log('  - "Travel to Tokyo, leaving August 5th for 7 days with 2 people"');
      console.log('  - "Destination is London, departing September 1st returning September 8th, party of 4"');
      start();
    }
  }, [isListening, start, handleStop]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        handleToggle();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleToggle]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      if (hideOverlayTimerRef.current) clearTimeout(hideOverlayTimerRef.current);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (abortControllerRef.current) abortControllerRef.current.abort();
      if (isListening) {
        stop();
      }
    };
  }, [isListening, stop]);

  // Debug: Log when setValue prop changes
  useEffect(() => {
    console.log('[Voice Input] setValue function updated:', typeof setValue);
  }, [setValue]);

  if (!isSupported) {
    return (
      <Button variant="outline" size="sm" disabled className={className}>
        <Mic className="h-4 w-4 mr-2" />
        <span>Voice not supported</span>
      </Button>
    );
  }

  return (
    <div className="relative">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={handleToggle}
          className={cn(
            "gap-2 transition-all",
            isListening && "animate-pulse",
            className
          )}
          aria-label={isListening ? "Stop recording" : "Start recording"}
          aria-pressed={isListening}
        >
          {isListening ? (
            <>
              <Square className="h-4 w-4" />
              <span>Tap to finish</span>
            </>
          ) : (
            <>
              <Mic className="h-4 w-4" />
              <span>Describe your trip</span>
            </>
          )}
        </Button>
        
        {/* Debug toggle - only show in development */}
        {process.env.NODE_ENV === 'development' && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              const isDebugEnabled = typeof window !== 'undefined' && 
                window.localStorage?.getItem('debug-voice') === 'true';
              enableVoiceDebug(!isDebugEnabled);
              console.log(`[Voice Debug] ${!isDebugEnabled ? 'Enabled' : 'Disabled'}`);
              
              // Also log current form state for debugging
              console.log('[Voice Debug] Test parsing examples:');
              const testInputs = [
                "I'm going to Tokyo from July 10th to July 18th",
                "destination is Paris",
                "leaving on August 5th",
                "returning August 12th", 
                "4 people",
                "budget is $2000 per person"
              ];
              
              testInputs.forEach(input => {
                const parsed = parseVoiceTranscript(input);
                console.log(`[Voice Debug] "${input}" ->`, parsed);
              });
            }}
            className="p-2"
            title="Toggle voice debug logging"
          >
            <Bug className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Grey box for transcription display */}
      {isOverlayVisible && displayTranscript && (
        <div 
          className="mt-2 w-full max-w-md rounded-lg bg-gray-100 border border-gray-200 p-3 shadow-sm animate-in fade-in duration-200"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            {isListening && (
              <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" />
            )}
            <p className="text-sm text-gray-700 leading-relaxed">
              {displayTranscript}
            </p>
          </div>
        </div>
      )}
      
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isListening ? "Listening..." : "Recording stopped"}
      </div>
    </div>
  );
}