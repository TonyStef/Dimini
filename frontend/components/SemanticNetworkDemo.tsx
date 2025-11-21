'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface Node {
  id: string;
  label: string;
  type: 'topic' | 'emotion';
  x: number;
  y: number;
}

interface Edge {
  source: string;
  target: string;
  strength: number; // 0.75 to 1.0
}

const nodes: Node[] = [
  { id: 'anxiety', label: 'Anxiety', type: 'emotion', x: 50, y: 20 },
  { id: 'work_stress', label: 'Work Stress', type: 'topic', x: 82, y: 38 },
  { id: 'sleep_issues', label: 'Sleep Issues', type: 'emotion', x: 25, y: 40 },
  { id: 'therapy', label: 'Therapy', type: 'topic', x: 50, y: 52 },
  { id: 'girlfriend', label: 'Girlfriend', type: 'topic', x: 18, y: 66 },
  { id: 'self_care', label: 'Self-Care', type: 'topic', x: 38, y: 70 },
  { id: 'family', label: 'Family', type: 'topic', x: 68, y: 82 },
];

const edges: Edge[] = [
  { source: 'anxiety', target: 'work_stress', strength: 0.89 },
  { source: 'anxiety', target: 'therapy', strength: 0.82 },
  { source: 'anxiety', target: 'sleep_issues', strength: 0.87 },
  { source: 'work_stress', target: 'family', strength: 0.84 },
  { source: 'sleep_issues', target: 'self_care', strength: 0.80 },
  { source: 'therapy', target: 'self_care', strength: 0.85 },
  { source: 'girlfriend', target: 'self_care', strength: 0.78 },
];

export default function SemanticNetworkDemo() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full">
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full"
        style={{ filter: 'drop-shadow(0 0 20px rgba(124, 156, 191, 0.1))' }}
      >
        {/* Edges */}
        <g className="edges">
          {edges.map((edge, i) => {
            const sourceNode = nodes.find((n) => n.id === edge.source);
            const targetNode = nodes.find((n) => n.id === edge.target);
            if (!sourceNode || !targetNode) return null;

            return (
              <g key={`edge-${i}`}>
                {/* Main edge line */}
                <motion.line
                  x1={sourceNode.x}
                  y1={sourceNode.y}
                  x2={targetNode.x}
                  y2={targetNode.y}
                  stroke="rgba(74, 85, 99, 0.4)"
                  strokeWidth={edge.strength * 0.25}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />

                {/* Animated particle flowing on edge */}
                <motion.circle
                  r="0.2"
                  fill="rgba(124, 156, 191, 0.5)"
                  initial={{ opacity: 0, cx: sourceNode.x, cy: sourceNode.y }}
                  animate={{
                    opacity: [0, 1, 1, 0],
                    cx: [sourceNode.x, targetNode.x],
                    cy: [sourceNode.y, targetNode.y],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.3,
                    repeat: Infinity,
                    ease: 'linear',
                  }}
                />
              </g>
            );
          })}
        </g>

        {/* Nodes */}
        <g className="nodes">
          {nodes.map((node, i) => {
            const isEmotion = node.type === 'emotion';
            const color = isEmotion ? '#d98282' : '#6ea8d3';
            const radius = 1.8;

            return (
              <g key={node.id}>
                {/* Glow effect */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 0.5}
                  fill={color}
                  opacity={0.15}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.15, 0.3, 0.15],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.15,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />

                {/* Main node circle */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={radius}
                  fill={color}
                  stroke={color}
                  strokeWidth="0.3"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.3 + i * 0.1,
                  }}
                  style={{ filter: `drop-shadow(0 0 4px ${color})` }}
                />

                {/* Floating animation */}
                <motion.g
                  animate={{
                    y: [0, -0.5, 0],
                  }}
                  transition={{
                    duration: 2 + i * 0.2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                >
                  {/* Node label */}
                  <motion.text
                    x={node.x}
                    y={node.y - 5}
                    textAnchor="middle"
                    fill="rgba(230, 237, 243, 0.95)"
                    fontSize="1.8"
                    fontFamily="var(--font-sans)"
                    fontWeight="500"
                    initial={{ opacity: 0, y: 2 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.5 + i * 0.1 }}
                    style={{
                      filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.8))',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {node.label}
                  </motion.text>
                </motion.g>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Overlay gradient for depth */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 50%, transparent 40%, rgba(10, 14, 20, 0.3) 100%)',
        }}
      />
    </div>
  );
}
