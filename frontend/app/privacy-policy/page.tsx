'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="relative min-h-screen bg-background text-text-primary">
      {/* Simplified Header */}
      <header className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
            <div className="flex-1 flex justify-start">
              <Link
                href="/"
                className="flex items-center gap-3 min-h-[44px] rounded-lg
                           focus-visible:outline-2 focus-visible:outline-accent-primary
                           focus-visible:outline-offset-2"
                aria-label="Dimini - Home"
              >
                <img
                  src="/forweb.svg"
                  alt="Dimini mark"
                  className="w-8 h-8 text-current"
                  style={{ width: '2rem', height: '2rem' }}
                />
                <span className="font-display text-xl font-bold">Dimini</span>
              </Link>
            </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="max-w-4xl mx-auto"
        >
          <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight mb-12 text-center">
            Privacy Policy
          </h1>
          <div className="space-y-8 text-lg text-text-secondary leading-relaxed">
            <p className="text-sm text-center text-text-tertiary">Last updated: November 22, 2025</p>

            {/* Demo Notice */}
            <div className="p-6 rounded-lg bg-surface-elevated border border-warning/50">
              <h3 className="font-display text-xl font-semibold text-warning mb-3">Demonstration Project Notice</h3>
              <p>
                <strong>Dimini is a demonstration project and proof-of-concept.</strong> This Privacy Policy describes how the system would handle data in a hypothetical production environment. Currently, Dimini should NOT be used with real patient information or Protected Health Information (PHI). This is for educational and demonstration purposes only.
              </p>
            </div>

            <p>
              This Privacy Policy describes how Dimini ("we", "our", or "us") collects, uses, and protects information when you use our AI-powered therapy assistant platform (the "Service"). Your privacy is critically important to us, especially given the sensitive nature of mental health data.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Information We Collect</h2>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Account Information</h3>
            <p>
              When you create an account as a therapist or administrator, we collect:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Email address</li>
              <li>Name and professional credentials</li>
              <li>Password (encrypted)</li>
              <li>Professional license information (if applicable)</li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Patient Information</h3>
            <p>
              Therapists may input patient information including:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Patient name and contact details</li>
              <li>Demographic information</li>
              <li>Session metadata (date, time, duration)</li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Session Data</h3>
            <p>
              During therapy sessions, Dimini processes:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Conversation transcripts:</strong> Voice recordings are transcribed and processed</li>
              <li><strong>Extracted entities:</strong> Topics, emotions, people, and events identified by our AI</li>
              <li><strong>Semantic relationships:</strong> Connections between concepts discovered through embeddings</li>
              <li><strong>Session summaries:</strong> AI-generated insights and recommendations</li>
              <li><strong>Graph data:</strong> Visual representation of conversation patterns</li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Technical Data</h3>
            <p>
              We automatically collect certain technical information:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>IP address and browser information</li>
              <li>Device type and operating system</li>
              <li>Usage patterns and feature interactions</li>
              <li>Error logs and performance metrics</li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">How We Use Your Information</h2>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">AI Processing</h3>
            <p>
              Session transcripts are processed using:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>OpenAI GPT-4:</strong> For entity extraction and natural language understanding</li>
              <li><strong>OpenAI Embeddings API:</strong> For semantic similarity calculations (text-embedding-3-small model)</li>
            </ul>
            <p className="mt-4">
              These services process transcripts to identify topics, emotions, and relationships. Data is sent to OpenAI's API endpoints over encrypted connections. We recommend reviewing <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">OpenAI's Privacy Policy</a> for details on their data handling.
            </p>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Data Storage</h3>
            <p>
              All data is stored using Supabase (PostgreSQL database):
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Data encrypted at rest using industry-standard AES-256 encryption</li>
              <li>Data transmitted over TLS/SSL encrypted connections</li>
              <li>Database hosted in secure, SOC 2 Type II certified data centers</li>
              <li>Vector embeddings stored using pgvector extension for similarity search</li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Service Delivery</h3>
            <p>
              We use your information to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Provide real-time semantic graph visualization during sessions</li>
              <li>Generate AI-powered session summaries and insights</li>
              <li>Enable pattern recognition across multiple sessions</li>
              <li>Maintain session history and patient records</li>
              <li>Improve the accuracy of our AI models (in aggregate, de-identified form only)</li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Third-Party Services</h2>

            <p>
              Dimini integrates with the following third-party services:
            </p>

            <div className="space-y-4 pl-4">
              <div className="p-4 rounded-lg bg-surface-elevated border border-border-subtle">
                <h4 className="font-semibold text-text-primary mb-2">Supabase (Database & Real-time)</h4>
                <p className="text-base">Hosts our database and provides real-time synchronization. Data is encrypted at rest and in transit. <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Privacy Policy</a></p>
              </div>
              <div className="p-4 rounded-lg bg-surface-elevated border border-border-subtle">
                <h4 className="font-semibold text-text-primary mb-2">OpenAI (AI Processing)</h4>
                <p className="text-base">Processes transcripts for entity extraction and semantic analysis. We use their API with data processing agreements in place. <a href="https://openai.com/policies/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">Privacy Policy</a></p>
              </div>
              <div className="p-4 rounded-lg bg-surface-elevated border border-border-subtle">
                <h4 className="font-semibold text-text-primary mb-2">Voice Integration Partners (Future)</h4>
                <p className="text-base">Third-party voice agents may integrate with Dimini via our API. These partners have their own privacy policies governing voice recording and transcription.</p>
              </div>
            </div>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Data Retention</h2>
            <p>
              We retain data as follows:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Session transcripts and graphs:</strong> Retained indefinitely unless deleted by therapist</li>
              <li><strong>Patient records:</strong> Retained until therapist requests deletion</li>
              <li><strong>Account information:</strong> Retained while account is active plus 90 days after deletion</li>
              <li><strong>Anonymized analytics:</strong> May be retained indefinitely for research and improvement</li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Your Privacy Rights</h2>
            <p>
              Depending on your location, you may have the following rights:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Access:</strong> Request a copy of your data</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Export:</strong> Receive your data in a portable format</li>
              <li><strong>Objection:</strong> Object to certain processing activities</li>
              <li><strong>Restriction:</strong> Request limited processing of your data</li>
            </ul>
            <p className="mt-4">
              Therapists have full control over patient data and can delete sessions, patients, or their entire account at any time through the platform interface.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Security Measures</h2>
            <p>
              We implement multiple layers of security:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>End-to-end encryption for data in transit (TLS 1.3)</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Secure authentication with password hashing (bcrypt)</li>
              <li>API key rotation and management via environment variables</li>
              <li>Regular security audits and updates</li>
              <li>Limited employee access to production data</li>
              <li>Automated backup and disaster recovery procedures</li>
            </ul>
            <p className="mt-4 text-base">
              <strong>Note:</strong> No method of transmission or storage is 100% secure. While we use industry-standard security measures, we cannot guarantee absolute security.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">HIPAA Compliance Status</h2>
            <div className="p-6 rounded-lg bg-surface-elevated border border-warning/50">
              <p>
                <strong>Important:</strong> Dimini is currently a demonstration project and is <strong>NOT HIPAA-compliant</strong>. For production use with Protected Health Information (PHI), significant additional measures would be required including Business Associate Agreements (BAAs), comprehensive audit logging, advanced encryption, and adherence to HIPAA security rules. See our <a href="/hipaa-compliance" className="text-accent-primary hover:underline">HIPAA Compliance</a> page for details.
              </p>
            </div>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Children's Privacy</h2>
            <p>
              Dimini is not intended for use by individuals under 18 years of age. We do not knowingly collect personal information from children. If you believe we have inadvertently collected such information, please contact us immediately.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements. We will notify users of material changes via email or prominent notice on our platform. Continued use of Dimini after changes constitutes acceptance of the updated policy.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or our data practices, please contact us at:
            </p>
            <ul className="list-none space-y-2 pl-4">
              <li><strong>Email:</strong> privacy@dimini.example.com</li>
              <li><strong>GitHub:</strong> <a href="https://github.com/yourusername/dimini" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">github.com/yourusername/dimini</a></li>
            </ul>

            <div className="p-6 rounded-lg bg-accent-primary/10 border border-accent-primary/30 mt-12">
              <p className="text-sm text-center">
                <strong>Legal Disclaimer:</strong> This Privacy Policy is provided for demonstration purposes as part of a hackathon project. It does not constitute legal advice. Any production deployment of similar technology should involve legal counsel to ensure compliance with HIPAA, GDPR, CCPA, and other applicable privacy regulations.
              </p>
            </div>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle mt-24">
        <div className="container mx-auto px-6 py-12">
          <div className="grid md:grid-cols-4 gap-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/forweb.svg"
                  alt="Dimini logo"
                  className="w-10 h-10 rounded-lg shadow-accent-primary/20 shadow-lg"
                  style={{ width: '2.5rem', height: '2.5rem' }}
                />
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
                <li><Link href="/#features" className="hover:text-text-primary transition-colors">Features</Link></li>
                <li><Link href="/#how-it-works" className="hover:text-text-primary transition-colors">How It Works</Link></li>
                <li><Link href="/#security" className="hover:text-text-primary transition-colors">Security</Link></li>
                <li><Link href="#" className="hover:text-text-primary transition-colors">Pricing</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-display font-semibold">Company</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="/about" className="hover:text-text-primary transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-text-primary transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-text-primary transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-display font-semibold">Legal</h4>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li><Link href="/privacy-policy" className="hover:text-text-primary transition-colors">Privacy Policy</Link></li>
                <li><Link href="/terms-of-service" className="hover:text-text-primary transition-colors">Terms of Service</Link></li>
                <li><Link href="/hipaa-compliance" className="hover:text-text-primary transition-colors">HIPAA Compliance</Link></li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border-subtle flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <img
                src="/forweb.svg"
                alt="Dimini Logo"
                className="w-6 h-6 opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all duration-300"
                style={{ width: '1.5rem', height: '1.5rem' }}
              />
              <p className="text-sm text-text-tertiary">
                © 2025 Dimini. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
