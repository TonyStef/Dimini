'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { NavLink } from '@/components/NavLink';
import AnimatedGraphBackground from '@/components/AnimatedGraphBackground';
import FeatureCard from '@/components/FeatureCard';
import HowItWorksFlow from '@/components/HowItWorksFlow';
import SemanticNetworkDemo from '@/components/SemanticNetworkDemo';
import { useAuth } from '@/hooks/useAuth';
import {
  Network,
  Brain,
  Sparkles,
  Shield,
  Lock,
  FileCheck,
  ArrowRight,
  Play,
  Github,
  Twitter,
  Mail,
  LogIn,
  UserPlus,
} from 'lucide-react';

export default function HomePage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  return (
    <div className="relative min-h-screen bg-background text-text-primary">
      {/* Animated Background */}
      <AnimatedGraphBackground />

      {/* Content Container */}
      <div className="relative z-10">
        {/* Navigation */}
        <motion.nav
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-6 py-6"
          role="navigation"
          aria-label="Main navigation"
        >
          {/* Skip to main content - Accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4
                       focus:px-4 focus:py-2 focus:bg-accent-primary focus:text-background focus:rounded-lg"
          >
            Skip to main content
          </a>

          <div className="flex items-center justify-between">
            {/* Logo - Now clickable */}
            <a
              href="#"
              className="flex items-center gap-2 min-h-[44px] rounded-lg
                         focus-visible:outline-2 focus-visible:outline-accent-primary
                         focus-visible:outline-offset-2"
              aria-label="Dimini - Home"
            >
              <Image 
                src="/logo.webp" 
                alt="Dimini Logo" 
                width={32} 
                height={32} 
                className="w-8 h-8"
              />
              <span className="font-display text-2xl font-bold">Dimini</span>
            </a>

            {/* Desktop Navigation - Enhanced spacing & professional typography */}
            <div className="hidden md:flex items-center gap-12">
              <a
                href="#features"
                className="relative py-3 text-lg font-bold tracking-wide
                           text-text-secondary hover:text-text-primary
                           transition-colors duration-200
                           after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0
                           after:bg-accent-primary after:transition-all after:duration-200
                           hover:after:w-full"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="relative py-3 text-lg font-bold tracking-wide
                           text-text-secondary hover:text-text-primary
                           transition-colors duration-200
                           after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0
                           after:bg-accent-primary after:transition-all after:duration-200
                           hover:after:w-full"
              >
                How It Works
              </a>
              <a
                href="#security"
                className="relative py-3 text-lg font-bold tracking-wide
                           text-text-secondary hover:text-text-primary
                           transition-colors duration-200
                           after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-0
                           after:bg-accent-primary after:transition-all after:duration-200
                           hover:after:w-full"
              >
                Security
              </a>
            </div>

            {/* Auth Buttons - Conditional based on authentication state */}
            {!isLoading && (
              <div className="flex items-center gap-4">
                {isAuthenticated ? (
                  <Button
                    variant="default"
                    size="default"
                    onClick={() => router.push('/dashboard')}
                  >
                    Dashboard
                  </Button>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost" size="default">
                        <LogIn className="w-4 h-4" />
                        Login
                      </Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="default" size="default">
                        <UserPlus className="w-4 h-4" />
                        Sign Up
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>
        </motion.nav>

        {/* Hero Section */}
        <section id="main-content" className="container mx-auto px-6 pt-32 pb-24 md:pt-44 md:pb-32">
          <div className="grid lg:grid-cols-2 gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-12"
            >
              <div className="space-y-8">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="inline-block"
                >
                  <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-elevated border border-border text-sm text-text-secondary">
                    <Sparkles className="w-4 h-4 text-accent-warm" />
                    AI-Powered Therapy Assistant
                  </span>
                </motion.div>

                <h1 className="font-display text-5xl md:text-7xl font-bold leading-[1.3] tracking-tight text-balance">
                  Illuminate the{' '}
                  <span className="text-accent-primary">Landscape</span> of Human
                  Conversation
                </h1>

                <p className="text-xl md:text-2xl text-text-secondary leading-relaxed text-balance max-w-2xl">
                  Real-time semantic relationship visualization for therapy sessions.
                  Watch topics, emotions, and connections emerge as conversations unfold.
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="flex flex-col sm:flex-row gap-5 sm:gap-8"
              >
                <Button variant="default" size="xl" className="group font-bold text-lg px-10">
                  Get Started
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button variant="ghost" size="xl" className="group text-lg px-10">
                  <Play className="w-6 h-6 group-hover:scale-110 transition-transform" />
                  Watch Overview
                </Button>
              </motion.div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
                className="flex items-center gap-6 pt-8 text-sm text-text-tertiary"
              >
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-success" />
                  <span>HIPAA Ready</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-success" />
                  <span>End-to-End Encrypted</span>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="relative hidden lg:block"
            >
              <div className="relative aspect-square">
                {/* Semantic Network Demo */}
                <div className="absolute inset-0 p-8">
                  <SemanticNetworkDemo />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Problem/Solution Section */}
        <section className="container mx-auto px-6 py-24 md:py-32">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16">
              {/* Problem */}
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="inline-block px-4 py-1 rounded-full bg-error/10 border border-error/20 text-error text-sm font-medium">
                  The Problem
                </div>
                <h2 className="font-display text-4xl font-semibold leading-tight">
                  Overwhelming Cognitive Load
                </h2>
                <div className="space-y-4 text-lg text-text-secondary leading-relaxed">
                  <p>
                    During therapy sessions, therapists must simultaneously:
                  </p>
                  <ul className="space-y-3 ml-6">
                    <li className="flex items-start gap-3">
                      <span className="text-error mt-1">•</span>
                      <span>Actively listen and engage with patients</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-error mt-1">•</span>
                      <span>Take comprehensive notes</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-error mt-1">•</span>
                      <span>Identify patterns and connections</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-error mt-1">•</span>
                      <span>Remember historical context</span>
                    </li>
                  </ul>
                  <p className="italic border-l-2 border-error/30 pl-4 py-2">
                    This cognitive burden can cause therapists to miss important
                    connections between topics discussed at different times.
                  </p>
                </div>
              </motion.div>

              {/* Solution */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.8 }}
                className="space-y-6"
              >
                <div className="inline-block px-4 py-1 rounded-full bg-success/10 border border-success/20 text-success text-sm font-medium">
                  The Solution
                </div>
                <h2 className="font-display text-4xl font-semibold leading-tight">
                  AI-Assisted Real-Time Mapping
                </h2>
                <div className="space-y-4 text-lg text-text-secondary leading-relaxed">
                  <p>
                    Dimini uses advanced AI to automatically:
                  </p>
                  <ul className="space-y-3 ml-6">
                    <li className="flex items-start gap-3">
                      <span className="text-success mt-1">✓</span>
                      <span>Extract topics and emotions from conversations</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-success mt-1">✓</span>
                      <span>Identify semantic relationships using embeddings</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-success mt-1">✓</span>
                      <span>Visualize connections in real-time</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-success mt-1">✓</span>
                      <span>Track patterns across multiple sessions</span>
                    </li>
                  </ul>
                  <p className="italic border-l-2 border-success/30 pl-4 py-2">
                    Therapists can focus entirely on their patients while Dimini
                    maintains the big picture of emerging patterns.
                  </p>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="font-display text-4xl md:text-5xl font-semibold">
              Core Capabilities
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Powered by cutting-edge AI to deliver insights in real-time
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <FeatureCard
              icon={Network}
              title="Real-time Graph Visualization"
              description="Watch semantic relationships emerge as conversations unfold. Physics-based animations naturally organize topics and emotions into meaningful clusters."
              delay={0}
            />
            <FeatureCard
              icon={Brain}
              title="AI Entity Extraction"
              description="GPT-4 powered analysis identifies topics, emotions, people, and events from therapy transcripts with medical-grade accuracy."
              delay={0.1}
            />
            <FeatureCard
              icon={Sparkles}
              title="Semantic Relationship Mapping"
              description="OpenAI embeddings calculate deep semantic connections between concepts, revealing patterns invisible to manual note-taking."
              delay={0.2}
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="container mx-auto px-6 py-24 md:py-32 bg-surface-elevated/30">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-20 space-y-4"
          >
            <h2 className="font-display text-4xl md:text-5xl font-semibold">
              How It Works
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              From conversation to visualization in milliseconds
            </p>
          </motion.div>

          <div className="max-w-5xl mx-auto">
            <HowItWorksFlow />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 text-center"
          >
            <Card className="inline-block glass px-8 py-4">
              <p className="text-text-secondary">
                <span className="text-accent-primary font-semibold font-mono">~3-4 seconds</span>
                {' '}total latency from transcript to visualization
              </p>
            </Card>
          </motion.div>
        </section>

        {/* Trust & Security Section */}
        <section id="security" className="container mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16 space-y-4"
          >
            <h2 className="font-display text-4xl md:text-5xl font-semibold">
              Privacy & Security First
            </h2>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Built with medical-grade security standards
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface-elevated">
                <Shield className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-display text-xl font-semibold">HIPAA Ready</h3>
              <p className="text-text-secondary">
                Designed with HIPAA compliance considerations for production deployment
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface-elevated">
                <Lock className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-display text-xl font-semibold">End-to-End Encryption</h3>
              <p className="text-text-secondary">
                All patient data encrypted at rest and in transit with industry standards
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-center space-y-4"
            >
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-surface-elevated">
                <FileCheck className="w-8 h-8 text-success" />
              </div>
              <h3 className="font-display text-xl font-semibold">Audit Logging</h3>
              <p className="text-text-secondary">
                Comprehensive audit trails for all data access and modifications
              </p>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="container mx-auto px-6 py-24 md:py-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8 }}
          >
            <Card className="glass max-w-4xl mx-auto text-center p-12 md:p-16 border-accent-primary/20">
              <div className="space-y-8">
                <div className="space-y-4">
                  <h2 className="font-display text-3xl md:text-5xl font-semibold">
                    Ready to Transform Your Practice?
                  </h2>
                  <p className="text-xl text-text-secondary max-w-2xl mx-auto">
                    Join therapists who are using AI to provide better care through
                    deeper insights.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="warm" size="xl" className="group">
                    Request Demo
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button variant="outline" size="xl">
                    Schedule Consultation
                  </Button>
                </div>

                <p className="text-sm text-text-tertiary">
                  Early access program • Limited spots available
                </p>
              </div>
            </Card>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border-subtle">
          <div className="container mx-auto px-6 py-12">
            <div className="grid md:grid-cols-4 gap-12">
              {/* Brand */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Network className="w-6 h-6 text-accent-primary" strokeWidth={1.5} />
                  <span className="font-display text-xl font-bold">Dimini</span>
                </div>
                <p className="text-sm text-text-secondary">
                  Illuminating the landscape of human conversation through AI.
                </p>
              </div>

              {/* Product */}
              <div className="space-y-4">
                <h4 className="font-display font-semibold">Product</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li><a href="#features" className="hover:text-text-primary transition-colors">Features</a></li>
                  <li><a href="#how-it-works" className="hover:text-text-primary transition-colors">How It Works</a></li>
                  <li><a href="#security" className="hover:text-text-primary transition-colors">Security</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">Pricing</a></li>
                </ul>
              </div>

              {/* Company */}
              <div className="space-y-4">
                <h4 className="font-display font-semibold">Company</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li><a href="#" className="hover:text-text-primary transition-colors">About</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">Blog</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">Contact</a></li>
                </ul>
              </div>

              {/* Legal */}
              <div className="space-y-4">
                <h4 className="font-display font-semibold">Legal</h4>
                <ul className="space-y-2 text-sm text-text-secondary">
                  <li><a href="#" className="hover:text-text-primary transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-text-primary transition-colors">HIPAA Compliance</a></li>
                </ul>
              </div>
            </div>

            <div className="mt-12 pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
              <p className="text-sm text-text-tertiary">
                © 2025 Dimini. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
