'use client';

/**
 * Semantic Graph Visualization Component
 *
 * Real-time force-directed graph for therapy session knowledge visualization.
 * Uses react-force-graph-2d for Canvas-based rendering (60fps target).
 *
 * Features:
 * - Multi-tier metric visualization (weighted degree, pagerank, betweenness)
 * - Auto-zoom on new nodes
 * - Performance optimizations for large graphs (>200 nodes)
 * - Node size based on selected metric
 * - Color coding: Red = emotions, Blue = topics
 */

import { useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { GraphData } from '@/lib/types';

// Force Graph must be dynamically imported (no SSR)
const ForceGraph2D = dynamic(() => import('react-force-graph-2d'), {
  ssr: false
});

interface SemanticGraphProps {
  graphData: GraphData;
  loading?: boolean;
  highlightMetric?: 'weighted_degree' | 'pagerank' | 'betweenness';
}

export default function SemanticGraph({
  graphData,
  loading,
  highlightMetric = 'pagerank'
}: SemanticGraphProps) {
  const graphRef = useRef<any>();
  const hasZoomedRef = useRef(false);

  // DISABLED: Auto-zoom was causing node magnification issues
  // useEffect(() => {
  //   if (graphRef.current && graphData.nodes.length > 0 && !hasZoomedRef.current) {
  //     graphRef.current.zoomToFit(400, 200);
  //     hasZoomedRef.current = true;
  //   }
  // }, [graphData.nodes.length]);

  // DIAGNOSTIC: Log when nodes are added and reheat simulation
  useEffect(() => {
    console.log('[GRAPH] Nodes updated, count:', graphData.nodes.length);
    console.log('[GRAPH] Node positions:', graphData.nodes.map(n => ({
      label: n.label,
      x: n.x?.toFixed(1),
      y: n.y?.toFixed(1),
      type: n.type
    })));

    if (graphRef.current && graphData.nodes.length > 0) {
      setTimeout(() => {
        console.log('[REHEAT] Attempting reheat, graphRef exists:', !!graphRef.current);
        console.log('[REHEAT] d3ReheatSimulation method exists:', typeof graphRef.current?.d3ReheatSimulation);
        if (graphRef.current?.d3ReheatSimulation) {
          graphRef.current.d3ReheatSimulation();
          console.log('[REHEAT] ✅ Reheat called successfully');
        } else {
          console.warn('[REHEAT] ⚠️ d3ReheatSimulation method not available');
        }
      }, 100);
    }
  }, [graphData.nodes.length]);

  // REMOVED d3-force configuration due to Docker/dependency issues
  // Graph will use react-force-graph's built-in physics simulation

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading graph...</div>
      </div>
    );
  }

  // Node size based on selected metric (CAPPED at 40px to prevent massive nodes)
  const getNodeSize = (node: any) => {
    const baseSize = 5;
    let value = 0;

    switch (highlightMetric) {
      case 'weighted_degree':
        value = node.weightedDegree || 0;
        break;
      case 'pagerank':
        value = (node.pagerank || 0.15) * 100;
        break;
      case 'betweenness':
        value = (node.betweenness || 0) * 100;
        break;
    }

    const calculatedSize = baseSize + value * 3;
    const cappedSize = Math.min(calculatedSize, 40);  // CAP at 40px maximum

    // Log oversized nodes
    if (calculatedSize > 40) {
      console.log('[NODE-SIZE] Capping oversized node:', node.label, 'from', calculatedSize.toFixed(1), 'to 40px');
    }

    return cappedSize;
  };

  // Node color based on type (match landing page demo)
  const getNodeColor = (node: any) => {
    return node.type === 'emotion' ? '#d98282' : '#6ea8d3';  // demo red vs demo blue
  };

  return (
    <div className="w-full h-full border rounded-lg overflow-hidden bg-slate-950 relative">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}

        // CRITICAL FIX: Tell react-force-graph how to read node/link IDs
        nodeId="id"
        linkSource="source"
        linkTarget="target"

        // NO DAG MODE: Pure physics for instant real-time rendering + dynamic node additions
        // (dag modes don't work well for real-time sessions with incremental nodes)

        nodeLabel={(node: any) => `${node.label} (${highlightMetric}: ${
          highlightMetric === 'weighted_degree' ? node.weightedDegree?.toFixed(2) :
          highlightMetric === 'pagerank' ? node.pagerank?.toFixed(3) :
          node.betweenness?.toFixed(3)
        })`}
        nodeRelSize={1}
        nodeVal={getNodeSize}
        nodeColor={getNodeColor}
        linkWidth={link => Math.max((link.value || 0.75) * 3, 1.5)}  // Min 1.5px width for visibility
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#020617"
        linkColor={() => '#94a3b8'}  // Brighter slate for better visibility

        // Physics simulation (let forces work to separate nodes)
        d3AlphaDecay={0.01}  // Slower decay - let forces work longer
        d3VelocityDecay={0.4}
        warmupTicks={100}  // Run 100 iterations before rendering (forces need time!)
        cooldownTime={5000}

        // NOTE: Force configuration is done via d3Force() method in useEffect
        // (d3ForceCharge, d3ForceLink, etc. props don't exist in the API)

        // 2. Node visibility filtering for large graphs
        nodeVisibility={(node: any) => {
          // If graph has >200 nodes, only show important ones
          if (graphData.nodes.length > 200) {
            return (node.pagerank || 0) > 0.2 || (node.weightedDegree || 0) > 1.0;
          }
          return true;
        }}

        // 3. Canvas rendering with glow effects (matches landing page demo)
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.label;
          const fontSize = 12 / globalScale;
          const size = getNodeSize(node);
          const color = getNodeColor(node);

          // Draw glow halo (like demo)
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.15;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size + 5, 0, 2 * Math.PI);
          ctx.fill();

          // Draw main node circle
          ctx.globalAlpha = 1.0;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
          ctx.fill();

          // Draw white border around node (like target image)
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2 / globalScale;
          ctx.stroke();

          // Draw label (always visible like demo)
          ctx.font = `${fontSize}px Sans-Serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff';
          ctx.fillText(label, node.x, node.y + size + fontSize);
        }}

        onNodeClick={(node) => {
          console.log('Node clicked:', node);
          // TODO: Show node details in sidebar
        }}
      />
    </div>
  );
}
