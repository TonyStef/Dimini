'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/contexts/PatientsContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft,
  Play,
  Mail,
  Phone,
  User,
  Calendar,
  Briefcase,
  Users,
  Activity,
  Clock,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Session } from '@/lib/types';
import { patientsAPI } from '@/lib/api';

// ============================================================================
// Main Component
// ============================================================================

export default function PatientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const patientId = params.patientId as string;

  const { user, loading: authLoading } = useAuth();
  const { currentPatient, loading, fetchPatientDetail, startSession } = usePatients();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // ========================================
  // Auth Check
  // ========================================

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // ========================================
  // Fetch Patient Detail
  // ========================================

  useEffect(() => {
    if (user && patientId) {
      fetchPatientDetail(patientId);
      loadSessions();
    }
  }, [user, patientId]);

  // ========================================
  // Load Sessions
  // ========================================

  const loadSessions = async () => {
    try {
      setSessionsLoading(true);
      const response = await patientsAPI.getSessions(patientId);
      setSessions(response.sessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setSessionsLoading(false);
    }
  };

  // ========================================
  // Handle Start Session
  // ========================================

  const handleStartSession = async () => {
    const session = await startSession(patientId);
    if (session) {
      router.push(`/patients/${patientId}/sessions/${session.id}`);
    }
  };

  // ========================================
  // Get Patient Initials
  // ========================================

  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // ========================================
  // Loading State
  // ========================================

  if (authLoading || !user || loading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <Skeleton className="h-10 w-32 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Skeleton className="h-64 w-full" />
            </div>
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentPatient) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="container mx-auto">
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold mb-2">Patient Not Found</h2>
            <p className="text-muted-foreground mb-6">
              The patient you're looking for doesn't exist.
            </p>
            <Button variant="outline" asChild>
              <Link href="/patients">Back to Patients</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const hasActiveSession = currentPatient.stats.active_sessions > 0;

  // ========================================
  // Render
  // ========================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-surface">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" size="icon" asChild>
              <Link href="/patients">
                <ArrowLeft className="h-5 w-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Patient Details</h1>
              <p className="text-muted-foreground">View and manage patient information</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Patient Info */}
          <div className="lg:col-span-1 space-y-6">
            {/* Patient Card */}
            <Card>
              <CardHeader className="text-center pb-4">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-border">
                  <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                    {getInitials(currentPatient.name)}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-2xl font-bold">{currentPatient.name}</h2>
                {hasActiveSession && (
                  <Badge variant="default" className="bg-green-500 hover:bg-green-600 mt-2">
                    Active Session
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Contact Info */}
                {currentPatient.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{currentPatient.email}</span>
                  </div>
                )}
                {currentPatient.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{currentPatient.phone}</span>
                  </div>
                )}

                {/* Demographics */}
                {currentPatient.demographics?.age && (
                  <div className="flex items-center gap-3 text-sm">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{currentPatient.demographics.age} years old</span>
                  </div>
                )}
                {currentPatient.demographics?.occupation && (
                  <div className="flex items-center gap-3 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="truncate">{currentPatient.demographics.occupation}</span>
                  </div>
                )}

                {/* Created Date */}
                <div className="flex items-center gap-3 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>Added {format(new Date(currentPatient.created_at), 'MMM d, yyyy')}</span>
                </div>

                {/* Start Session Button */}
                <Button
                  className="w-full mt-4"
                  size="lg"
                  onClick={handleStartSession}
                  disabled={hasActiveSession}
                >
                  <Play className="h-4 w-4 mr-2" />
                  {hasActiveSession ? 'Session In Progress' : 'Start New Session'}
                </Button>
              </CardContent>
            </Card>

            {/* Stats Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Session Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-primary" />
                    <span className="text-sm">Total Sessions</span>
                  </div>
                  <span className="font-semibold">{currentPatient.stats.total_sessions}</span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Active Sessions</span>
                  </div>
                  <span className="font-semibold">{currentPatient.stats.active_sessions}</span>
                </div>

                {currentPatient.stats.last_session_date && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Last Session</span>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {format(new Date(currentPatient.stats.last_session_date), 'MMM d')}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Tabs */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="overview" className="space-y-6">
              <TabsList className="w-full justify-start">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="sessions">
                  Sessions ({currentPatient.stats.total_sessions})
                </TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                {/* Demographics Card */}
                {currentPatient.demographics && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Demographics</CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      {currentPatient.demographics.age && (
                        <div>
                          <p className="text-sm text-muted-foreground">Age</p>
                          <p className="font-medium">{currentPatient.demographics.age} years</p>
                        </div>
                      )}
                      {currentPatient.demographics.gender && (
                        <div>
                          <p className="text-sm text-muted-foreground">Gender</p>
                          <p className="font-medium capitalize">
                            {currentPatient.demographics.gender.replace('_', ' ')}
                          </p>
                        </div>
                      )}
                      {currentPatient.demographics.occupation && (
                        <div>
                          <p className="text-sm text-muted-foreground">Occupation</p>
                          <p className="font-medium">{currentPatient.demographics.occupation}</p>
                        </div>
                      )}
                      {currentPatient.demographics.referral_source && (
                        <div>
                          <p className="text-sm text-muted-foreground">Referral Source</p>
                          <p className="font-medium">{currentPatient.demographics.referral_source}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Initial Concerns */}
                {currentPatient.demographics?.initial_concerns &&
                  currentPatient.demographics.initial_concerns.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle>Initial Concerns</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {currentPatient.demographics.initial_concerns.map((concern, index) => (
                            <Badge key={index} variant="secondary">
                              {concern}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </TabsContent>

              {/* Sessions Tab */}
              <TabsContent value="sessions" className="space-y-4">
                {sessionsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full" />
                    ))}
                  </div>
                ) : sessions.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">No Sessions Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        Start the first therapy session with this patient.
                      </p>
                      <Button onClick={handleStartSession} disabled={hasActiveSession}>
                        <Play className="h-4 w-4 mr-2" />
                        Start First Session
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {sessions.map((session) => (
                      <Card key={session.id} className="hover:border-primary/50 transition-colors">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold">
                                  {format(new Date(session.started_at), 'MMMM d, yyyy')}
                                </h4>
                                <Badge
                                  variant={
                                    session.status === 'active'
                                      ? 'default'
                                      : session.status === 'completed'
                                      ? 'secondary'
                                      : 'outline'
                                  }
                                  className={
                                    session.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''
                                  }
                                >
                                  {session.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Started at {format(new Date(session.started_at), 'h:mm a')}
                                {session.ended_at &&
                                  ` • Ended at ${format(new Date(session.ended_at), 'h:mm a')}`}
                              </p>
                            </div>
                            <Button variant="outline" size="sm" asChild>
                              <Link href={`/patients/${patientId}/sessions/${session.id}`}>
                                View Session
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
}

