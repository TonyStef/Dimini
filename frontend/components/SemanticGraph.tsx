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

  // Auto-fit graph when new nodes appear
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      graphRef.current.zoomToFit(400, 50);
    }
  }, [graphData.nodes.length]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950">
        <div className="text-slate-400">Loading graph...</div>
      </div>
    );
  }

  // Node size based on selected metric
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

    return baseSize + value * 3;
  };

  // Node color based on type
  const getNodeColor = (node: any) => {
    return node.type === 'emotion' ? '#ef4444' : '#3b82f6';  // red vs blue
  };

  return (
    <div className="w-full h-full border rounded-lg overflow-hidden bg-slate-950 relative">
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        nodeLabel={(node: any) => `${node.label} (${highlightMetric}: ${
          highlightMetric === 'weighted_degree' ? node.weightedDegree?.toFixed(2) :
          highlightMetric === 'pagerank' ? node.pagerank?.toFixed(3) :
          node.betweenness?.toFixed(3)
        })`}
        nodeRelSize={1}
        nodeVal={getNodeSize}
        nodeColor={getNodeColor}
        linkWidth={link => (link.value || 0.75) * 3}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#020617"
        linkColor={() => '#64748b'}

        // PERFORMANCE OPTIMIZATIONS:
        // 1. Faster physics convergence
        d3AlphaDecay={0.05}  // Faster convergence (was 0.02)
        d3VelocityDecay={0.4}  // More damping (was 0.3)
        warmupTicks={100}  // Pre-stabilize before render
        cooldownTime={5000}  // Stop physics after 5s

        // 2. Node visibility filtering for large graphs
        nodeVisibility={(node: any) => {
          // If graph has >200 nodes, only show important ones
          if (graphData.nodes.length > 200) {
            return (node.pagerank || 0) > 0.2 || (node.weightedDegree || 0) > 1.0;
          }
          return true;
        }}

        // 3. Canvas rendering (faster than SVG)
        nodeCanvasObject={(node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
          const label = node.label;
          const fontSize = 12 / globalScale;
          ctx.font = `${fontSize}px Sans-Serif`;

          // Draw node circle
          const size = getNodeSize(node);
          ctx.fillStyle = getNodeColor(node);
          ctx.beginPath();
          ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
          ctx.fill();

          // Draw label (only if zoomed in enough)
          if (globalScale > 1.5) {
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillStyle = '#fff';
            ctx.fillText(label, node.x, node.y + size + fontSize);
          }
        }}

        onNodeClick={(node) => {
          console.log('Node clicked:', node);
          // TODO: Show node details in sidebar
        }}
      />
    </div>
  );
}
