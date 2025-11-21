'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { usePatients } from '@/contexts/PatientsContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import PatientCard from '@/components/PatientCard';
import AddPatientSheet from '@/components/AddPatientSheet';
import { Plus, Search, Users, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';

// ============================================================================
// Main Component
// ============================================================================

export default function PatientsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { patients, loading, fetchPatients, startSession } = usePatients();

  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddPatientOpen, setIsAddPatientOpen] = useState(false);

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
      patient.phone?.includes(query) ||
      patient.demographics?.occupation?.toLowerCase().includes(query)
    );
  });

  // ========================================
  // Handle Start Session
  // ========================================

  const handleStartSession = async (patientId: string) => {
    const session = await startSession(patientId);
    if (session) {
      router.push(`/patients/${patientId}/sessions/${session.id}`);
    }
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
  // Render
  // ========================================

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-surface">
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-between">
            {/* Title and Stats */}
            <div>
              <h1 className="text-4xl font-bold mb-2">Patients</h1>
              <p className="text-muted-foreground">
                Manage your patient list and start therapy sessions
              </p>
            </div>

            {/* Add Patient Button */}
            <Button
              size="lg"
              onClick={() => setIsAddPatientOpen(true)}
              className="gap-2"
            >
              <UserPlus className="h-5 w-5" />
              Add Patient
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Patients</p>
                    <p className="text-2xl font-bold">{patients.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-500/10 rounded-lg">
                    <UserPlus className="h-6 w-6 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">New This Month</p>
                    <p className="text-2xl font-bold">
                      {patients.filter((p) => {
                        const createdDate = new Date(p.created_at);
                        const now = new Date();
                        return (
                          createdDate.getMonth() === now.getMonth() &&
                          createdDate.getFullYear() === now.getFullYear()
                        );
                      }).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Search className="h-6 w-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Search Results</p>
                    <p className="text-2xl font-bold">{filteredPatients.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-8">
        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by name, email, phone, or occupation..."
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
              Get started by adding your first patient. You'll be able to manage their sessions and track therapy progress.
            </p>
            <Button
              size="lg"
              onClick={() => setIsAddPatientOpen(true)}
              className="gap-2"
            >
              <Plus className="h-5 w-5" />
              Add Your First Patient
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
                <PatientCard
                  patient={patient}
                  onStartSession={handleStartSession}
                  hasActiveSession={false} // TODO: Implement active session check
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Add Patient Sheet */}
      <AddPatientSheet open={isAddPatientOpen} onOpenChange={setIsAddPatientOpen} />
    </div>
  );
}
