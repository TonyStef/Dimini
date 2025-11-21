'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  delay?: number;
}

export default function FeatureCard({ icon: Icon, title, description, delay = 0 }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
    >
      <Card glow className="h-full group">
        <CardHeader>
          <div className="mb-4 inline-flex">
            <div className="rounded-lg bg-surface-elevated p-3 transition-all duration-base group-hover:bg-surface-overlay group-hover:shadow-glow">
              <Icon className="w-6 h-6 text-accent-primary group-hover:text-accent-primary" strokeWidth={1.5} />
            </div>
          </div>
          <CardTitle className="text-xl mb-2">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </motion.div>
  );
}
