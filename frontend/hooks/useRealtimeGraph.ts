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
    console.log('[useRealtimeGraph] Connecting to Socket.IO...', BACKEND_URL);
    socket = io(BACKEND_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      autoConnect: true,
      forceNew: true
    });

    socket.on('connect', () => {
      console.log('[useRealtimeGraph] ✅ Socket CONNECTED - ID:', socket?.id);

      // Join session room
      console.log('[useRealtimeGraph] Joining session room:', sessionId);
      socket?.emit('join_session', { session_id: sessionId });
    });

    socket.on('joined_session', (data: any) => {
      console.log('[useRealtimeGraph] ✅ JOINED session room:', data.session_id);
    });

    // Listen for initial graph state (sent when joining session)
    socket.on('graph_state', (payload: any) => {
      console.log('[useRealtimeGraph] 📊 Initial graph state received:', payload);
      // This is sent by backend when we join, but we already load via REST API
      // Could use this as a fallback if REST API fails
    });

    // BATCH UPDATE LISTENER: Receive all nodes+edges in single message
    socket.on('graph_batch_update', (payload: any) => {
      console.log('[useRealtimeGraph] 🎯 BATCH UPDATE received:', {
        nodes: payload.nodes?.length || 0,
        edges: payload.edges?.length || 0,
        status: payload.status,
        message: payload.message
      });
      console.log('[useRealtimeGraph] Full payload:', payload);

      // Convert nodes
      const newNodes: GraphNode[] = (payload.nodes || []).map((node: any) => ({
        id: node.node_id,
        label: node.label,
        type: node.type,
        group: node.type === 'EMOTION' ? 1 : 2,
        weightedDegree: node.weighted_degree || 0,
        pagerank: node.pagerank || 0.15,
        betweenness: node.betweenness || 0,
        mentionCount: node.mention_count || 1,

        // Random initial positions to break force simulation symmetry
        x: (Math.random() - 0.5) * 600,  // Random X in 600px range (±300px)
        y: (Math.random() - 0.5) * 600,  // Random Y in 600px range (±300px)
        vx: 0,  // Initial velocity X
        vy: 0   // Initial velocity Y
      }));

      // Convert edges
      const newEdges: GraphEdge[] = (payload.edges || []).map((edge: any) => ({
        source: edge.source,
        target: edge.target,
        value: edge.similarity
      }));

      console.log('[useRealtimeGraph] Adding to graph:', {
        newNodes: newNodes.length,
        newEdges: newEdges.length,
        currentNodes: graphData.nodes.length,
        currentEdges: graphData.links.length
      });

      // Single state update with duplicate prevention
      setGraphData(prev => {
        // Create set of existing node IDs for quick lookup
        const existingIds = new Set(prev.nodes.map(n => n.id));

        // Only add nodes that don't already exist (prevent duplicates)
        const nodesToAdd = newNodes.filter(n => !existingIds.has(n.id));

        // Same for edges
        const existingEdgeKeys = new Set(
          prev.links.map(e => `${e.source}-${e.target}`)
        );
        const edgesToAdd = newEdges.filter(
          e => !existingEdgeKeys.has(`${e.source}-${e.target}`)
        );

        console.log('[useRealtimeGraph] After deduplication:', {
          nodesToAdd: nodesToAdd.length,
          edgesToAdd: edgesToAdd.length,
          skippedDuplicateNodes: newNodes.length - nodesToAdd.length,
          skippedDuplicateEdges: newEdges.length - edgesToAdd.length
        });

        return {
          nodes: [...prev.nodes, ...nodesToAdd],
          links: [...prev.links, ...edgesToAdd]
        };
      });
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

    socket.on('disconnect', (reason: string) => {
      console.log('[useRealtimeGraph] Socket disconnected -', reason);
      if (reason === 'io server disconnect') {
        // Server disconnected us, reconnect manually
        console.log('[useRealtimeGraph] Server disconnected, attempting manual reconnect...');
        socket?.connect();
      }
    });

    socket.on('connect_error', (err: any) => {
      console.error('[useRealtimeGraph] ❌ Connection ERROR:', err.message, err);
      setError(`Socket.IO connection failed: ${err.message}`);
    });

    socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log('[useRealtimeGraph] 🔄 Reconnection attempt:', attemptNumber);
    });

    socket.on('reconnect', (attemptNumber: number) => {
      console.log('[useRealtimeGraph] ✅ Reconnected after', attemptNumber, 'attempts');
      // Rejoin session room after reconnection
      socket?.emit('join_session', { session_id: sessionId });
    });

    socket.on('error', (err: any) => {
      console.error('[useRealtimeGraph] ❌ Socket error:', err);
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

      // Get JWT token from localStorage
      const token = localStorage.getItem('token');

      const response = await fetch(`${BACKEND_URL}/api/sessions/${sessionId}/graph`, {
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
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
        mentionCount: node.mentionCount || 1,

        // Random initial positions to break force simulation symmetry
        x: (Math.random() - 0.5) * 600,  // Random X in 600px range (±300px)
        y: (Math.random() - 0.5) * 600,  // Random Y in 600px range (±300px)
        vx: 0,  // Initial velocity X
        vy: 0   // Initial velocity Y
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
