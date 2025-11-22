'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function TermsOfServicePage() {
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
            Terms of Service
          </h1>
          <div className="space-y-8 text-lg text-text-secondary leading-relaxed">
            <p className="text-sm text-center text-text-tertiary">Last updated: November 22, 2025</p>

            {/* Demo Notice */}
            <div className="p-6 rounded-lg bg-surface-elevated border border-warning/50">
              <h3 className="font-display text-xl font-semibold text-warning mb-3">Demonstration Project Notice</h3>
              <p>
                <strong>Dimini is a demonstration project and proof-of-concept only.</strong> This service is NOT approved for use with real patients or Protected Health Information (PHI). These Terms of Service describe the intended use of a hypothetical production system. By using this demo, you acknowledge this is for educational and demonstration purposes only.
              </p>
            </div>

            <p>
              Please read these Terms of Service ("Terms") carefully before using the Dimini AI-powered therapy assistant platform ("Service", "Platform", or "Dimini"). These Terms govern your access to and use of Dimini.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Acceptance of Terms</h2>
            <p>
              By accessing or using Dimini, you ("User", "You", or "Your") agree to be bound by these Terms. If you do not agree to these Terms, you may not access or use the Service.
            </p>
            <p>
              These Terms constitute a legally binding agreement between you and Dimini ("we", "us", or "our"). Your access to and use of the Service is conditioned on your acceptance of and compliance with these Terms.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Demo/MVP Status and Limitations</h2>
            <div className="p-6 rounded-lg bg-surface-elevated border border-accent-primary/30">
              <h3 className="font-display text-xl font-semibold text-text-primary mb-3">Critical Limitations</h3>
              <ul className="list-disc list-inside space-y-3">
                <li><strong>NOT for Production Use:</strong> Dimini is a minimum viable product (MVP) and demonstration project. It is not production-ready and should not be used in actual clinical settings.</li>
                <li><strong>NOT HIPAA-Compliant:</strong> This service does not meet HIPAA requirements for handling Protected Health Information (PHI).</li>
                <li><strong>NO Medical Advice:</strong> Dimini does not provide medical advice, diagnosis, or treatment. It is a tool for visualization and pattern recognition only.</li>
                <li><strong>No Warranty:</strong> The service is provided "AS IS" without warranties of any kind, either express or implied.</li>
                <li><strong>No Liability:</strong> We are not liable for any decisions made based on information provided by the Service.</li>
              </ul>
            </div>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Acceptable Use</h2>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Permitted Use</h3>
            <p>
              You may use Dimini for:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Educational purposes and learning about AI-assisted therapy tools</li>
              <li>Research and academic study of conversation pattern analysis</li>
              <li>Demonstration and evaluation of the technology</li>
              <li>Testing the platform with synthetic or anonymized data only</li>
              <li>Hackathon presentations and technology showcases</li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Prohibited Use</h3>
            <p>
              You may NOT use Dimini for:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>Real patient data:</strong> Do not input actual patient information or PHI</li>
              <li><strong>Clinical decision-making:</strong> Do not use for actual therapeutic interventions</li>
              <li><strong>HIPAA-regulated activities:</strong> Do not use in any HIPAA-regulated context</li>
              <li><strong>Unauthorized access:</strong> Do not attempt to access other users' data</li>
              <li><strong>Malicious activity:</strong> No hacking, DDoS attacks, or exploitation of vulnerabilities</li>
              <li><strong>Automated scraping:</strong> No unauthorized automated data collection</li>
              <li><strong>Illegal purposes:</strong> No use for any illegal or unauthorized purpose</li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">User Accounts and Responsibilities</h2>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Account Creation</h3>
            <p>
              To use certain features of Dimini, you must create an account. When creating an account, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Provide accurate, complete, and current information</li>
              <li>Maintain the security of your password and account</li>
              <li>Promptly notify us of any unauthorized access or security breach</li>
              <li>Accept responsibility for all activities under your account</li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Professional Responsibilities (Therapist Users)</h3>
            <p>
              If you are a mental health professional using Dimini:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>You maintain sole responsibility for all clinical decisions</li>
              <li>You must follow all applicable professional licensing requirements and ethics codes</li>
              <li>You acknowledge that Dimini is a tool, not a replacement for professional judgment</li>
              <li>You are responsible for maintaining appropriate therapeutic boundaries</li>
              <li>You must obtain appropriate patient consent before using any therapy assistance tools</li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">No Medical Advice or Therapeutic Relationship</h2>
            <p>
              <strong>Important Medical Disclaimer:</strong>
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Dimini does not provide medical advice, diagnosis, or treatment</li>
              <li>No therapist-patient relationship is created by using this Service</li>
              <li>AI-generated insights are for informational purposes only</li>
              <li>Always consult qualified healthcare professionals for medical advice</li>
              <li>In case of emergency, contact 911 or your local emergency services immediately</li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Data Ownership and Rights</h2>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Your Content</h3>
            <p>
              You retain ownership of any content you input into Dimini, including session transcripts, patient information, and notes. However, by using the Service, you grant us a limited license to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Process your data through our AI systems (OpenAI GPT-4 and embeddings)</li>
              <li>Store your data in our database (Supabase)</li>
              <li>Display visualizations and insights generated from your data</li>
              <li>Use anonymized, aggregated data to improve the Service</li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Data Deletion</h3>
            <p>
              You may delete your data at any time through the platform interface. Upon deletion, we will remove your data from our active systems within 30 days, except where retention is required by law or for legitimate business purposes (e.g., anonymized analytics).
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Third-Party Services</h2>
            <p>
              Dimini integrates with third-party services including:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li><strong>OpenAI:</strong> For AI processing (GPT-4, embeddings)</li>
              <li><strong>Supabase:</strong> For database and real-time functionality</li>
              <li><strong>Voice integration partners:</strong> For speech-to-text (if applicable)</li>
            </ul>
            <p className="mt-4">
              Your use of these third-party services is subject to their respective terms of service and privacy policies. We are not responsible for the practices of these third parties.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Intellectual Property</h2>
            <p>
              The Service and its original content, features, and functionality are owned by Dimini and are protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
            <p>
              You may not:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Copy, modify, or distribute the Service's code or design</li>
              <li>Reverse engineer or decompile the Service</li>
              <li>Remove any copyright or proprietary notices</li>
              <li>Use our trademarks or branding without permission</li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Service Availability and Changes</h2>
            <p>
              We reserve the right to:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Modify or discontinue the Service at any time without notice</li>
              <li>Change these Terms at any time (we will notify you of material changes)</li>
              <li>Refuse service to anyone for any reason</li>
              <li>Limit features or access to certain users</li>
            </ul>
            <p className="mt-4">
              The Service may be temporarily unavailable due to maintenance, updates, or technical issues. We are not liable for any unavailability or data loss.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Limitation of Liability</h2>
            <div className="p-6 rounded-lg bg-surface-elevated border border-warning/50">
              <p>
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY LAW:</strong> Dimini and its affiliates, officers, employees, agents, and licensors shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, or other intangible losses, resulting from:
              </p>
              <ul className="list-disc list-inside space-y-2 pl-4 mt-3">
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to or use of our servers and/or any personal information stored therein</li>
                <li>Any errors, mistakes, or inaccuracies in the Service's output</li>
                <li>Any clinical decisions made based on the Service's insights</li>
                <li>Any patient outcomes or adverse events</li>
              </ul>
              <p className="mt-3">
                IN NO EVENT SHALL OUR TOTAL LIABILITY EXCEED ONE HUNDRED DOLLARS ($100.00) USD OR THE AMOUNT YOU PAID US IN THE LAST SIX MONTHS, WHICHEVER IS GREATER.
              </p>
            </div>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Indemnification</h2>
            <p>
              You agree to indemnify, defend, and hold harmless Dimini and its affiliates from any claims, damages, losses, liabilities, costs, and expenses (including reasonable attorneys' fees) arising from:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Your use or misuse of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any rights of another party</li>
              <li>Any clinical decisions or patient care decisions you make</li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Termination</h2>
            <p>
              We may terminate or suspend your access to the Service immediately, without prior notice or liability, for any reason, including:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Breach of these Terms</li>
              <li>Use of the Service with real patient data or PHI</li>
              <li>Fraudulent, abusive, or illegal activity</li>
              <li>At our sole discretion for any reason</li>
            </ul>
            <p className="mt-4">
              You may terminate your account at any time by contacting us or using the account deletion feature.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Governing Law and Disputes</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law provisions.
            </p>
            <p>
              Any disputes arising from these Terms or your use of the Service shall be resolved through binding arbitration, except where prohibited by law.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Changes to These Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of material changes by:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Posting an updated version with a new "Last updated" date</li>
              <li>Sending an email notification to registered users</li>
              <li>Displaying a prominent notice on the platform</li>
            </ul>
            <p className="mt-4">
              Your continued use of the Service after changes become effective constitutes acceptance of the modified Terms.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Severability</h2>
            <p>
              If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will remain in full force and effect.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Contact Information</h2>
            <p>
              If you have questions about these Terms, please contact us at:
            </p>
            <ul className="list-none space-y-2 pl-4">
              <li><strong>Email:</strong> legal@dimini.example.com</li>
              <li><strong>GitHub:</strong> <a href="https://github.com/yourusername/dimini" target="_blank" rel="noopener noreferrer" className="text-accent-primary hover:underline">github.com/yourusername/dimini</a></li>
            </ul>

            <div className="p-6 rounded-lg bg-accent-primary/10 border border-accent-primary/30 mt-12">
              <p className="text-sm text-center">
                <strong>Legal Disclaimer:</strong> These Terms of Service are provided for demonstration purposes as part of a hackathon project. They do not constitute legal advice. Any production deployment of similar technology should involve legal counsel to ensure compliance with applicable laws, regulations, and professional standards including HIPAA, state licensing requirements, and malpractice liability considerations.
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
