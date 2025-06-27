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
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;


    recognition.onstart = () => {
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
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


      if (finalTranscript) {
        onTranscriptRef.current?.(finalTranscript, true);
      } else if (interimTranscript) {
        onTranscriptRef.current?.(interimTranscript, false);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('[Speech Recognition] Error:', event.error);
      if (event.error === 'no-speech') {
        return;
      }
      onErrorRef.current?.(event.error);
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        // Auto-restart if still supposed to be listening
        setTimeout(() => {
          if (isListeningRef.current) {
            try {
              recognition.start();
            } catch (e) {
              console.error('[Speech Recognition] Failed to restart:', e);
              isListeningRef.current = false;
            }
          }
        }, 100);
      }
    };

    recognition.onspeechstart = () => {
    };

    recognition.onspeechend = () => {
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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
      } catch (e) {
        console.error('[Speech Recognition] Failed to start:', e);
        isListeningRef.current = false;
      }
    } else {
    }
  }, [isSupported]);

  const stop = useCallback(() => {
    if (recognitionRef.current && isListeningRef.current) {
      isListeningRef.current = false;
      recognitionRef.current.stop();
    }
  }, []);

  return { start, stop, isSupported };
}