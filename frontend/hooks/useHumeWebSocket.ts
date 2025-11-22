'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { connectToHume, getPatientContext } from '@/lib/hume';

interface HumeMessage {
  type: string;
  [key: string]: any;
}

interface HumeWebSocketState {
  connected: boolean;
  error: string | null;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
}

export const useHumeWebSocket = (configId: string) => {
  const [state, setState] = useState<HumeWebSocketState>({
    connected: false,
    error: null,
    status: 'disconnected'
  });

  const wsRef = useRef<WebSocket | null>(null);
  const onMessageCallbackRef = useRef<((msg: HumeMessage) => void) | null>(null);

  /**
   * Connect to Hume AI WebSocket
   */
  const connect = useCallback(async (patientId?: string) => {
    try {
      setState(prev => ({ ...prev, status: 'connecting' }));

      // Get WebSocket connection
      const ws = await connectToHume(configId);
      wsRef.current = ws;

      // Connection opened
      ws.onopen = async () => {
        console.log('HUME: Connected');

        // Send session settings (match Hume config: linear16, 48kHz mono)
        ws.send(JSON.stringify({
          type: 'session_settings',
          audio: {
            encoding: 'linear16',
            sample_rate: 48000,
            channels: 1
          }
        }));

        // Inject patient context if provided
        if (patientId) {
          try {
            const contextText = await getPatientContext(patientId);

            if (contextText) {
              ws.send(JSON.stringify({
                type: 'user_input',
                text: contextText
              }));

              console.log('HUME: Context injected');
            } else {
              console.warn('HUME: Context unavailable, continuing without injection');
            }
          } catch (error) {
            console.error('HUME: Failed to inject context', error);
          }
        }

        setState({ connected: true, error: null, status: 'connected' });
      };

      // Handle messages from Hume
      ws.onmessage = (event) => {
        const message: HumeMessage = JSON.parse(event.data);
        console.log('HUME:', message.type);

        if (onMessageCallbackRef.current) {
          onMessageCallbackRef.current(message);
        }
      };

      // Handle errors
      ws.onerror = (error) => {
        console.error('HUME: WebSocket error', error);
        setState({ connected: false, error: 'Connection error', status: 'error' });
      };

      // Handle close
      ws.onclose = () => {
        console.log('HUME: Disconnected');
        setState({ connected: false, error: null, status: 'disconnected' });
      };

    } catch (err) {
      const error = err instanceof Error ? err.message : 'Connection failed';
      setState({ connected: false, error, status: 'error' });
      throw err;
    }
  }, [configId]);

  /**
   * Send audio data to Hume
   */
  const sendAudio = useCallback(async (audioBlob: Blob) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn('HUME: WebSocket not ready');
      return;
    }

    // Convert Blob to base64
    const base64Audio = await blobToBase64(audioBlob);

    wsRef.current.send(JSON.stringify({
      type: 'audio_input',
      data: base64Audio
    }));
  }, []);

  /**
   * Set message handler
   */
  const onMessage = useCallback((callback: (msg: HumeMessage) => void) => {
    onMessageCallbackRef.current = callback;
  }, []);

  /**
   * Disconnect
   */
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    sendAudio,
    onMessage,
    connected: state.connected,
    status: state.status,
    error: state.error
  };
};

/**
 * Helper: Convert Blob to base64 (without data URL prefix)
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1]; // Remove "data:audio/webm;base64," prefix
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}
