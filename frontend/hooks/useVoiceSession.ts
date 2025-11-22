'use client';

import { useState, useCallback, useEffect } from 'react';
import { useAudioCapture } from './useAudioCapture';
import { useHumeWebSocket } from './useHumeWebSocket';
import { useAudioPlayback } from './useAudioPlayback';

interface VoiceSessionState {
  status: 'idle' | 'connecting' | 'active' | 'error';
  error: string | null;
  emotions: { [key: string]: number } | null;
  lastMessage: string | null;
}

export const useVoiceSession = (
  sessionId: string,
  patientId?: string
) => {
  const [state, setState] = useState<VoiceSessionState>({
    status: 'idle',
    error: null,
    emotions: null,
    lastMessage: null
  });

  const configId = process.env.NEXT_PUBLIC_HUME_CONFIG_ID!;

  const { startCapture, stopCapture, isRecording } = useAudioCapture();
  const { connect, disconnect, sendAudio, onMessage, connected } = useHumeWebSocket(configId);
  const { playAudio, initialize: initAudio, clearQueue } = useAudioPlayback();

  /**
   * Start voice session
   */
  const startSession = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, status: 'connecting' }));

      // Initialize audio playback (requires user gesture)
      initAudio();

      // Connect to Hume
      await connect(patientId);

      // Start microphone capture
      await startCapture(async (audioBlob) => {
        await sendAudio(audioBlob);
      });

      setState(prev => ({ ...prev, status: 'active', error: null }));

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Session start failed';
      setState({ status: 'error', error, emotions: null, lastMessage: null });
    }
  }, [connect, startCapture, sendAudio, patientId, initAudio]);

  /**
   * End voice session
   */
  const endSession = useCallback(async () => {
    stopCapture();
    disconnect();
    clearQueue();
    setState({ status: 'idle', error: null, emotions: null, lastMessage: null });

    // Call backend to finalize session
    try {
      await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/sessions/${sessionId}/end`, {
        method: 'POST'
      });
    } catch (err) {
      console.error('Session end error:', err);
    }
  }, [stopCapture, disconnect, clearQueue, sessionId]);

  /**
   * Handle messages from Hume
   */
  useEffect(() => {
    onMessage((message) => {
      switch (message.type) {
        case 'audio_output':
          // Play assistant response
          playAudio(message.data);
          break;

        case 'user_message':
          // Update emotions and transcript
          const emotions = message.message?.models?.prosody?.scores || {};
          const content = message.message?.content || '';

          setState(prev => ({
            ...prev,
            emotions,
            lastMessage: `Patient: ${content}`
          }));
          break;

        case 'assistant_message':
          // Update with assistant response
          const assistantContent = message.message?.content || '';
          setState(prev => ({
            ...prev,
            lastMessage: `Assistant: ${assistantContent}`
          }));
          break;

        case 'tool_call':
          console.log('Tool called:', message.name);
          break;

        case 'error':
          console.error('Hume error:', message);
          break;
      }
    });
  }, [onMessage, playAudio]);

  return {
    startSession,
    endSession,
    status: state.status,
    error: state.error,
    emotions: state.emotions,
    lastMessage: state.lastMessage,
    isRecording,
    connected
  };
};
