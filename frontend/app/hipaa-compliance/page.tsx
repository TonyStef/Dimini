'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function HIPAACompliancePage() {
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
            HIPAA Compliance
          </h1>
          <div className="space-y-8 text-lg text-text-secondary leading-relaxed">
            
            <div className="p-6 rounded-lg bg-surface-elevated border border-warning/50">
                <h2 className="font-display text-2xl font-semibold text-warning mb-4">
                    Important Disclaimer
                </h2>
                <p>
                    Dimini is currently a demonstration project and is <span className="font-bold">NOT HIPAA-COMPLIANT</span>. The information provided here is for informational purposes only and outlines the considerations and steps required to make a similar application compliant. Do not use this service with real patient data.
                </p>
            </div>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Understanding HIPAA</h2>
            <p>
              The Health Insurance Portability and Accountability Act (HIPAA) is a federal law that establishes national standards for protecting sensitive patient health information. Any system that handles Protected Health Information (PHI) in a clinical setting must comply with HIPAA's Privacy Rule, Security Rule, and Breach Notification Rule.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Our Stance on Privacy and Security</h2>
            <p>
              We are deeply committed to the principles of data privacy and security. While the current version of Dimini is a prototype, it has been designed with security best practices in mind, providing a solid foundation for a future, HIPAA-compliant version.
            </p>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Current Security Measures</h3>
            <p>
              Even as a demonstration project, Dimini implements several important security measures:
            </p>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li>
                <strong>Encryption in Transit:</strong> All data transmitted between the client, server, and third-party services uses TLS 1.3 encryption
              </li>
              <li>
                <strong>Encryption at Rest:</strong> Database hosted on Supabase with AES-256 encryption for all stored data
              </li>
              <li>
                <strong>Secure Credential Management:</strong> API keys and secrets managed via environment variables, never exposed to frontend
              </li>
              <li>
                <strong>Authentication:</strong> Password hashing using industry-standard bcrypt algorithm
              </li>
              <li>
                <strong>Database Security:</strong> PostgreSQL hosted in SOC 2 Type II certified data centers
              </li>
              <li>
                <strong>CORS Protection:</strong> Strict Cross-Origin Resource Sharing policies to prevent unauthorized access
              </li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Steps Required for HIPAA Compliance</h2>
            <p>
              For Dimini to be used in a production environment with Protected Health Information (PHI), the following comprehensive measures would need to be implemented:
            </p>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Administrative Safeguards</h3>
            <ul className="list-disc list-inside space-y-3 pl-4">
                <li>
                    <strong>Business Associate Agreements (BAA):</strong> Execute BAAs with all third-party vendors that process PHI:
                    <ul className="list-circle list-inside pl-6 mt-2 space-y-1 text-base">
                      <li>Supabase (database and real-time services)</li>
                      <li>OpenAI (GPT-4 and embeddings processing)</li>
                      <li>Any voice transcription service providers</li>
                      <li>Cloud infrastructure providers</li>
                    </ul>
                </li>
                <li>
                    <strong>Security Management Process:</strong> Establish policies and procedures to prevent, detect, contain, and correct security violations
                </li>
                <li>
                    <strong>Workforce Training:</strong> Implement mandatory HIPAA training for all personnel with access to PHI
                </li>
                <li>
                    <strong>Access Management:</strong> Implement authorization and supervision procedures for workforce members who access PHI
                </li>
                <li>
                    <strong>Contingency Planning:</strong> Develop disaster recovery and business continuity plans with regular testing
                </li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Technical Safeguards</h3>
            <ul className="list-disc list-inside space-y-3 pl-4">
                <li>
                    <strong>Authentication and Access Control:</strong>
                    <ul className="list-circle list-inside pl-6 mt-2 space-y-1 text-base">
                      <li>Multi-factor authentication (MFA) for all users</li>
                      <li>Role-Based Access Control (RBAC) with principle of least privilege</li>
                      <li>Unique user identifiers for audit trail purposes</li>
                      <li>Emergency access procedures with logging</li>
                    </ul>
                </li>
                <li>
                    <strong>Audit Controls:</strong> Comprehensive logging and monitoring:
                    <ul className="list-circle list-inside pl-6 mt-2 space-y-1 text-base">
                      <li>All PHI access events (read, create, update, delete)</li>
                      <li>Authentication attempts (successful and failed)</li>
                      <li>Administrative actions and configuration changes</li>
                      <li>Logs retained for minimum 6 years</li>
                      <li>Regular log review and anomaly detection</li>
                    </ul>
                </li>
                <li>
                    <strong>Data Encryption:</strong>
                    <ul className="list-circle list-inside pl-6 mt-2 space-y-1 text-base">
                      <li>TLS 1.3 for all data in transit</li>
                      <li>AES-256 encryption for data at rest</li>
                      <li>Application-level encryption for sensitive fields (transcripts)</li>
                      <li>Encrypted database backups</li>
                      <li>Key management using AWS KMS or similar</li>
                    </ul>
                </li>
                <li>
                    <strong>Row-Level Security (RLS):</strong> Database-level access controls ensuring users can only access their authorized data
                </li>
                <li>
                    <strong>Session Management:</strong>
                    <ul className="list-circle list-inside pl-6 mt-2 space-y-1 text-base">
                      <li>Automatic logout after 15 minutes of inactivity</li>
                      <li>Secure session token management</li>
                      <li>Session invalidation on logout</li>
                    </ul>
                </li>
                <li>
                    <strong>Transmission Security:</strong> Protect ePHI during transmission over electronic networks
                </li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Physical Safeguards</h3>
            <ul className="list-disc list-inside space-y-3 pl-4">
                <li>
                    <strong>Data Center Security:</strong> Use of SOC 2 Type II certified facilities with physical access controls
                </li>
                <li>
                    <strong>Device and Media Controls:</strong> Procedures for disposal and reuse of electronic media containing PHI
                </li>
                <li>
                    <strong>Workstation Security:</strong> Policies for securing devices that access PHI
                </li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Privacy Rule Requirements</h3>
            <ul className="list-disc list-inside space-y-3 pl-4">
                <li>
                    <strong>Patient Consent:</strong> Implement clear consent flows for PHI processing and AI analysis
                </li>
                <li>
                    <strong>Notice of Privacy Practices:</strong> Provide patients with notice of how their information will be used
                </li>
                <li>
                    <strong>Patient Rights:</strong> Enable patients to:
                    <ul className="list-circle list-inside pl-6 mt-2 space-y-1 text-base">
                      <li>Access their PHI</li>
                      <li>Request amendments</li>
                      <li>Receive an accounting of disclosures</li>
                      <li>Request restrictions on uses and disclosures</li>
                    </ul>
                </li>
                <li>
                    <strong>Minimum Necessary Standard:</strong> Limit PHI use and disclosure to the minimum necessary
                </li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Breach Notification</h3>
            <ul className="list-disc list-inside space-y-3 pl-4">
                <li>
                    <strong>Incident Response Plan:</strong> Procedures for detecting, responding to, and mitigating security incidents
                </li>
                <li>
                    <strong>Breach Notification:</strong> Process to notify affected individuals, HHS, and media (if applicable) within required timeframes
                </li>
                <li>
                    <strong>Forensic Capabilities:</strong> Tools and procedures to investigate potential breaches
                </li>
            </ul>

            <h3 className="font-display text-2xl font-semibold text-text-primary pt-6">Ongoing Compliance</h3>
            <ul className="list-disc list-inside space-y-3 pl-4">
                <li>
                    <strong>Regular Security Assessments:</strong> Annual third-party security audits and penetration testing
                </li>
                <li>
                    <strong>Vulnerability Management:</strong> Regular scanning and patching of security vulnerabilities
                </li>
                <li>
                    <strong>Privacy Impact Assessments:</strong> Evaluate privacy risks for new features
                </li>
                <li>
                    <strong>Policy Review:</strong> Annual review and update of all HIPAA policies and procedures
                </li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">AI-Specific Considerations</h2>
            <p>
              Using AI with healthcare data introduces unique compliance challenges:
            </p>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li>
                <strong>Third-Party AI Processing:</strong> OpenAI and other AI providers must sign BAAs and agree not to use PHI for model training
              </li>
              <li>
                <strong>Data Minimization:</strong> Consider de-identification or anonymization before sending data to AI services
              </li>
              <li>
                <strong>Transparency:</strong> Patients must be informed that AI is being used to analyze their sessions
              </li>
              <li>
                <strong>Accuracy and Reliability:</strong> Regular validation of AI outputs for clinical accuracy
              </li>
              <li>
                <strong>Explainability:</strong> Ability to explain how AI reached specific insights or connections
              </li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Cost and Timeline Estimates</h2>
            <div className="p-6 rounded-lg bg-surface-elevated border border-border-subtle">
              <p className="mb-4">
                Achieving full HIPAA compliance is a significant undertaking. Based on industry standards, implementing these requirements would likely require:
              </p>
              <ul className="list-disc list-inside space-y-2 text-base">
                <li><strong>Timeline:</strong> 6-12 months for initial compliance</li>
                <li><strong>Development Resources:</strong> 2-3 full-time engineers</li>
                <li><strong>Compliance/Legal:</strong> HIPAA consultant and legal counsel</li>
                <li><strong>Security Audit:</strong> $20,000-50,000 for third-party audit</li>
                <li><strong>Annual Maintenance:</strong> Ongoing monitoring, training, and audits</li>
              </ul>
            </div>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Our Roadmap to Compliance</h2>
            <p>
              Achieving full HIPAA compliance is a cornerstone of our long-term vision for Dimini. Our planned approach includes:
            </p>
            <ul className="list-disc list-inside space-y-2 pl-4">
              <li>Partnering with HIPAA compliance consultants and legal experts</li>
              <li>Evaluating and selecting vendors with existing BAAs in place</li>
              <li>Implementing comprehensive audit logging and monitoring infrastructure</li>
              <li>Developing robust access control and authentication systems</li>
              <li>Creating detailed security policies and procedures</li>
              <li>Conducting third-party security assessments and penetration tests</li>
              <li>Establishing incident response and breach notification processes</li>
            </ul>
            <p className="mt-4">
              While the current demonstration showcases the technical innovation and potential of AI-assisted therapy visualization, we recognize that patient privacy and data security are paramount for any production deployment in healthcare settings.
            </p>
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
