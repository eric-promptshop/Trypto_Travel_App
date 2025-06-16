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
  const OVERLAY_HIDE_DELAY_MS = 2000; // Increased to give user time to see result

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
      let successfulFields = 0;
      const basicFieldsNeeded = ['destination', 'startDate', 'endDate', 'travelers'];
      const foundBasicFields: string[] = [];
      
      // Process each parsed field
      for (const [key, value] of Object.entries(parsed)) {
        if (value !== undefined && value !== null && key !== 'specialRequests') {
          console.log(`[Voice Input] Setting ${key} to:`, value);
          
          try {
            // Use await to ensure the field is set before continuing
            await setValue(key as any, value, { 
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true 
            });
            
            console.log(`[Voice Input] Successfully set ${key}`);
            successfulFields++;
            
            if (basicFieldsNeeded.includes(key)) {
              foundBasicFields.push(key);
            }
          } catch (error) {
            console.error(`[Voice Input] Error setting ${key}:`, error);
          }
        }
      }
      
      console.log('[Voice Input] Summary:', {
        totalFieldsParsed: Object.keys(parsed).filter(k => k !== 'specialRequests').length,
        successfullySet: successfulFields,
        basicFieldsFound: foundBasicFields,
        missingBasicFields: basicFieldsNeeded.filter(f => !foundBasicFields.includes(f))
      });
      
      // Navigate to review if we have all basic fields
      if (foundBasicFields.length === basicFieldsNeeded.length) {
        console.log('[Voice Input] All basic fields found! Navigating to review...');
        
        // Update display to show success
        updateDisplayTranscript('✓ Trip details captured! Taking you to review...');
        
        // Small delay to ensure form state is fully updated
        setTimeout(() => {
          navigateToReview();
        }, 500);
      } else if (successfulFields > 0) {
        // Some fields were set but not all basic fields
        updateDisplayTranscript(`✓ Captured ${successfulFields} field(s). Please complete missing details.`);
        console.log('[Voice Input] Partial success - missing:', basicFieldsNeeded.filter(f => !foundBasicFields.includes(f)));
      } else {
        // No fields were successfully parsed
        updateDisplayTranscript('Could not understand. Try: "Going to Paris from July 10th to 18th with 2 people"');
        console.log('[Voice Input] No fields parsed. Example patterns:', {
          destination: '"going to Paris", "destination is Tokyo"',
          dates: '"from July 10th to July 18th", "leaving August 5th returning August 12th"',
          travelers: '"2 people", "party of 4", "couple"',
          budget: '"budget is $2000 per person"'
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
  }, [onTranscriptComplete, setValue, navigateToReview, stop, updateDisplayTranscript]);
  
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
      console.log('  - "I\'m going to Paris from July 10th to July 18th with 2 people"');
      console.log('  - "Travel to Tokyo, leaving August 5th for 7 days, party of 4"');
      console.log('  - "Destination is London, departing September 1st returning September 8th, 2 adults"');
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
              
              // Test parsing
              console.log('[Voice Debug] Testing parser with example inputs:');
              const testInputs = [
                "I'm going to Tokyo from July 10th to July 18th with 2 people",
                "Travel to Paris, leaving August 5th returning August 12th, party of 4",
                "Destination is London, budget is $2000 per person, prefer hotel"
              ];
              
              testInputs.forEach(input => {
                const parsed = parseVoiceTranscript(input);
                console.log(`[Voice Debug] "${input}"`);
                console.log('[Voice Debug] Parsed:', parsed);
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
          className={cn(
            "mt-2 w-full max-w-md rounded-lg border p-3 shadow-sm animate-in fade-in duration-200",
            displayTranscript.includes('✓') 
              ? "bg-green-50 border-green-200" 
              : displayTranscript.includes('Could not understand')
              ? "bg-red-50 border-red-200"
              : "bg-gray-100 border-gray-200"
          )}
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            {isListening && !displayTranscript.includes('✓') && (
              <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full mt-1 flex-shrink-0" />
            )}
            <p className={cn(
              "text-sm leading-relaxed",
              displayTranscript.includes('✓') ? "text-green-700" :
              displayTranscript.includes('Could not understand') ? "text-red-700" :
              "text-gray-700"
            )}>
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