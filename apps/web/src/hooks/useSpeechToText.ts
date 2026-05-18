import React from 'react';

type SpeechRecognitionAlternativeLike = {
  transcript: string;
};

type SpeechRecognitionResultLike = {
  readonly isFinal: boolean;
  readonly length: number;
  [index: number]: SpeechRecognitionAlternativeLike;
};

type SpeechRecognitionResultListLike = {
  readonly length: number;
  [index: number]: SpeechRecognitionResultLike;
};

type SpeechRecognitionEventLike = {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultListLike;
};

type SpeechRecognitionErrorEventLike = {
  readonly error: string;
};

type BrowserSpeechRecognition = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onstart: (() => void) | null;
  abort: () => void;
  start: () => void;
  stop: () => void;
};

type BrowserSpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: BrowserSpeechRecognitionConstructor;
    webkitSpeechRecognition?: BrowserSpeechRecognitionConstructor;
  }
}

type SpeechToTextOptions = {
  continuous?: boolean;
  getBaseText?: () => string;
  interimResults?: boolean;
  language?: string;
  onEnd?: () => void;
  onTranscript: (value: string) => void;
};

const getSpeechRecognitionConstructor = () => {
  if (typeof window === 'undefined') return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
};

const joinTranscript = (...parts: string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const speechErrorMessage = (code: string) => {
  if (code === 'not-allowed' || code === 'service-not-allowed') {
    return 'Microphone permission was blocked.';
  }
  if (code === 'no-speech') return 'No speech was detected. Please try again.';
  if (code === 'audio-capture') return 'No microphone was found.';
  if (code === 'network') return 'Speech recognition service is unavailable.';
  return 'Could not start speech recognition.';
};

export function useSpeechToText({
  continuous = true,
  getBaseText,
  interimResults = true,
  language = 'vi-VN',
  onEnd,
  onTranscript,
}: SpeechToTextOptions) {
  const recognitionRef = React.useRef<BrowserSpeechRecognition | null>(null);
  const baseTextRef = React.useRef('');
  const finalTranscriptByIndexRef = React.useRef<Record<number, string>>({});
  const [error, setError] = React.useState<string | null>(null);
  const [interimTranscript, setInterimTranscript] = React.useState('');
  const [isListening, setIsListening] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(() => Boolean(getSpeechRecognitionConstructor()));

  React.useEffect(() => {
    setIsSupported(Boolean(getSpeechRecognitionConstructor()));

    return () => {
      const recognition = recognitionRef.current;
      if (!recognition) return;

      recognition.onend = null;
      recognition.onerror = null;
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.abort();
      recognitionRef.current = null;
    };
  }, []);

  const stop = React.useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const start = React.useCallback(() => {
    const Recognition = getSpeechRecognitionConstructor();

    if (!Recognition) {
      setError('This browser does not support speech-to-text.');
      return false;
    }

    const previousRecognition = recognitionRef.current;
    if (previousRecognition) {
      previousRecognition.onend = null;
      previousRecognition.onerror = null;
      previousRecognition.onresult = null;
      previousRecognition.onstart = null;
      previousRecognition.abort();
    }

    const recognition = new Recognition();
    recognitionRef.current = recognition;
    baseTextRef.current = getBaseText?.().trim() || '';
    finalTranscriptByIndexRef.current = {};

    setError(null);
    setInterimTranscript('');

    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
      onEnd?.();
    };

    recognition.onerror = (event) => {
      setError(speechErrorMessage(event.error));
    };

    recognition.onresult = (event) => {
      let interim = '';

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        const transcript = result[0]?.transcript || '';

        if (result.isFinal) {
          finalTranscriptByIndexRef.current[index] = transcript;
        } else {
          interim = joinTranscript(interim, transcript);
        }
      }

      const finalTranscript = Object.entries(finalTranscriptByIndexRef.current)
        .sort(([left], [right]) => Number(left) - Number(right))
        .map(([, transcript]) => transcript)
        .join(' ');

      setInterimTranscript(interim);
      onTranscript(joinTranscript(baseTextRef.current, finalTranscript, interim));
    };

    try {
      recognition.start();
      return true;
    } catch {
      setError('Could not start speech recognition.');
      setIsListening(false);
      return false;
    }
  }, [continuous, getBaseText, interimResults, language, onEnd, onTranscript]);

  const toggle = React.useCallback(() => {
    if (isListening) {
      stop();
      return false;
    }

    return start();
  }, [isListening, start, stop]);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    clearError,
    error,
    interimTranscript,
    isListening,
    isSupported,
    start,
    stop,
    toggle,
  };
}
