import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { parseVoiceTranscript } from '@/lib/voice-parser';
import { UseFormSetValue } from 'react-hook-form';

interface VoiceInputButtonProps {
  onTranscriptComplete?: (transcript: string) => void;
  setValue: UseFormSetValue<any>;
  navigateToReview: () => void;
  className?: string;
}

export function VoiceInputButton({ onTranscriptComplete, setValue, navigateToReview, className }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const accumulatedTranscriptRef = useRef<string>('');

  const SILENCE_LIMIT_MS = 3000;
  const MAX_SESSION_MS = 60000;

  const handleTranscript = useCallback((transcript: string, isFinal: boolean) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }

    if (isFinal && transcript) {
      accumulatedTranscriptRef.current = accumulatedTranscriptRef.current 
        ? `${accumulatedTranscriptRef.current} ${transcript}` 
        : transcript;
      setFinalTranscript(accumulatedTranscriptRef.current);
    } else {
      setInterimTranscript(transcript);
    }

    // Will be set after handleStop is defined
    silenceTimerRef.current = setTimeout(() => {
      handleStopRef.current();
    }, SILENCE_LIMIT_MS);
  }, []);

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
    stop();
    setIsListening(false);
    
    const finalText = accumulatedTranscriptRef.current.trim();
    if (finalText) {
      const parsed = parseVoiceTranscript(finalText);
      
      Object.entries(parsed).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          setValue(key as any, value);
        }
      });
      
      if (onTranscriptComplete) {
        onTranscriptComplete(finalText);
      }
      
      navigateToReview();
    }
    
    accumulatedTranscriptRef.current = '';
    setInterimTranscript('');
    setFinalTranscript('');
  }, [onTranscriptComplete, setValue, navigateToReview, stop]);
  
  const handleStop = handleStopRef.current;

  const handleToggle = useCallback(() => {
    if (isListening) {
      handleStop();
    } else {
      accumulatedTranscriptRef.current = '';
      setInterimTranscript('');
      setFinalTranscript('');
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
      
      {isListening && (interimTranscript || finalTranscript) && (
        <div 
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 min-w-[200px] max-w-[400px] bg-gray-900 text-white text-sm px-4 py-2 rounded-md shadow-lg z-50"
          role="status"
          aria-live="polite"
        >
          <div className="flex items-start gap-2">
            <div className="animate-pulse w-2 h-2 bg-red-500 rounded-full mt-1.5 flex-shrink-0" />
            <p className="text-left">
              {finalTranscript || interimTranscript}
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