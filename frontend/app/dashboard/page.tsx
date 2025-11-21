'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LogOut, Users, Settings, Activity, Loader2 } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent-primary mx-auto mb-4" />
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = async () => {
    await logout();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-surface">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="font-display text-2xl font-bold text-text-primary">
                Dimini Dashboard
              </h1>
              <p className="text-sm text-text-secondary">
                AI Therapy Assistant
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-12"
        >
          <h2 className="font-display text-3xl font-bold text-text-primary mb-2">
            Welcome back, {user.name}!
          </h2>
          <p className="text-text-secondary">
            Ready to visualize therapy sessions with AI-powered insights
          </p>
        </motion.div>

        {/* User Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8"
        >
          <Card className="bg-surface-elevated border-border p-6">
            <h3 className="font-display text-xl font-semibold text-text-primary mb-4">
              Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-text-tertiary mb-1">Name</p>
                <p className="text-text-primary font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-sm text-text-tertiary mb-1">Email</p>
                <p className="text-text-primary font-medium">{user.email}</p>
              </div>
              <div>
                <p className="text-sm text-text-tertiary mb-1">Role</p>
                <p className="text-text-primary font-medium capitalize">{user.role}</p>
              </div>
              <div>
                <p className="text-sm text-text-tertiary mb-1">Account Status</p>
                <p className="text-green-400 font-medium">Active</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className="font-display text-2xl font-semibold text-text-primary mb-6">
            Quick Actions
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Patients Card */}
            <Link href="/patients">
              <Card className="bg-surface-elevated border-border p-6 hover:bg-surface-overlay transition-all hover:shadow-glow cursor-pointer">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 rounded-lg bg-accent-primary/10">
                    <Users className="w-6 h-6 text-accent-primary" />
                  </div>
                  <h4 className="font-semibold text-text-primary">Patients</h4>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Manage your patient list and view session history
                </p>
                <Button size="sm" className="w-full">
                  View Patients
                </Button>
              </Card>
            </Link>

            {/* Sessions Card */}
            <Card className="bg-surface-elevated border-border p-6 hover:bg-surface-overlay transition-all hover:shadow-glow cursor-not-allowed">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-accent-warm/10">
                  <Activity className="w-6 h-6 text-accent-warm" />
                </div>
                <h4 className="font-semibold text-text-primary">Sessions</h4>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Start new sessions and view real-time semantic graphs
              </p>
              <p className="text-xs text-accent-warm">Coming soon</p>
            </Card>

            {/* Settings Card */}
            <Card className="bg-surface-elevated border-border p-6 hover:bg-surface-overlay transition-all hover:shadow-glow cursor-not-allowed">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 rounded-lg bg-text-tertiary/10">
                  <Settings className="w-6 h-6 text-text-tertiary" />
                </div>
                <h4 className="font-semibold text-text-primary">Settings</h4>
              </div>
              <p className="text-sm text-text-secondary mb-4">
                Configure your account preferences and integrations
              </p>
              <p className="text-xs text-accent-warm">Coming soon</p>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
