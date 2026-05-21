import React from 'react';
import { useAuthStore } from '../../../store';

type InterviewSpeechToTextOptions = {
  getBaseText?: () => string;
  onEnd?: () => void;
  onTranscript: (value: string) => void;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';
const MAX_RECORDING_MS = 60_000;
const SPEECH_ERROR_MESSAGE = 'Không thể nhận diện giọng nói, vui lòng thử lại';
const UNSUPPORTED_MESSAGE = 'Trình duyệt không hỗ trợ, vui lòng dùng Chrome hoặc Edge';

const canUseMediaRecorder = () =>
  typeof navigator !== 'undefined' &&
  Boolean(navigator.mediaDevices?.getUserMedia) &&
  typeof MediaRecorder !== 'undefined';

const getRecordingMimeType = () => {
  if (typeof MediaRecorder === 'undefined') return '';

  return [
    'audio/webm;codecs=opus',
    'audio/webm',
    'audio/mp4',
  ].find((mimeType) => MediaRecorder.isTypeSupported(mimeType)) || '';
};

const audioExtensionForMimeType = (mimeType: string) => {
  if (mimeType.includes('mp4')) return 'm4a';
  return 'webm';
};

const joinTranscript = (...parts: string[]) =>
  parts
    .map((part) => part.trim())
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();

const stopMediaStream = (stream: MediaStream | null) => {
  stream?.getTracks().forEach((track) => track.stop());
};

export function useInterviewSpeechToText({
  getBaseText,
  onEnd,
  onTranscript,
}: InterviewSpeechToTextOptions) {
  const mediaRecorderRef = React.useRef<MediaRecorder | null>(null);
  const mediaStreamRef = React.useRef<MediaStream | null>(null);
  const chunksRef = React.useRef<Blob[]>([]);
  const baseTextRef = React.useRef('');
  const autoStopRef = React.useRef<number | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isListening, setIsListening] = React.useState(false);
  const [isSupported, setIsSupported] = React.useState(() => canUseMediaRecorder());
  const [isTranscribing, setIsTranscribing] = React.useState(false);

  const clearAutoStop = React.useCallback(() => {
    if (autoStopRef.current === null) return;
    window.clearTimeout(autoStopRef.current);
    autoStopRef.current = null;
  }, []);

  const transcribeAudio = React.useCallback(
    async (audioBlob: Blob, mimeType: string) => {
      if (audioBlob.size < 200) {
        setError(SPEECH_ERROR_MESSAGE);
        return;
      }

      const token = useAuthStore.getState().token;
      const formData = new FormData();
      formData.append('audio', audioBlob, `interview-response.${audioExtensionForMimeType(mimeType)}`);

      setIsTranscribing(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/speech-to-text`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          body: formData,
        });

        if (!response.ok) {
          throw new Error('Speech-to-text failed');
        }

        const payload = (await response.json()) as { text?: string };
        const transcript = payload.text?.trim();
        if (!transcript) {
          throw new Error('Empty transcript');
        }

        onTranscript(joinTranscript(baseTextRef.current, transcript));
      } catch {
        setError(SPEECH_ERROR_MESSAGE);
      } finally {
        setIsTranscribing(false);
      }
    },
    [onTranscript]
  );

  const stop = React.useCallback(() => {
    clearAutoStop();
    const recorder = mediaRecorderRef.current;

    if (recorder && recorder.state !== 'inactive') {
      try {
        if (recorder.state === 'recording') recorder.requestData();
        recorder.stop();
      } catch {
        setIsListening(false);
        setError(SPEECH_ERROR_MESSAGE);
      }
    }
  }, [clearAutoStop]);

  const start = React.useCallback(async () => {
    if (!canUseMediaRecorder()) {
      setIsSupported(false);
      setError(UNSUPPORTED_MESSAGE);
      return false;
    }

    if (isListening || isTranscribing) return false;

    setIsSupported(true);
    setError(null);
    baseTextRef.current = getBaseText?.().trim() || '';
    chunksRef.current = [];

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getRecordingMimeType();
      const recorder = mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream);

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };

      recorder.onerror = () => {
        clearAutoStop();
        setError(SPEECH_ERROR_MESSAGE);
        setIsListening(false);
        stopMediaStream(mediaStreamRef.current);
        mediaStreamRef.current = null;
      };

      recorder.onstart = () => {
        setIsListening(true);
      };

      recorder.onstop = () => {
        clearAutoStop();
        const chunks = chunksRef.current;
        const recordingMimeType = mimeType || chunks[0]?.type || 'audio/webm';
        const audioBlob = new Blob(chunks, { type: recordingMimeType });

        mediaRecorderRef.current = null;
        chunksRef.current = [];
        stopMediaStream(mediaStreamRef.current);
        mediaStreamRef.current = null;

        setIsListening(false);
        onEnd?.();
        void transcribeAudio(audioBlob, recordingMimeType);
      };

      recorder.start();
      autoStopRef.current = window.setTimeout(stop, MAX_RECORDING_MS);
      return true;
    } catch {
      clearAutoStop();
      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
      setIsListening(false);
      setError(SPEECH_ERROR_MESSAGE);
      return false;
    }
  }, [clearAutoStop, getBaseText, isListening, isTranscribing, onEnd, stop, transcribeAudio]);

  const toggle = React.useCallback(async () => {
    if (isListening) {
      stop();
      return false;
    }

    return start();
  }, [isListening, start, stop]);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    setIsSupported(canUseMediaRecorder());

    return () => {
      clearAutoStop();
      const recorder = mediaRecorderRef.current;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onerror = null;
        recorder.onstart = null;
        recorder.onstop = null;
        if (recorder.state !== 'inactive') {
          recorder.stop();
        }
      }
      stopMediaStream(mediaStreamRef.current);
      mediaStreamRef.current = null;
    };
  }, [clearAutoStop]);

  return {
    clearError,
    error,
    isListening,
    isSupported,
    isTranscribing,
    start,
    stop,
    toggle,
  };
}
