# Hume AI Voice Session Implementation Plan

**Version:** 1.0
**Last Updated:** 2025-01-22
**Scope:** Phase 1 - Hume AI connection + audio + tools (NO graph/Neo4j yet)

---

## Overview

**Goal:** Implement working voice sessions with Hume AI EVI where therapist can start session, talk to AI voice agent, and test tool calling functionality.

**Out of Scope (Phase 2):**
- Knowledge graph visualization
- Neo4j integration
- Real-time graph updates via WebSocket
- Semantic relationship mapping

**In Scope (Phase 1):**
- Hume AI WebSocket connection from frontend
- Browser microphone capture + streaming
- Receive and play Hume AI audio responses
- Patient context injection
- Tool execution (save_note, mark_progress, flag_concern)
- Session lifecycle management

---

## Architecture Summary

```
Frontend (Browser)
├── Microphone → MediaRecorder (WebM, 80ms chunks)
├── WebSocket → Hume AI EVI (wss://api.hume.ai/v0/evi/chat)
├── Audio Playback ← Hume AI responses
└── Session UI (timer, status, voice indicator)

Backend (FastAPI)
├── Token generation endpoint → Hume OAuth2
├── Patient context endpoint → Fetch + inject history
├── Session management → PostgreSQL
└── Tool handlers → Already implemented ✓

Hume AI EVI
├── Receives: Audio (WebM) + Context
├── Processes: STT → LLM (GPT-4o-mini) → TTS
├── Calls: Tools (save_note, mark_progress, etc.)
└── Returns: Audio + Emotions + Tool responses
```

---

## Task Breakdown

### PHASE 1A: Backend Foundation (6-8 hours)

#### Task 1.1: Hume Token Generation Endpoint
**File:** `backend/app/api/hume.py` (new file)
**Priority:** P0 (blocker)

**Implementation:**
```python
from fastapi import APIRouter, HTTPException
from app.voice_agent.services.hume_service import HumeService
from app.config import settings

router = APIRouter(prefix="/api/hume", tags=["hume"])

@router.post("/token")
async def get_session_token():
    """
    Generate Hume AI session token for frontend WebSocket connection.

    Returns:
        {
            "access_token": "...",
            "expires_in": 900
        }
    """
    try:
        hume_service = HumeService(
            api_key=settings.HUME_API_KEY,
            secret_key=settings.HUME_SECRET_KEY,
            config_id=settings.HUME_CONFIG_ID
        )

        token = await hume_service.create_session_token()

        return {
            "access_token": token,
            "expires_in": 900  # 15 minutes
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Token generation failed: {str(e)}")
```

**Testing:**
```bash
curl -X POST http://localhost:8000/api/hume/token
# Expected: {"access_token": "ey...", "expires_in": 900}
```

**Acceptance Criteria:**
- [ ] Returns valid access_token
- [ ] Token works with Hume WebSocket
- [ ] Error handling for invalid credentials
- [ ] Logs token generation

---

#### Task 1.2: Patient Context Injection Endpoint
**File:** `backend/app/api/sessions.py` (extend existing)
**Priority:** P0

**Implementation:**
```python
@router.post("/{session_id}/inject-context")
async def inject_patient_context(
    session_id: str,
    patient_id: str = Body(..., embed=True)
):
    """
    Inject patient history into active Hume session.

    Called after Hume WebSocket connected and before user speaks.

    Args:
        session_id: Session UUID
        patient_id: Patient UUID

    Returns:
        {"status": "context_injected", "patient_name": "..."}
    """
    try:
        # Fetch patient history
        from app.voice_agent.services.patient_service import PatientService

        patient_service = PatientService()
        patient_history = await patient_service.fetch_patient_history(patient_id)

        # Format for Hume context
        context_text = patient_service.format_history_for_context(patient_history)

        # Store in session for later reference
        # (HumeService instance should be managed per session)
        # For now: Direct HTTP call to Hume or store context for next message

        # TODO: Session-scoped HumeService management
        # Temporary: Return context for frontend to send

        return {
            "status": "context_injected",
            "patient_name": patient_history.get("name"),
            "context_length": len(context_text)
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
```

**Alternative approach (simpler for Phase 1):**
```python
@router.get("/patients/{patient_id}/context")
async def get_patient_context_text(patient_id: str):
    """
    Get formatted patient context text for frontend to send to Hume.

    Simpler approach: Frontend sends context directly to Hume as user_input.
    """
    from app.voice_agent.services.patient_service import PatientService

    patient_service = PatientService()
    patient_history = await patient_service.fetch_patient_history(patient_id)
    context_text = patient_service.format_history_for_context(patient_history)

    return {
        "context_text": context_text,
        "patient_name": patient_history.get("name")
    }
```

**Testing:**
```bash
curl http://localhost:8000/api/sessions/patients/{patient_id}/context
```

**Acceptance Criteria:**
- [ ] Returns formatted context text
- [ ] Handles missing patient gracefully
- [ ] Context includes: demographics, diagnoses, triggers, goals
- [ ] Under 2000 characters (Hume context limit)

---

#### Task 1.3: Environment Variables Setup
**File:** `backend/.env`
**Priority:** P0

**Required variables:**
```env
# Existing
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_service_role_key

# NEW - Add these
HUME_API_KEY=your_hume_api_key
HUME_SECRET_KEY=your_hume_secret_key
HUME_CONFIG_ID=your_hume_config_id

# Frontend URL for CORS
FRONTEND_URL=http://localhost:3000
```

**File:** `backend/app/config.py` (extend existing)
```python
class Settings(BaseSettings):
    # ... existing fields ...

    # Hume AI
    HUME_API_KEY: str
    HUME_SECRET_KEY: str
    HUME_CONFIG_ID: str

    # Frontend
    FRONTEND_URL: str = "http://localhost:3000"
```

**Acceptance Criteria:**
- [ ] All Hume credentials configured
- [ ] Config loads without errors
- [ ] Credentials validated (test token generation)

---

#### Task 1.4: Update Main App with New Routes
**File:** `backend/app/main.py`
**Priority:** P0

**Implementation:**
```python
from app.api import patients, sessions, health, webhooks
from app.api import hume  # NEW

# ... existing code ...

# Include routers
app.include_router(health.router, prefix="/api", tags=["health"])
app.include_router(patients.router, prefix="/api/patients", tags=["patients"])
app.include_router(sessions.router, prefix="/api/sessions", tags=["sessions"])
app.include_router(webhooks.router)  # Has /webhooks prefix
app.include_router(hume.router)  # NEW - Has /api/hume prefix
```

**CORS update:**
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Testing:**
```bash
curl http://localhost:8000/docs
# Should see /api/hume/token endpoint in Swagger
```

**Acceptance Criteria:**
- [ ] Hume routes visible in /docs
- [ ] CORS allows frontend origin
- [ ] Health check still works

---

### PHASE 1B: Frontend Audio Infrastructure (8-10 hours)

#### Task 2.1: Hume API Client
**File:** `frontend/lib/hume.ts` (new file)
**Priority:** P0

**Implementation:**
```typescript
const HUME_WS_URL = 'wss://api.hume.ai/v0/evi/chat';
const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export interface HumeSessionToken {
  access_token: string;
  expires_in: number;
}

export interface HumeAudioSettings {
  encoding: 'linear16';
  sample_rate: number;
  channels: number;
}

/**
 * Get Hume session token from backend
 */
export async function getHumeSessionToken(): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/hume/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });

  if (!response.ok) {
    throw new Error(`Token generation failed: ${response.statusText}`);
  }

  const data: HumeSessionToken = await response.json();
  return data.access_token;
}

/**
 * Get patient context text for injection
 */
export async function getPatientContext(patientId: string): Promise<string> {
  const response = await fetch(`${BACKEND_URL}/api/patients/${patientId}/context`);

  if (!response.ok) {
    throw new Error(`Context fetch failed: ${response.statusText}`);
  }

  const data = await response.json();
  return data.context_text;
}

/**
 * Connect to Hume WebSocket
 */
export async function connectToHume(configId: string): Promise<WebSocket> {
  const token = await getHumeSessionToken();
  const url = `${HUME_WS_URL}?access_token=${token}&config_id=${configId}`;

  return new WebSocket(url);
}
```

**Environment variables:**
```env
# frontend/.env.local
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_HUME_CONFIG_ID=your_config_id
```

**Acceptance Criteria:**
- [ ] Token fetched successfully
- [ ] WebSocket connection established
- [ ] Patient context retrieved
- [ ] Error handling for network failures

---

#### Task 2.2: Audio Capture Hook
**File:** `frontend/hooks/useAudioCapture.ts` (new file)
**Priority:** P0

**Implementation:**
```typescript
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
        if (event.data.size > 0) {
          onAudioData(event.data);
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
```

**Testing approach:**
```typescript
// Test component
const AudioTest = () => {
  const { startCapture, stopCapture, isRecording } = useAudioCapture();

  const handleStart = () => {
    startCapture((blob) => {
      console.log('Audio chunk:', blob.size, 'bytes');
    });
  };

  return (
    <div>
      <button onClick={handleStart}>Start</button>
      <button onClick={stopCapture}>Stop</button>
      <p>{isRecording ? 'Recording' : 'Idle'}</p>
    </div>
  );
};
```

**Acceptance Criteria:**
- [ ] Microphone permission requested
- [ ] Audio chunks generated every 80ms
- [ ] WebM format used (or mp4 fallback)
- [ ] Clean stop without errors
- [ ] Error handling for denied permissions

---

#### Task 2.3: Hume WebSocket Hook
**File:** `frontend/hooks/useHumeWebSocket.ts` (new file)
**Priority:** P0

**Implementation:**
```typescript
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

        // Send session settings (WebM doesn't need explicit settings)
        ws.send(JSON.stringify({
          type: 'session_settings',
          audio: {
            encoding: 'webm'  // Auto-detected by Hume
          }
        }));

        // Inject patient context if provided
        if (patientId) {
          const contextText = await getPatientContext(patientId);

          ws.send(JSON.stringify({
            type: 'user_input',
            text: contextText
          }));

          console.log('HUME: Context injected');
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
```

**Acceptance Criteria:**
- [ ] WebSocket connects successfully
- [ ] Session settings sent
- [ ] Patient context injected (if provided)
- [ ] Audio data sent as base64
- [ ] Messages received and logged
- [ ] Clean disconnect

---

#### Task 2.4: Audio Playback Hook
**File:** `frontend/hooks/useAudioPlayback.ts` (new file)
**Priority:** P1

**Implementation:**
```typescript
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
```

**Acceptance Criteria:**
- [ ] Audio decoded from base64
- [ ] Queue prevents overlapping playback
- [ ] Clean playback without stuttering
- [ ] Error handling for invalid audio

---

### PHASE 1C: Session UI Integration (6-8 hours)

#### Task 3.1: Unified Voice Session Hook
**File:** `frontend/hooks/useVoiceSession.ts` (new file)
**Priority:** P0

**Implementation:**
```typescript
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
```

**Acceptance Criteria:**
- [ ] Full session lifecycle managed
- [ ] Audio capture + WebSocket coordinated
- [ ] Messages processed correctly
- [ ] Emotions tracked
- [ ] Clean teardown

---

#### Task 3.2: Update LiveSessionView Component
**File:** `frontend/components/LiveSessionView.tsx`
**Priority:** P0

**Changes:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VoiceStatusIndicator from '@/components/VoiceStatusIndicator';
import { Square, Timer, User, Activity, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

interface LiveSessionViewProps {
  sessionId: string;
  patientId: string | null;
  onEndSession: () => void;
}

export default function LiveSessionView({
  sessionId,
  patientId,
  onEndSession,
}: LiveSessionViewProps) {
  const [sessionDuration, setSessionDuration] = useState(0);

  // NEW: Use voice session hook
  const {
    startSession,
    endSession,
    status,
    error,
    emotions,
    lastMessage,
    isRecording,
    connected
  } = useVoiceSession(sessionId, patientId || undefined);

  // Auto-start session when component mounts
  useEffect(() => {
    startSession();

    return () => {
      endSession();
    };
  }, []);

  // Session timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndSession = async () => {
    if (window.confirm('Are you sure you want to end this session?')) {
      await endSession();
      onEndSession();
    }
  };

  // Determine voice status
  const voiceStatus: 'listening' | 'processing' | 'idle' =
    !connected ? 'idle' :
    isRecording ? 'listening' :
    'processing';

  // Get primary emotion
  const primaryEmotion = emotions
    ? Object.entries(emotions).sort(([,a], [,b]) => b - a)[0]
    : null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-surface">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${
                  connected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                }`}></div>
                <h1 className="text-2xl font-bold">Live Session</h1>
              </div>
              <Badge variant="default" className={
                connected ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'
              }>
                {connected ? 'Connected' : 'Disconnected'}
              </Badge>
              {status === 'error' && (
                <Badge variant="destructive">Error: {error}</Badge>
              )}
            </div>

            <Button
              variant="destructive"
              size="lg"
              onClick={handleEndSession}
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              End Session
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Session Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {patientId && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Patient</p>
                      <p className="font-medium">Patient Name</p>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-medium text-xl font-mono">
                      {formatDuration(sessionDuration)}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground">Session ID</p>
                  <p className="text-xs font-mono text-muted-foreground truncate">
                    {sessionId}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Voice Status */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Voice Status</CardTitle>
              </CardHeader>
              <CardContent>
                <VoiceStatusIndicator status={voiceStatus} />
                <div className="mt-4 flex items-center gap-2">
                  {isRecording ? (
                    <Mic className="h-4 w-4 text-green-500 animate-pulse" />
                  ) : (
                    <MicOff className="h-4 w-4 text-gray-400" />
                  )}
                  <span className="text-sm">
                    {isRecording ? 'Recording' : 'Idle'}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Emotions */}
            {primaryEmotion && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Current Emotion</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <p className="text-2xl font-bold capitalize">
                      {primaryEmotion[0]}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Intensity: {(primaryEmotion[1] * 100).toFixed(0)}%
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Panel - Transcript */}
          <div className="lg:col-span-2">
            <Card className="h-full min-h-[600px]">
              <CardHeader className="border-b">
                <div className="flex items-center justify-between">
                  <CardTitle>Live Transcript</CardTitle>
                  <Badge variant="outline">
                    <Activity className="h-3 w-3 mr-1 animate-pulse" />
                    Real-time
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-8 h-[calc(100%-80px)] overflow-y-auto">
                {lastMessage ? (
                  <div className="space-y-4">
                    <p className="text-sm">{lastMessage}</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <Activity className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-pulse" />
                      <h3 className="text-xl font-semibold mb-2">
                        Waiting for conversation...
                      </h3>
                      <p className="text-muted-foreground max-w-md">
                        Start speaking to see the transcript and emotion analysis appear here.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
```

**Acceptance Criteria:**
- [ ] Session auto-starts on mount
- [ ] Real-time voice status updates
- [ ] Emotions displayed
- [ ] Transcript shows messages
- [ ] Clean session end

---

### PHASE 1D: Testing & Debugging (4-6 hours)

#### Task 4.1: Manual Testing Checklist

**Test 1: Quick Start Session (No Patient)**
- [ ] Navigate to /sessions
- [ ] Click "Quick Start"
- [ ] Microphone permission requested
- [ ] Hume connection established
- [ ] Green "Connected" badge shown
- [ ] Speak: "Hello, can you hear me?"
- [ ] Assistant responds with audio
- [ ] Transcript shows conversation
- [ ] Click "End Session" → Returns to sessions list

**Test 2: Session with Patient Context**
- [ ] Create test patient with demographics
- [ ] Start session with patient selected
- [ ] Verify context injected (check network tab)
- [ ] Assistant references patient details
- [ ] Session saves correctly

**Test 3: Tool Calling**
- [ ] Start session
- [ ] Say something emotionally significant
- [ ] Check backend logs for tool calls
- [ ] Verify save_session_note called
- [ ] Check database for saved notes

**Test 4: Error Handling**
- [ ] Deny microphone permission → Show error
- [ ] Invalid Hume credentials → Show error
- [ ] Network disconnect → Graceful handling
- [ ] Reconnection attempt works

**Test 5: Audio Quality**
- [ ] No echo or feedback
- [ ] Clear audio playback
- [ ] No stuttering or lag
- [ ] Acceptable latency (<2s response)

---

#### Task 4.2: Backend Logging Enhancement
**File:** `backend/app/voice_agent/services/hume_service.py`

**Add detailed logging:**
```python
# In receive_from_hume method
logger.info(f"HUME: Message received - type: {msg_type}")

# In handle_tool_call
logger.info(f"TOOL CALL: {tool_name}")
logger.info(f"TOOL PARAMS: {tool_params}")
logger.info(f"TOOL RESULT: {tool_result}")
```

**Acceptance Criteria:**
- [ ] All Hume messages logged
- [ ] Tool calls visible in logs
- [ ] Timestamps for debugging
- [ ] Error stack traces captured

---

#### Task 4.3: Frontend DevTools Integration
**File:** `frontend/hooks/useVoiceSession.ts`

**Add debug logging:**
```typescript
// In startSession
console.log('SESSION: Starting session', sessionId);

// In message handler
console.log('HUME MESSAGE:', message.type, message);

// In emotion update
console.log('EMOTIONS:', emotions);
```

**Browser DevTools checklist:**
- [ ] Network tab shows WebSocket connection
- [ ] Console shows message flow
- [ ] No CORS errors
- [ ] Audio chunks sent every ~80ms

---

### PHASE 1E: Documentation & Handoff (2-3 hours)

#### Task 5.1: Testing Guide
**File:** `backend/TESTING_VOICE_SESSIONS.md`

```markdown
# Voice Session Testing Guide

## Prerequisites
- Hume AI account with API keys
- Deployed EVI configuration
- Backend running on :8000
- Frontend running on :3000

## Test Scenarios

### 1. Basic Voice Flow
1. Start session
2. Say: "I've been feeling anxious about work"
3. Expected: Assistant responds empathetically
4. Expected: Tool call: save_session_note (category: observation)

### 2. Emotion Detection
1. Speak with emotional tone
2. Check emotion display updates
3. Verify intensity matches tone

### 3. Tool Execution
Look for these patterns:
- High emotion → update_kg_important called
- Progress mentioned → mark_progress called
- Concern expressed → flag_concern called

## Debugging

### WebSocket Issues
```bash
# Check Hume connection in browser console
# Should see: "HUME: Connected"
```

### Audio Issues
- Check microphone permissions in browser settings
- Verify MediaRecorder.isTypeSupported('audio/webm')
- Check AudioContext sampleRate in console

### Backend Logs
```bash
cd backend
tail -f app.log | grep -E "HUME|TOOL"
```
```

---

## Timeline Estimate

**Total: 26-35 hours (3.5-4.5 days full-time)**

| Phase | Tasks | Hours |
|-------|-------|-------|
| 1A: Backend Foundation | 1.1-1.4 | 6-8h |
| 1B: Frontend Audio | 2.1-2.4 | 8-10h |
| 1C: Session UI | 3.1-3.2 | 6-8h |
| 1D: Testing | 4.1-4.3 | 4-6h |
| 1E: Documentation | 5.1 | 2-3h |

---

## Success Criteria

### Minimum Viable Product (MVP)
- [ ] Therapist can start voice session
- [ ] Audio captured from microphone
- [ ] Hume AI responds with voice
- [ ] Tools called automatically (visible in logs)
- [ ] Session ends cleanly

### Nice to Have (Phase 1.5)
- [ ] Patient context properly injected
- [ ] Emotions displayed in UI
- [ ] Transcript shows full conversation
- [ ] Multiple concurrent sessions supported

### Phase 2 (Later)
- [ ] Graph visualization
- [ ] Neo4j integration
- [ ] Real-time WebSocket to backend
- [ ] Knowledge graph updates

---

## Troubleshooting Guide

### Issue: WebSocket connection fails
**Symptoms:** "Connection error" in UI
**Check:**
1. Hume API keys correct in .env
2. CORS enabled for frontend URL
3. Token generation endpoint working

**Debug:**
```bash
curl -X POST http://localhost:8000/api/hume/token
```

---

### Issue: No audio playback
**Symptoms:** Assistant text appears but no sound
**Check:**
1. Browser audio permissions
2. AudioContext initialized (requires user gesture)
3. Base64 decoding successful

**Debug:**
```javascript
// In browser console
audioContextRef.current.state // Should be "running"
```

---

### Issue: Microphone not working
**Symptoms:** "Microphone access denied"
**Solutions:**
1. Grant permissions in browser settings
2. Use HTTPS (required for getUserMedia)
3. Check browser compatibility

---

### Issue: Tools not being called
**Symptoms:** Conversation works but no tool logs
**Check:**
1. Hume configuration has tools defined
2. System prompt mentions tools
3. Webhook endpoint configured (if using webhooks)

**Debug:**
```bash
# Backend logs should show:
# TOOL CALL: save_session_note
```

---

## Next Steps (Phase 2)

Once Phase 1 is stable:

1. **Graph Visualization**
   - Implement react-force-graph-2d
   - Subscribe to Supabase real-time
   - Display nodes/edges from tools

2. **Neo4j Integration**
   - Implement KGService
   - Store graph data in Neo4j
   - Query relationships

3. **Advanced Features**
   - Session summaries
   - Patient history timeline
   - Multi-therapist support
   - Session recordings

---

## Environment Variables Reference

### Backend (.env)
```env
HUME_API_KEY=your_api_key
HUME_SECRET_KEY=your_secret_key
HUME_CONFIG_ID=your_config_id
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your_key
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8000
NEXT_PUBLIC_HUME_CONFIG_ID=your_config_id
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Quick Start Commands

```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Frontend
cd frontend
npm run dev

# Test Hume connection
curl -X POST http://localhost:8000/api/hume/token

# Check logs
tail -f backend/app.log | grep HUME
```

---

**End of Implementation Plan v1.0**
