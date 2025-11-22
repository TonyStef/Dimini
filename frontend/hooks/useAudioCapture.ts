'use client';

import { useState, useRef, useCallback } from 'react';

interface AudioCaptureState {
  isRecording: boolean;
  error: string | null;
}

export const useAudioCapture = () => {
  const [state, setState] = useState<AudioCaptureState>({
    isRecording: false,
    error: null
  });

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Start audio capture from microphone
   *
   * Uses WebM format with 80ms chunks (Hume recommendation)
   */
  const startCapture = useCallback(async (
    onAudioData: (audioBlob: Blob) => void
  ): Promise<void> => {
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      });

      streamRef.current = stream;

      // Check supported MIME types
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : 'audio/mp4';  // Fallback for Safari

      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = recorder;

      // Handle audio data chunks (80ms interval)
      recorder.ondataavailable = (event) => {
        console.log(`[Audio] Captured: ${event.data.size} bytes, ${event.data.type}`);
        if (event.data.size > 0) {
          onAudioData(event.data);
        } else {
          console.warn('[Audio] Empty audio chunk!');
        }
      };

      // Start recording with 80ms timeslice
      recorder.start(80);

      setState({ isRecording: true, error: null });

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Microphone access denied';
      setState({ isRecording: false, error });
      throw err;
    }
  }, []);

  /**
   * Stop audio capture
   */
  const stopCapture = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    setState({ isRecording: false, error: null });
  }, []);

  return {
    startCapture,
    stopCapture,
    isRecording: state.isRecording,
    error: state.error
  };
};
