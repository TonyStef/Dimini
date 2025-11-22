'use client';

import { useState, useEffect } from 'react';
import { useVoiceSession } from '@/hooks/useVoiceSession';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VoiceStatusIndicator from '@/components/VoiceStatusIndicator';
import { Square, Timer, User, Activity, Mic, MicOff } from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================================
// Props
// ============================================================================

interface LiveSessionViewProps {
  sessionId: string;
  patientId: string | null;
  onEndSession: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function LiveSessionView({
  sessionId,
  patientId,
  onEndSession,
}: LiveSessionViewProps) {
  const [sessionDuration, setSessionDuration] = useState(0);

  // Use voice session hook
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

  // Mock patient data - replace with real data later
  const patientName = patientId ? 'Patient Name' : 'Quick Start Session';

  // ========================================
  // Auto-start session and timer
  // ========================================

  useEffect(() => {
    startSession();

    return () => {
      endSession();
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // ========================================
  // Format Duration
  // ========================================

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ========================================
  // Handle End Session
  // ========================================

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
          {/* Left Panel - Session Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Session Info Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Session Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Patient */}
                  {patientId && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Patient</p>
                        <p className="font-medium">{patientName}</p>
                      </div>
                    </div>
                  )}

                  {/* Duration */}
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-xs text-muted-foreground">Duration</p>
                      <p className="font-medium text-xl font-mono">{formatDuration(sessionDuration)}</p>
                    </div>
                  </div>

                  {/* Session ID */}
                  <div>
                    <p className="text-xs text-muted-foreground">Session ID</p>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {sessionId}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Voice Status Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
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
            </motion.div>

            {/* Current Emotion Card */}
            {primaryEmotion && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
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
              </motion.div>
            )}
          </div>

          {/* Right Panel - Live Graph */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="h-full"
            >
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
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
