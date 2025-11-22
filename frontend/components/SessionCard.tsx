'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/lib/types';
import { Play, Activity, Calendar, TrendingUp } from 'lucide-react';
import { format } from 'date-fns';

// ============================================================================
// Props
// ============================================================================

interface SessionCardProps {
  patient: Patient;
  onStartSession?: (patientId: string) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function SessionCard({
  patient,
  onStartSession,
}: SessionCardProps) {
  // Get patient initials for avatar
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Mock stats - replace with real data later
  const totalSessions = 0;
  const lastSessionDate = null;

  return (
    <Card className="hover:border-primary/50 transition-all duration-300 group h-full flex flex-col">
      {/* Header with Avatar and Name */}
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-12 w-12 border-2 border-border">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
              {getInitials(patient.name)}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
              {patient.name}
            </h3>
            {patient.demographics?.age && (
              <p className="text-sm text-muted-foreground">
                {patient.demographics.age} years old
              </p>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Content with Session Stats */}
      <CardContent className="pb-3 space-y-3 flex-1">
        {/* Mini Stats */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-surface-elevated p-2 rounded-lg">
            <Activity className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Sessions</p>
              <p className="text-sm font-semibold">{totalSessions}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 bg-surface-elevated p-2 rounded-lg">
            <Calendar className="h-4 w-4 text-blue-500" />
            <div>
              <p className="text-xs text-muted-foreground">Last</p>
              <p className="text-sm font-semibold">
                {lastSessionDate ? format(new Date(lastSessionDate), 'MMM d') : 'Never'}
              </p>
            </div>
          </div>
        </div>

        {/* Graph Preview Placeholder */}
        <div className="relative bg-surface-elevated rounded-lg p-4 border border-border/50">
          <div className="absolute top-2 right-2">
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              Graph Ready
            </Badge>
          </div>

          {/* Simple graph preview illustration */}
          <div className="flex items-center justify-center h-20 opacity-50">
            <svg width="120" height="60" viewBox="0 0 120 60" className="text-primary">
              {/* Simple node network illustration */}
              <circle cx="30" cy="30" r="8" fill="currentColor" opacity="0.6" />
              <circle cx="60" cy="15" r="6" fill="currentColor" opacity="0.4" />
              <circle cx="60" cy="45" r="6" fill="currentColor" opacity="0.4" />
              <circle cx="90" cy="30" r="8" fill="currentColor" opacity="0.6" />

              <line x1="30" y1="30" x2="60" y2="15" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="30" y1="30" x2="60" y2="45" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="60" y1="15" x2="90" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.3" />
              <line x1="60" y1="45" x2="90" y2="30" stroke="currentColor" strokeWidth="1" opacity="0.3" />
            </svg>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Semantic graph preview
          </p>
        </div>

        {/* Occupation if available */}
        {patient.demographics?.occupation && (
          <div className="pt-1">
            <Badge variant="secondary" className="text-xs">
              {patient.demographics.occupation}
            </Badge>
          </div>
        )}
      </CardContent>

      {/* Footer with Start Session */}
      <CardFooter className="pt-3 border-t">
        <Button
          size="sm"
          onClick={() => onStartSession?.(patient.id)}
          className="w-full"
        >
          <Play className="h-4 w-4 mr-2" />
          Start Session
        </Button>
      </CardFooter>
    </Card>
  );
}
