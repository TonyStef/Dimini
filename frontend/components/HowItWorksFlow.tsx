'use client';

import { motion } from 'framer-motion';
import { Mic, Brain, Network, LineChart } from 'lucide-react';

const steps = [
  {
    icon: Mic,
    title: 'Voice Agent Records',
    description: 'External voice agent captures and transcribes therapy conversation in real-time.',
    color: 'accent-primary',
  },
  {
    icon: Brain,
    title: 'AI Extracts Entities',
    description: 'GPT-4 identifies topics, emotions, and key concepts from transcript chunks.',
    color: 'accent-secondary',
  },
  {
    icon: Network,
    title: 'Semantic Linking',
    description: 'OpenAI embeddings calculate relationships between concepts using cosine similarity.',
    color: 'accent-warm',
  },
  {
    icon: LineChart,
    title: 'Graph Visualizes',
    description: 'Real-time updates display the growing semantic network of patient conversation.',
    color: 'node-topic',
  },
];

export default function HowItWorksFlow() {
  return (
    <div className="relative">
      {/* Vertical connector line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-border to-transparent hidden md:block" />

      <div className="grid md:grid-cols-2 gap-12 md:gap-x-24 md:gap-y-16">
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isEven = index % 2 === 0;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: isEven ? -20 : 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className={`relative ${isEven ? 'md:text-right md:pr-12' : 'md:pl-12'}`}
            >
              {/* Step number indicator */}
              <div className={`absolute ${isEven ? 'md:right-0' : 'md:left-0'} -translate-x-1/2 md:translate-x-1/2 top-0 z-10 hidden md:flex items-center justify-center w-12 h-12 rounded-full bg-surface border-2 border-border`}>
                <span className="text-accent-primary font-display font-semibold text-lg">
                  {index + 1}
                </span>
              </div>

              {/* Content */}
              <div className="space-y-4">
                {/* Icon */}
                <div className={`inline-flex ${isEven ? 'md:ml-auto' : ''}`}>
                  <div className={`rounded-xl bg-surface-elevated p-4 shadow-md transition-all duration-base hover:shadow-glow`}>
                    <Icon className={`w-8 h-8 text-${step.color}`} strokeWidth={1.5} />
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-display text-2xl font-semibold text-text-primary">
                  {step.title}
                </h3>

                {/* Description */}
                <p className="text-text-secondary leading-relaxed max-w-md">
                  {step.description}
                </p>

                {/* Mobile step indicator */}
                <div className="md:hidden flex items-center gap-2 text-sm text-text-tertiary font-mono">
                  <span className="text-accent-primary font-semibold">Step {index + 1}</span>
                  <span>of {steps.length}</span>
                </div>
              </div>

              {/* Connector arrow (mobile only) */}
              {index < steps.length - 1 && (
                <div className="md:hidden mt-8 mb-4 flex justify-center">
                  <div className="w-px h-12 bg-gradient-to-b from-border to-transparent" />
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
