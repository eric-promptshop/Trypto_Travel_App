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

  handleStopRef.current = useCallback(() => {
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
      let appliedFields: string[] = [];
      
      Object.entries(parsed).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          // Skip specialRequests as it's just the raw transcript
          if (key !== 'specialRequests') {
            console.log(`[Voice Input] Setting ${key} to:`, value);
            setValue(key as any, value, { shouldValidate: true });
            appliedFields.push(key);
            
            if (['destination', 'startDate', 'endDate', 'travelers'].includes(key)) {
              hasBasicFields = true;
            }
          }
        }
      });
      
      console.log('[Voice Input] Applied fields:', appliedFields);
      console.log('[Voice Input] Has basic fields:', hasBasicFields);
      
      if (onTranscriptComplete) {
        onTranscriptComplete(finalText);
      }
      
      // Only navigate if we have meaningful data
      if (hasBasicFields) {
        navigateToReview();
      } else if (appliedFields.length > 0) {
        console.log('[Voice Input] Some fields parsed but missing basic fields for navigation');
      } else {
        console.log('[Voice Input] No fields could be parsed from the transcript');
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
        if (isListening) {
          handleStop();
        }
      }, MAX_SESSION_MS);
      
      abortControllerRef.current.signal.addEventListener('abort', () => {
        clearTimeout(timeoutId);
      });
      
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
    <div className="relative inline-block">
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
            }}
            className="p-2"
            title="Toggle voice debug logging"
          >
            <Bug className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      {/* Subtle overlay beneath mic button */}
      <div 
        className={cn(
          "absolute -bottom-3 left-0 w-max max-w-[300px] rounded-lg bg-slate-800/80 px-3 py-1.5 text-sm text-white shadow-lg backdrop-blur-sm transition-all duration-300 z-50",
          isOverlayVisible && displayTranscript
            ? "opacity-100 translate-y-1"
            : "opacity-0 translate-y-0 pointer-events-none"
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-2">
          {isListening && (
            <div className="animate-pulse w-1.5 h-1.5 bg-red-500 rounded-full mt-1 flex-shrink-0" />
          )}
          <p className="text-xs leading-tight">
            {displayTranscript}
          </p>
        </div>
      </div>
      
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isListening ? "Listening..." : "Recording stopped"}
      </div>
    </div>
  );
}