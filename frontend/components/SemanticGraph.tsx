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

  // Auto-fit graph ONCE on initial load (prevent jarring re-zoom on new nodes)
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0 && !hasZoomedRef.current) {
      graphRef.current.zoomToFit(400, 200);  // Increased padding: 50px → 200px
      hasZoomedRef.current = true;
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

  // Node color based on type (match landing page demo)
  const getNodeColor = (node: any) => {
    return node.type === 'emotion' ? '#d98282' : '#6ea8d3';  // demo red vs demo blue
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
        linkWidth={link => Math.max((link.value || 0.75) * 3, 1.5)}  // Min 1.5px width for visibility
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#020617"
        linkColor={() => '#94a3b8'}  // Brighter slate for better visibility

        // PERFORMANCE OPTIMIZATIONS:
        // 1. SLOWER physics convergence (gives nodes time to spread out)
        d3AlphaDecay={0.01}  // 5x slower - more time to spread (was 0.05)
        d3VelocityDecay={0.3}  // Less damping - allows more movement (was 0.4)
        warmupTicks={300}  // 3x more pre-stabilization (was 100)
        cooldownTime={15000}  // 15 seconds to settle properly (was 5000)

        // Force simulation configuration (match demo appearance)
        d3ForceCharge={() => -2500}  // 67% stronger repulsion (was -1500)
        d3ForceLink={(link) => link.value ? 200 / link.value : 200}  // 33% longer links (was 150)
        d3ForceCenter={() => ({ x: 0, y: 0, strength: 0.03 })}  // Weak centering for better distribution

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
