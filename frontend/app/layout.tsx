import type { Metadata } from "next";
import { AuthProvider } from "@/contexts/AuthContext";
import { PatientsProvider } from "@/contexts/PatientsContext";
import { Toaster } from "sonner";
import "./globals.css";

// ========================================
// Metadata Configuration
// ========================================

export const metadata: Metadata = {
  title: "Dimini - AI Therapy Assistant",
  description: "Real-time semantic relationship visualization for therapy sessions. Powered by AI to help therapists track topics, emotions, and connections during patient conversations.",
  keywords: ["therapy", "AI", "mental health", "therapy assistant", "semantic analysis"],
  authors: [{ name: "Dimini Team" }],
  openGraph: {
    title: "Dimini - AI Therapy Assistant",
    description: "Real-time semantic relationship visualization for therapy sessions",
    type: "website",
  },
};

// ========================================
// Root Layout
// ========================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Crimson+Pro:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />
      </head>
      <body className="antialiased min-h-screen">
        <AuthProvider>
          <PatientsProvider>
            {children}
            <Toaster position="top-right" richColors closeButton />
          </PatientsProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
