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

  // Auto-fit graph when new nodes appear or on initial load
  useEffect(() => {
    if (graphRef.current && graphData.nodes.length > 0) {
      // Delay to allow physics to settle before zooming
      const timer = setTimeout(() => {
        graphRef.current.zoomToFit(1000, 100);  // FIXED: Longer duration, more padding
      }, 500);

      return () => clearTimeout(timer);
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
    const baseSize = 4;  // FIXED: Reduced from 5 to 4
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

    return baseSize + value * 0.2;  // FIXED: Reduced multiplier from 3 to 0.2
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
        linkWidth={link => (link.value || 0.75) * 3}
        linkDirectionalParticles={2}
        linkDirectionalParticleSpeed={0.005}
        backgroundColor="#020617"
        linkColor={() => '#64748b'}

        // PERFORMANCE OPTIMIZATIONS:
        // Balanced physics convergence for better settling
        d3AlphaDecay={0.02}  // FIXED: Reverted to slower for better layout
        d3VelocityDecay={0.3}  // FIXED: Natural damping (reverted from 0.4)
        warmupTicks={200}  // FIXED: Increased pre-stabilization from 100 to 200
        cooldownTime={10000}  // FIXED: Increased to 10s for complex graphs

        // Force simulation configuration
        d3ForceCharge={() => -2500}  // FIXED: Increased repulsion from -1500 to -2500
        d3ForceLink={(link) => link.value ? 250 / link.value : 250}  // FIXED: Increased from 150 to 250
        d3ForceCenter={() => ({ x: 0, y: 0, strength: 0.05 })}  // FIXED: Increased from 0.03 to 0.05

        // COLLISION DETECTION - Prevents node overlap
        d3ForceCollide={(node: any) => {
          const nodeSize = getNodeSize(node);
          return nodeSize + 8;  // Node radius + 8px minimum spacing
        }}

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

          // Draw label (always visible like demo)
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
