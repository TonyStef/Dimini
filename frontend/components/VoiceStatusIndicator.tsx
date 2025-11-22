'use client';

import { Mic, Loader2, Volume2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';

// ============================================================================
// Props
// ============================================================================

interface VoiceStatusIndicatorProps {
  status: 'listening' | 'processing' | 'idle';
}

// ============================================================================
// Component
// ============================================================================

export default function VoiceStatusIndicator({ status }: VoiceStatusIndicatorProps) {
  const getStatusConfig = () => {
    switch (status) {
      case 'listening':
        return {
          icon: Mic,
          label: 'Listening',
          color: 'text-green-500',
          bgColor: 'bg-green-500/10',
          borderColor: 'border-green-500/50',
          animate: true,
        };
      case 'processing':
        return {
          icon: Loader2,
          label: 'Processing',
          color: 'text-blue-500',
          bgColor: 'bg-blue-500/10',
          borderColor: 'border-blue-500/50',
          animate: true,
        };
      case 'idle':
        return {
          icon: Volume2,
          label: 'Idle',
          color: 'text-muted-foreground',
          bgColor: 'bg-surface-elevated',
          borderColor: 'border-border',
          animate: false,
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <div className="space-y-4">
      {/* Visual Indicator */}
      <div className={`relative rounded-lg border-2 ${config.borderColor} ${config.bgColor} p-6`}>
        <div className="flex items-center justify-center">
          <motion.div
            animate={
              config.animate
                ? {
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 1, 0.5],
                  }
                : {}
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className={`p-4 rounded-full ${config.bgColor}`}
          >
            <Icon
              className={`h-12 w-12 ${config.color} ${status === 'processing' ? 'animate-spin' : ''}`}
            />
          </motion.div>
        </div>

        {/* Status Badge */}
        <div className="mt-4 flex justify-center">
          <Badge
            variant="outline"
            className={`${config.color} ${config.borderColor}`}
          >
            {config.label}
          </Badge>
        </div>
      </div>

      {/* Status Description */}
      <div className="text-center text-sm text-muted-foreground">
        {status === 'listening' && (
          <p>Voice agent is actively listening to the conversation</p>
        )}
        {status === 'processing' && (
          <p>Analyzing speech and updating semantic graph</p>
        )}
        {status === 'idle' && (
          <p>Voice agent is ready and waiting</p>
        )}
      </div>

      {/* Waveform Visualization (for listening state) */}
      {status === 'listening' && (
        <div className="flex items-center justify-center gap-1 h-12">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              className="w-1 bg-green-500 rounded-full"
              animate={{
                height: ['20%', '100%', '20%'],
              }}
              transition={{
                duration: 0.8,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
