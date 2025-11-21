'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';

const steps = [
  {
    title: 'Voice Agent Records',
    description: 'External voice agent captures and transcribes therapy conversation in real-time.',
    color: '#7c9cbf',
  },
  {
    title: 'AI Extracts Entities',
    description: 'GPT-4 identifies topics, emotions, and key concepts from transcript chunks.',
    color: '#a78bca',
  },
  {
    title: 'Semantic Linking',
    description: 'OpenAI embeddings calculate relationships between concepts using cosine similarity.',
    color: '#e5ab6f',
  },
  {
    title: 'Graph Visualizes',
    description: 'Real-time updates display the growing semantic network of patient conversation.',
    color: '#6ea8d3',
  },
];

export default function HowItWorksFlow() {
  return (
    <div className="max-w-5xl mx-auto">
      <div className="grid md:grid-cols-2 gap-8">
        {steps.map((step, index) => {
          const stepNumber = (index + 1).toString().padStart(2, '0');

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card className="h-full p-8 hover:shadow-glow transition-all duration-base">
                <div className="space-y-6">
                  {/* Step Number Badge */}
                  <div
                    className="inline-flex items-center justify-center w-16 h-16 rounded-xl font-display font-bold text-2xl"
                    style={{
                      background: `linear-gradient(135deg, ${step.color}20, ${step.color}10)`,
                      color: step.color,
                      border: `2px solid ${step.color}40`,
                    }}
                  >
                    {stepNumber}
                  </div>

                  {/* Content */}
                  <div className="space-y-3">
                    <h3 className="font-display text-2xl font-semibold text-text-primary leading-tight">
                      {step.title}
                    </h3>
                    <p className="text-base text-text-secondary leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Step indicator */}
                  <div className="flex items-center gap-2 text-xs text-text-tertiary font-mono pt-2 border-t border-border-subtle">
                    <span style={{ color: step.color }} className="font-semibold">
                      Step {index + 1}
                    </span>
                    <span>of {steps.length}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
