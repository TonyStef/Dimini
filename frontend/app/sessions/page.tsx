'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/contexts/PatientsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import SessionCard from '@/components/SessionCard';
import LiveSessionView from '@/components/LiveSessionView';
import {
  Mic,
  Activity,
  Play,
  Users,
  Search,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================================
// Main Component
// ============================================================================

export default function SessionsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { patients, loading, fetchPatients, startSession } = usePatients();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);

  // Mock data for stats (replace with real data later)
  const activeSessions = 0;
  const totalSessionsToday = 3;
  const quickStartAvailable = true;

  // ========================================
  // Auth Check
  // ========================================

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

  // ========================================
  // Fetch Patients on Mount
  // ========================================

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user, fetchPatients]);

  // ========================================
  // Search Filter
  // ========================================

  const filteredPatients = patients.filter((patient) => {
    const query = searchQuery.toLowerCase();
    return (
      patient.name.toLowerCase().includes(query) ||
      patient.email?.toLowerCase().includes(query) ||
      patient.phone?.includes(query)
    );
  });

  // ========================================
  // Handle Start Session
  // ========================================

  const handleStartSession = async (patientId: string) => {
    const session = await startSession(patientId);
    if (session) {
      setActiveSessionId(session.id);
      setSelectedPatientId(patientId);
    }
  };

  // ========================================
  // Handle Quick Start
  // ========================================

  const handleQuickStart = async () => {
    // Quick start without patient selection
    // For now, show a placeholder - implement full logic later
    setActiveSessionId('quick-start-session');
    setSelectedPatientId(null);
  };

  // ========================================
  // Handle End Session
  // ========================================

  const handleEndSession = () => {
    setActiveSessionId(null);
    setSelectedPatientId(null);
  };

  // ========================================
  // Loading State
  // ========================================

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  // ========================================
  // Active Session View
  // ========================================

  if (activeSessionId) {
    return (
      <LiveSessionView
        sessionId={activeSessionId}
        patientId={selectedPatientId}
        onEndSession={handleEndSession}
      />
    );
  }

  // ========================================
  // Render Session Setup View
  // ========================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-surface">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Title and Stats */}
            <div>
              <h1 className="text-4xl font-bold mb-2">Sessions</h1>
              <p className="text-muted-foreground">
                Start new sessions and view real-time semantic graphs
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <Activity className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Active Sessions</p>
                    <p className="text-2xl font-bold">{activeSessions}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Users className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sessions Today</p>
                    <p className="text-2xl font-bold">{totalSessionsToday}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Quick Start Available</p>
                    <p className="text-2xl font-bold">{quickStartAvailable ? 'Yes' : 'No'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Quick Start Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20 hover:border-primary/50 transition-all duration-300">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <Zap className="h-6 w-6 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold">Quick Start Session</h2>
                  </div>
                  <p className="text-muted-foreground ml-[60px]">
                    Skip patient selection and start immediately with voice agent ready
                  </p>
                  <div className="flex items-center gap-2 ml-[60px] mt-3">
                    <div className="flex items-center gap-1">
                      <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-sm text-green-500 font-medium">Voice Agent Ready</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={handleQuickStart}
                  className="gap-2 ml-4"
                >
                  <Play className="h-5 w-5" />
                  Quick Start
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Divider */}
        <div className="relative mb-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-background text-muted-foreground">
              Or start with patient selection
            </span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search patients by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Loading State */}
        {loading && patients.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i}>
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-5 w-32 mb-2" />
                      <Skeleton className="h-4 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && patients.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-block p-6 bg-surface-elevated rounded-full mb-4">
              <Users className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Patients Yet</h2>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Add patients first to start sessions with patient context
            </p>
            <Button
              variant="outline"
              onClick={() => router.push('/patients')}
            >
              Go to Patients
            </Button>
          </motion.div>
        )}

        {/* No Search Results */}
        {!loading && patients.length > 0 && filteredPatients.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="inline-block p-6 bg-surface-elevated rounded-full mb-4">
              <Search className="h-12 w-12 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-semibold mb-2">No Results Found</h2>
            <p className="text-muted-foreground mb-6">
              No patients match "{searchQuery}". Try a different search term.
            </p>
            <Button variant="outline" onClick={() => setSearchQuery('')}>
              Clear Search
            </Button>
          </motion.div>
        )}

        {/* Patients Grid */}
        {!loading && filteredPatients.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {filteredPatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <SessionCard
                  patient={patient}
                  onStartSession={handleStartSession}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
