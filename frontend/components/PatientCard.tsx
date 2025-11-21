'use client';

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Patient } from '@/lib/types';
import { Play, Mail, Phone, User, Calendar, MoreVertical } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

// ============================================================================
// Props
// ============================================================================

interface PatientCardProps {
  patient: Patient;
  onStartSession?: (patientId: string) => void;
  onDelete?: (patientId: string) => void;
  hasActiveSession?: boolean;
}

// ============================================================================
// Component
// ============================================================================

export default function PatientCard({
  patient,
  onStartSession,
  hasActiveSession = false,
}: PatientCardProps) {
  // Get patient initials for avatar
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Format demographics for display
  const demographicsDisplay = () => {
    if (!patient.demographics) return null;

    const { age, gender } = patient.demographics;
    const parts: string[] = [];

    if (age) parts.push(`${age}yo`);
    if (gender) {
      const genderDisplay = {
        male: 'M',
        female: 'F',
        non_binary: 'NB',
        prefer_not_to_say: '',
        other: 'Other',
      }[gender];
      if (genderDisplay) parts.push(genderDisplay);
    }

    return parts.join(' • ');
  };

  return (
    <Card className="hover:border-primary/50 transition-all duration-300 group">
      {/* Header with Avatar and Name */}
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <Link
            href={`/patients/${patient.id}`}
            className="flex items-center gap-3 flex-1 min-w-0"
          >
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                {getInitials(patient.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                {patient.name}
              </h3>
              {demographicsDisplay() && (
                <p className="text-sm text-muted-foreground">
                  {demographicsDisplay()}
                </p>
              )}
            </div>
          </Link>

          {hasActiveSession && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600">
              Active
            </Badge>
          )}
        </div>
      </CardHeader>

      {/* Content with Contact Info */}
      <CardContent className="pb-3 space-y-2">
        {/* Email */}
        {patient.email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-4 w-4" />
            <span className="truncate">{patient.email}</span>
          </div>
        )}

        {/* Phone */}
        {patient.phone && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone className="h-4 w-4" />
            <span>{patient.phone}</span>
          </div>
        )}

        {/* Occupation */}
        {patient.demographics?.occupation && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <User className="h-4 w-4" />
            <span className="truncate">{patient.demographics.occupation}</span>
          </div>
        )}

        {/* Created Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          <span>Added {format(new Date(patient.created_at), 'MMM d, yyyy')}</span>
        </div>

        {/* Initial Concerns */}
        {patient.demographics?.initial_concerns && patient.demographics.initial_concerns.length > 0 && (
          <div className="pt-2">
            <div className="flex flex-wrap gap-1">
              {patient.demographics.initial_concerns.slice(0, 3).map((concern, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {concern}
                </Badge>
              ))}
              {patient.demographics.initial_concerns.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{patient.demographics.initial_concerns.length - 3} more
                </Badge>
              )}
            </div>
          </div>
        )}
      </CardContent>

      {/* Footer with Actions */}
      <CardFooter className="pt-3 border-t flex items-center justify-between gap-2">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="flex-1"
        >
          <Link href={`/patients/${patient.id}`}>
            View Details
          </Link>
        </Button>

        <Button
          size="sm"
          onClick={() => onStartSession?.(patient.id)}
          disabled={hasActiveSession}
          className="flex-1"
        >
          <Play className="h-4 w-4 mr-2" />
          {hasActiveSession ? 'In Session' : 'Start Session'}
        </Button>
      </CardFooter>
    </Card>
  );
}
