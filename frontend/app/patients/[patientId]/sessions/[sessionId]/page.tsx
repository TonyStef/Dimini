'use client';

/**
 * Live Session Page with Real-time Knowledge Graph
 *
 * Features:
 * - Real-time semantic graph visualization
 * - Multi-tier insights (Weighted Degree, PageRank, Betweenness)
 * - WebSocket integration for live updates
 * - Session controls (end session)
 */

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useRealtimeGraph } from '@/hooks/useRealtimeGraph';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SemanticGraph from '@/components/SemanticGraph';
import { ArrowLeft, Circle, XCircle } from 'lucide-react';
import Link from 'next/link';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export default function SessionViewPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;
  const sessionId = params.sessionId as string;

  const { user, loading: authLoading } = useAuth();
  const { graphData, loading: graphLoading } = useRealtimeGraph(sessionId);
  const [sessionStatus, setSessionStatus] = useState<'active' | 'completed'>('active');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  const endSession = async () => {
    try {
      const token = localStorage.getItem('token');

      const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/end`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to end session: ${response.statusText}`);
      }

      setSessionStatus('completed');
    } catch (error) {
      console.error('Failed to end session:', error);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-xl text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b bg-surface">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" asChild>
                <Link href={`/patients/${patientId}`}>
                  <ArrowLeft className="h-5 w-5" />
                </Link>
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Live Session</h1>
                <p className="text-sm text-muted-foreground">Session ID: {sessionId.slice(0, 8)}...</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <Badge
                variant="default"
                className={sessionStatus === 'active'
                  ? 'bg-green-500 hover:bg-green-600 flex items-center gap-2'
                  : 'bg-gray-500 flex items-center gap-2'
                }
              >
                {sessionStatus === 'active' ? (
                  <>
                    <Circle className="h-2 w-2 fill-current animate-pulse" />
                    Live
                  </>
                ) : (
                  'Completed'
                )}
              </Badge>

              <Button
                variant="destructive"
                onClick={endSession}
                disabled={sessionStatus === 'completed'}
                size="sm"
              >
                <XCircle className="h-4 w-4 mr-2" />
                End Session
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content: Graph Visualization */}
      <div className="flex-1 container mx-auto px-6 py-6">
        <div className="h-full grid grid-cols-3 gap-6">
          {/* Graph (2/3 width) */}
          <Card className="col-span-2 p-0 overflow-hidden h-[calc(100vh-200px)]">
            <SemanticGraph
              graphData={graphData}
              loading={graphLoading}
              highlightMetric="pagerank"
            />
          </Card>

          {/* Stats Sidebar (1/3 width) */}
          <div className="space-y-4">
            <Card className="p-4">
              <h3 className="text-sm font-semibold mb-2">Graph Stats</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Nodes:</span>
                  <span className="font-medium">{graphData.nodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Connections:</span>
                  <span className="font-medium">{graphData.links.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Topics:</span>
                  <span className="font-medium text-blue-500">
                    {graphData.nodes.filter(n => n.type === 'topic').length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Emotions:</span>
                  <span className="font-medium text-red-500">
                    {graphData.nodes.filter(n => n.type === 'emotion').length}
                  </span>
                </div>
              </div>
            </Card>

            {graphData.nodes.length === 0 && (
              <Card className="p-4 bg-blue-500/10 border-blue-500/20">
                <p className="text-sm text-muted-foreground">
                  Waiting for entities to appear in the conversation...
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
