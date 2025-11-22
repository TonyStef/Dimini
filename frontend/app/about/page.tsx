'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

export default function AboutPage() {
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
            About Dimini
          </h1>
          <div className="space-y-8 text-lg text-text-secondary leading-relaxed">

            {/* Demo Notice */}
            <div className="p-6 rounded-lg bg-surface-elevated border border-accent-primary/30">
              <p className="text-accent-primary font-medium">
                Dimini is a demonstration project built for educational and research purposes. This represents our vision for the future of AI-assisted therapy support.
              </p>
            </div>

            <p className="text-xl leading-relaxed">
              Dimini is an AI-powered therapy assistant that creates live semantic relationship maps during therapy sessions. As therapists conduct sessions with patients, Dimini automatically visualizes the topics, emotions, and their connections in real-time, helping therapists better understand patterns and relationships in patient conversations.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Our Mission</h2>
            <p>
              We believe that therapists should be fully present with their patients—not burdened by note-taking, pattern recognition, and documentation. Dimini was created to reduce cognitive load on mental health professionals while enhancing the quality of care through intelligent, real-time analysis.
            </p>
            <p>
              By leveraging cutting-edge AI technology, we aim to illuminate the landscape of human conversation, revealing hidden connections and patterns that might otherwise go unnoticed during the intensity of a therapy session.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">The Challenge We're Solving</h2>
            <p>
              During therapy sessions, mental health professionals face an overwhelming cognitive burden:
            </p>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li><strong>Active listening</strong> while maintaining empathetic presence</li>
              <li><strong>Real-time note-taking</strong> without breaking connection</li>
              <li><strong>Pattern recognition</strong> across multiple sessions</li>
              <li><strong>Historical context recall</strong> from previous conversations</li>
              <li><strong>Insight generation</strong> to guide therapeutic interventions</li>
            </ul>
            <p className="pt-4">
              This multitasking can lead to missed connections, incomplete documentation, and therapist burnout—ultimately affecting the quality of patient care.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">How Dimini Works</h2>
            <p>
              Dimini employs advanced natural language processing and semantic AI to provide real-time support:
            </p>
            <div className="grid md:grid-cols-2 gap-6 py-6">
              <div className="p-6 rounded-lg bg-surface-elevated border border-border-subtle">
                <h3 className="font-display text-xl font-semibold text-text-primary mb-3">🎤 Listen</h3>
                <p className="text-base">Processes therapy conversations through voice integration, transcribing and analyzing in real-time.</p>
              </div>
              <div className="p-6 rounded-lg bg-surface-elevated border border-border-subtle">
                <h3 className="font-display text-xl font-semibold text-text-primary mb-3">🧠 Extract</h3>
                <p className="text-base">Uses GPT-4 to identify topics, emotions, people, and events as they emerge naturally in conversation.</p>
              </div>
              <div className="p-6 rounded-lg bg-surface-elevated border border-border-subtle">
                <h3 className="font-display text-xl font-semibold text-text-primary mb-3">🔗 Connect</h3>
                <p className="text-base">Employs AI embeddings to discover semantic relationships between concepts mentioned at different times.</p>
              </div>
              <div className="p-6 rounded-lg bg-surface-elevated border border-border-subtle">
                <h3 className="font-display text-xl font-semibold text-text-primary mb-3">📊 Visualize</h3>
                <p className="text-base">Creates beautiful, physics-based graphs that organize and display the therapy landscape intuitively.</p>
              </div>
            </div>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Our Technology</h2>
            <p>
              Dimini leverages state-of-the-art AI and modern web technologies:
            </p>
            <ul className="list-disc list-inside space-y-3 pl-4">
              <li><strong>OpenAI GPT-4</strong> for natural language understanding and entity extraction</li>
              <li><strong>Semantic Embeddings</strong> (text-embedding-3-small) for discovering hidden relationships</li>
              <li><strong>Real-time WebSocket Architecture</strong> via Supabase for live graph updates</li>
              <li><strong>Next.js 14 & React 19</strong> for a responsive, modern interface</li>
              <li><strong>PostgreSQL with pgvector</strong> for efficient similarity search</li>
              <li><strong>Physics-based Visualization</strong> using React Force Graph</li>
            </ul>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Built For</h2>
            <div className="space-y-6 pt-4">
              <div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2">🏥 Mental Health Professionals</h3>
                <p>Therapists, psychologists, and counselors seeking to reduce documentation burden while improving session insights and pattern recognition.</p>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2">🔬 Research & Academia</h3>
                <p>Psychology researchers, clinical trials, and academic institutions studying conversation patterns and therapeutic effectiveness.</p>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2">🎓 Training & Education</h3>
                <p>Psychology students and training programs using session visualization for case study analysis and supervisor review.</p>
              </div>
              <div>
                <h3 className="font-display text-xl font-semibold text-text-primary mb-2">🏢 Organizational Wellness</h3>
                <p>Employee assistance programs (EAP) and corporate mental health initiatives focused on scalable, quality care delivery.</p>
              </div>
            </div>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">The Innovation: Semantic Relationships</h2>
            <p>
              Unlike traditional note-taking or transcription tools, Dimini's core innovation is <strong>semantic relationship mapping</strong>. The system doesn't just record what was said—it understands the <em>meaning</em> behind the words.
            </p>
            <div className="p-6 rounded-lg bg-surface-elevated border border-accent-warm/30 my-6">
              <p className="font-mono text-sm mb-4 text-accent-warm">Example:</p>
              <ul className="space-y-2 text-base">
                <li><strong>Minute 5:</strong> Patient mentions "girlfriend" and "argument"</li>
                <li><strong>Minute 15:</strong> Patient mentions "anxiety" and "conflict avoidance"</li>
                <li className="text-accent-primary pt-2">→ <strong>Dimini automatically connects</strong> "argument" ↔ "conflict avoidance" (similarity: 0.81)</li>
              </ul>
            </div>
            <p>
              This semantic intelligence reveals patterns that might take therapists weeks to notice manually, enabling faster, more effective therapeutic interventions.
            </p>

            <h2 className="font-display text-3xl font-semibold text-text-primary pt-8">Project Vision</h2>
            <p>
              Dimini represents a proof-of-concept for the future of AI-assisted mental healthcare. While currently a demonstration project, our vision is to evolve this technology into a HIPAA-compliant, production-ready platform that empowers therapists worldwide.
            </p>
            <p>
              We envision a future where technology handles the mechanical aspects of therapy documentation, freeing mental health professionals to focus entirely on what they do best: providing compassionate, effective care to those who need it.
            </p>

            <div className="pt-8 pb-4 text-center">
              <p className="text-sm text-text-tertiary italic">
                "Illuminating the landscape of human conversation through AI."
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
