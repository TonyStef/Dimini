'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  Mic,
  Circle,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';

// ============================================================================
// Main Component
// ============================================================================

export default function SessionViewPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const sessionId = params.sessionId as string;

  const { user, loading: authLoading } = useAuth();

  // ========================================
  // Auth Check
  // ========================================

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // ========================================
  // Loading State
  // ========================================

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // ========================================
  // Render
  // ========================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-surface">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Back Button and Title */}
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/patients/${patientId}`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Live Session</h1>
                <p className="text-sm text-muted-foreground">Session ID: {sessionId}</p>
              </div>
            </div>

            {/* Status Badge */}
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 flex items-center gap-2">
              <Circle className="h-2 w-2 fill-current animate-pulse" />
              Active Session
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Placeholder Card */}
          <Card className="border-2 border-dashed">
            <CardContent className="py-16 text-center">
              <div className="inline-block p-6 bg-surface-elevated rounded-full mb-6">
                <Mic className="h-16 w-16 text-primary" />
              </div>

              <h2 className="text-3xl font-bold mb-4">Voice AI Integration</h2>

              <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
                This page will display the real-time semantic graph during therapy sessions.
                Voice AI integration is in progress.
              </p>

              {/* Info Alert */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-6 text-left max-w-lg mx-auto mb-8">
                <div className="flex gap-3">
                  <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <h3 className="font-semibold text-blue-500 mb-2">Coming Soon</h3>
                    <p className="text-sm text-muted-foreground">
                      The live session view will include:
                    </p>
                    <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                      <li>Real-time semantic relationship graph</li>
                      <li>Voice AI transcript streaming</li>
                      <li>Topic and emotion detection</li>
                      <li>Session controls and timer</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-center">
                <Button variant="outline" asChild>
                  <Link href={`/patients/${patientId}`}>
                    Back to Patient
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/patients">
                    All Patients
                  </Link>
                </Button>
              </div>

              {/* Technical Details */}
              <div className="mt-12 pt-8 border-t">
                <p className="text-xs text-muted-foreground">
                  Session Page: /patients/{patientId}/sessions/{sessionId}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
