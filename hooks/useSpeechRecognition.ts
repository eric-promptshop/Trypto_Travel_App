import { useRef, useCallback, useEffect } from 'react';

interface UseSpeechRecognitionOptions {
  continuous?: boolean;
  interimResults?: boolean;
  language?: string;
  onTranscript?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
  resultIndex: number;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export function useSpeechRecognition({
  continuous = true,
  interimResults = true,
  language = 'en-US',
  onTranscript,
  onError,
}: UseSpeechRecognitionOptions) {
  const recognitionRef = useRef<any>(null);
  const isListeningRef = useRef(false);
  const onTranscriptRef = useRef(onTranscript);
  const onErrorRef = useRef(onError);

  // Update refs when callbacks change
  useEffect(() => {
    onTranscriptRef.current = onTranscript;
    onErrorRef.current = onError;
  }, [onTranscript, onError]);

  const isSupported = typeof window !== 'undefined' && 
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  useEffect(() => {
    if (!isSupported) {
      console.log('[Speech Recognition] Not supported in this browser');
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    console.log('[Speech Recognition] Initialized with:', { continuous, interimResults, language });

    recognition.onstart = () => {
      console.log('[Speech Recognition] Started');
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      console.log('[Speech Recognition] Result event:', event);
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      console.log('[Speech Recognition] Transcripts:', { finalTranscript, interimTranscript });

      if (finalTranscript) {
        onTranscriptRef.current?.(finalTranscript, true);
      } else if (interimTranscript) {
        onTranscriptRef.current?.(interimTranscript, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Speech Recognition] Error:', event.error);
      if (event.error === 'no-speech') {
        console.log('[Speech Recognition] No speech detected');
        return;
      }
      onErrorRef.current?.(event.error);
    };

    recognition.onend = () => {
      console.log('[Speech Recognition] Ended, isListening:', isListeningRef.current);
      if (isListeningRef.current) {
        // Auto-restart if still supposed to be listening
        setTimeout(() => {
          if (isListeningRef.current) {
            try {
              recognition.start();
              console.log('[Speech Recognition] Restarted');
            } catch (e) {
              console.error('[Speech Recognition] Failed to restart:', e);
              isListeningRef.current = false;
            }
          }
        }, 100);
      }
    };

    recognition.onspeechstart = () => {
      console.log('[Speech Recognition] Speech started');
    };

    recognition.onspeechend = () => {
      console.log('[Speech Recognition] Speech ended');
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        console.log('[Speech Recognition] Cleanup: stopped');
      }
    };
  }, [continuous, interimResults, language, isSupported]);

  const start = useCallback(() => {
    if (!isSupported) {
      console.error('[Speech Recognition] Not supported');
      return;
    }

    if (recognitionRef.current && !isListeningRef.current) {
      isListeningRef.current = true;
      try {
        recognitionRef.current.start();
        console.log('[Speech Recognition] Start called');
      } catch (e) {
        console.error('[Speech Recognition] Failed to start:', e);
        isListeningRef.current = false;
      }
    } else {
      console.log('[Speech Recognition] Already listening or not initialized');
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
      console.log('[Speech Recognition] Stop called');
    }
  }, []);

  return { start, stop, isSupported };
}