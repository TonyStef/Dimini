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

      // Get WebSocket connection (waits for connection to open)
      const ws = await connectToHume(configId);
      wsRef.current = ws;

      console.log('HUME: Connected');

      // Set up message handlers AFTER connection is established
      ws.onmessage = (event) => {
        const message: HumeMessage = JSON.parse(event.data);
        console.log('HUME:', message.type);

        if (onMessageCallbackRef.current) {
          onMessageCallbackRef.current(message);
        }
      };

      ws.onerror = (error) => {
        console.error('HUME: WebSocket error', error);
        setState({ connected: false, error: 'Connection error', status: 'error' });
      };

      ws.onclose = () => {
        console.log('HUME: Disconnected');
        setState({ connected: false, error: null, status: 'disconnected' });
      };

      // Send session settings (match actual audio format: webm)
      ws.send(JSON.stringify({
        type: 'session_settings',
        audio: {
          encoding: 'webm',
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
    console.log(`[HUME] Sending: ${audioBlob.size} bytes, ${audioBlob.type}`);

    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error('[HUME] WebSocket NOT READY:', wsRef.current?.readyState);
      return;
    }

    console.log('[HUME] WebSocket is OPEN, converting to base64...');

    // Simple blob to base64 - NO CONVERSION NEEDED!
    const reader = new FileReader();
    reader.onloadend = () => {
      // Re-check WebSocket state inside callback (async race condition fix)
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        console.warn('[HUME] WebSocket closed during file read, dropping chunk');
        return;
      }

      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(',')[1]; // Remove "data:audio/webm;base64," prefix
      console.log(`[HUME] Base64 length: ${base64.length}, sending to Hume...`);

      wsRef.current.send(JSON.stringify({
        type: 'audio_input',
        data: base64
      }));

      console.log('[HUME] Audio SENT to Hume');
    };
    reader.onerror = (err) => {
      console.error('HUME: Failed to read audio blob:', err);
    };
    reader.readAsDataURL(audioBlob);
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

