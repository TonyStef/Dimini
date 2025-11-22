'use client';

import { useRef, useCallback } from 'react';

export const useAudioPlayback = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingRef = useRef(false);

  /**
   * Initialize AudioContext (call on user interaction for iOS)
   */
  const initialize = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext({ sampleRate: 48000 });
    }
  }, []);

  /**
   * Play audio from Hume (base64 encoded)
   */
  const playAudio = useCallback(async (base64Audio: string) => {
    initialize();

    if (!audioContextRef.current) {
      console.error('AudioContext not initialized');
      return;
    }

    try {
      // Decode base64 to ArrayBuffer
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Queue audio
      audioQueueRef.current.push(bytes.buffer);

      // Start playing queue if not already playing
      if (!isPlayingRef.current) {
        playQueue();
      }

    } catch (err) {
      console.error('Audio playback error:', err);
    }
  }, [initialize]);

  /**
   * Play queued audio sequentially
   */
  const playQueue = useCallback(async () => {
    if (!audioContextRef.current || audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      return;
    }

    isPlayingRef.current = true;
    const audioBuffer = audioQueueRef.current.shift()!;

    try {
      // Decode audio buffer
      const decodedBuffer = await audioContextRef.current.decodeAudioData(audioBuffer);

      // Create source and play
      const source = audioContextRef.current.createBufferSource();
      source.buffer = decodedBuffer;
      source.connect(audioContextRef.current.destination);

      source.onended = () => {
        // Play next in queue
        playQueue();
      };

      source.start();

    } catch (err) {
      console.error('Audio decode error:', err);
      isPlayingRef.current = false;
    }
  }, []);

  /**
   * Clear audio queue
   */
  const clearQueue = useCallback(() => {
    audioQueueRef.current = [];
  }, []);

  return {
    playAudio,
    clearQueue,
    initialize
  };
};
