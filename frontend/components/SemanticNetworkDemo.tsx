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
  { id: 'anxiety', label: 'Anxiety', type: 'emotion', x: 50, y: 30 },
  { id: 'work_stress', label: 'Work Stress', type: 'topic', x: 75, y: 45 },
  { id: 'girlfriend', label: 'Girlfriend', type: 'topic', x: 30, y: 60 },
  { id: 'family', label: 'Family', type: 'topic', x: 55, y: 75 },
  { id: 'frustrated', label: 'Frustrated', type: 'emotion', x: 20, y: 35 },
  { id: 'hopeful', label: 'Hopeful', type: 'emotion', x: 80, y: 70 },
  { id: 'therapy', label: 'Therapy', type: 'topic', x: 50, y: 50 },
];

const edges: Edge[] = [
  { source: 'anxiety', target: 'work_stress', strength: 0.89 },
  { source: 'anxiety', target: 'therapy', strength: 0.82 },
  { source: 'work_stress', target: 'frustrated', strength: 0.85 },
  { source: 'girlfriend', target: 'family', strength: 0.78 },
  { source: 'therapy', target: 'hopeful', strength: 0.81 },
  { source: 'frustrated', target: 'girlfriend', strength: 0.76 },
  { source: 'therapy', target: 'family', strength: 0.75 },
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
                  strokeWidth={edge.strength * 0.4}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ duration: 1, delay: i * 0.1 }}
                />

                {/* Animated particle flowing on edge */}
                <motion.circle
                  r="0.3"
                  fill="rgba(124, 156, 191, 0.6)"
                  initial={{ opacity: 0 }}
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
            const radius = 2.5;

            return (
              <g key={node.id}>
                {/* Glow effect */}
                <motion.circle
                  cx={node.x}
                  cy={node.y}
                  r={radius + 1}
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
                    y={node.y - 4}
                    textAnchor="middle"
                    fill="rgba(230, 237, 243, 0.95)"
                    fontSize="2.5"
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
