import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceInputButtonProps {
  onTranscriptComplete: (transcript: string) => void;
  className?: string;
}

export function VoiceInputButton({ onTranscriptComplete, className }: VoiceInputButtonProps) {
  const [isListening, setIsListening] = useState(false);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const continuePromptTimerRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartRef = useRef<number>(0);
  const accumulatedTranscriptRef = useRef<string>('');

  const SILENCE_LIMIT_MS = 3000;
  const MIN_SESSION_MS = 10000;
  const MAX_SESSION_MS = 60000;
  const CONTINUE_PROMPT_MS = 3000;

  const handleTranscript = useCallback((transcript: string, isFinal: boolean) => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (continuePromptTimerRef.current) {
      clearTimeout(continuePromptTimerRef.current);
      setShowContinuePrompt(false);
    }

    if (isFinal && transcript) {
      accumulatedTranscriptRef.current = accumulatedTranscriptRef.current 
        ? `${accumulatedTranscriptRef.current} ${transcript}` 
        : transcript;
    }

    const sessionDuration = Date.now() - sessionStartRef.current;
    
    silenceTimerRef.current = setTimeout(() => {
      if (sessionDuration >= MIN_SESSION_MS) {
        handleStop();
      } else {
        setShowContinuePrompt(true);
      }
    }, SILENCE_LIMIT_MS);

    continuePromptTimerRef.current = setTimeout(() => {
      setShowContinuePrompt(true);
    }, CONTINUE_PROMPT_MS);
  }, []);

  const handleError = useCallback((error: string) => {
    console.error('Speech recognition error:', error);
    handleStop();
  }, []);

  const handleStop = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
    }
    if (continuePromptTimerRef.current) {
      clearTimeout(continuePromptTimerRef.current);
    }
    setShowContinuePrompt(false);
    stop();
    setIsListening(false);
    
    if (accumulatedTranscriptRef.current.trim()) {
      onTranscriptComplete(accumulatedTranscriptRef.current.trim());
    }
    accumulatedTranscriptRef.current = '';
  }, [onTranscriptComplete]);

  const { start, stop, isSupported } = useSpeechRecognition({
    continuous: true,
    interimResults: true,
    onTranscript: handleTranscript,
    onError: handleError,
  });

  const handleToggle = useCallback(() => {
    if (isListening) {
      handleStop();
    } else {
      sessionStartRef.current = Date.now();
      accumulatedTranscriptRef.current = '';
      setIsListening(true);
      start();
      
      setTimeout(() => {
        if (isListening) {
          handleStop();
        }
      }, MAX_SESSION_MS);
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
      if (continuePromptTimerRef.current) clearTimeout(continuePromptTimerRef.current);
    };
  }, []);

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
      
      {showContinuePrompt && (
        <div 
          className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1 rounded-md whitespace-nowrap"
          role="status"
          aria-live="polite"
        >
          Still listening… continue or tap stop
        </div>
      )}
      
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {isListening ? "Voice recording active" : "Voice recording stopped"}
      </div>
    </div>
  );
}