/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone', // Required for Docker production builds
  reactStrictMode: true,
  typescript: {
    ignoreBuildErrors: true, // Hackathon mode - skip TypeScript errors!
  },
  eslint: {
    ignoreDuringBuilds: true, // Skip ESLint too!
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  experimental: {
    optimizePackageImports: ['lucide-react'],
  },
  // Ensure client-side only rendering for force-graph
  webpack: (config) => {
    config.externals = [...(config.externals || []), { canvas: 'canvas' }];
    return config;
  },
};

module.exports = nextConfig;
