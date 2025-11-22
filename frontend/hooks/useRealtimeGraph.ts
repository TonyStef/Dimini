'use client';

/**
 * Real-time Graph Data Hook
 *
 * Connects to backend WebSocket for live graph updates during therapy sessions.
 * Receives batch updates to prevent excessive re-renders.
 *
 * Features:
 * - Initial graph load from REST API
 * - Real-time WebSocket updates via Socket.IO
 * - Batch update processing (prevents 50+ re-renders)
 * - Automatic reconnection on disconnect
 */

import { useEffect, useState } from 'react';
import { GraphData, GraphNode, GraphEdge } from '@/lib/types';
import { io, Socket } from 'socket.io-client';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000';

export function useRealtimeGraph(sessionId: string | null) {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    let socket: Socket | null = null;

    // Initial load from API
    loadInitialGraph();

    // Connect to Socket.IO for real-time updates
    socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    socket.on('connect', () => {
      console.log('[useRealtimeGraph] Socket connected');

      // Join session room
      socket?.emit('join_session', { session_id: sessionId });
    });

    socket.on('joined_session', (data: any) => {
      console.log('[useRealtimeGraph] Joined session:', data.session_id);
    });

    // BATCH UPDATE LISTENER: Receive all nodes+edges in single message
    socket.on('graph_batch_update', (payload: any) => {
      console.log('[useRealtimeGraph] Batch update:', payload);

      // Convert nodes
      const newNodes: GraphNode[] = (payload.nodes || []).map((node: any) => ({
        id: node.node_id,
        label: node.label,
        type: node.type,
        group: node.type === 'EMOTION' ? 1 : 2,
        weightedDegree: node.weighted_degree || 0,
        pagerank: node.pagerank || 0.15,
        betweenness: node.betweenness || 0,
        mentionCount: node.mention_count || 1
      }));

      // Convert edges
      const newEdges: GraphEdge[] = (payload.edges || []).map((edge: any) => ({
        source: edge.source,
        target: edge.target,
        value: edge.similarity
      }));

      // Single state update (triggers ONE re-render instead of 50+)
      setGraphData(prev => ({
        nodes: [...prev.nodes, ...newNodes],
        links: [...prev.links, ...newEdges]
      }));
    });

    // Listen for metrics updates (Tier 2 & 3)
    socket.on('metrics_updated', (payload: any) => {
      console.log('[useRealtimeGraph] Metrics updated:', payload);

      // Update node metrics
      setGraphData(prev => ({
        ...prev,
        nodes: prev.nodes.map(node => {
          const updated = payload.entities?.find((e: any) => e.node_id === node.id);
          if (updated) {
            return {
              ...node,
              pagerank: updated.pagerank || node.pagerank,
              betweenness: updated.betweenness || node.betweenness,
              weightedDegree: updated.weighted_degree || node.weightedDegree
            };
          }
          return node;
        })
      }));
    });

    socket.on('disconnect', () => {
      console.log('[useRealtimeGraph] Socket disconnected');
    });

    socket.on('error', (err: any) => {
      console.error('[useRealtimeGraph] Socket error:', err);
      setError(err.message || 'WebSocket connection error');
    });

    // Cleanup
    return () => {
      if (socket) {
        socket.emit('leave_session', { session_id: sessionId });
        socket.disconnect();
      }
    };
  }, [sessionId]);

  async function loadInitialGraph() {
    if (!sessionId) return;

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/graph`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to load graph: ${response.statusText}`);
      }

      const data = await response.json();

      // Transform to graph format
      const transformedNodes: GraphNode[] = (data.nodes || []).map((node: any) => ({
        id: node.id,
        label: node.label,
        type: node.type,
        group: node.type === 'emotion' ? 1 : 2,
        weightedDegree: node.weightedDegree || 0,
        pagerank: node.pagerank || 0.15,
        betweenness: node.betweenness || 0,
        mentionCount: node.mentionCount || 1
      }));

      const transformedEdges: GraphEdge[] = (data.links || []).map((edge: any) => ({
        source: edge.source,
        target: edge.target,
        value: edge.value
      }));

      setGraphData({
        nodes: transformedNodes,
        links: transformedEdges
      });

      setLoading(false);
    } catch (err: any) {
      console.error('[useRealtimeGraph] Error loading graph:', err);
      setError(err.message || 'Failed to load graph data');
      setLoading(false);
    }
  }

  return {
    graphData,
    loading,
    error,
    refresh: loadInitialGraph
  };
}
