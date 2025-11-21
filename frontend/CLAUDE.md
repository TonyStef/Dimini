# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Dimini** is an AI-powered therapy assistant that provides real-time semantic relationship visualization for therapy sessions. The frontend is a Next.js 15 application with React 19, using Tailwind CSS for styling and Framer Motion for animations. It visualizes topics, emotions, and connections as they emerge during conversations.

## Development Commands

```bash
# Development
npm run dev              # Start development server (http://localhost:3000)
npm run build           # Production build
npm run start           # Start production server
npm run lint            # Run ESLint
npm run type-check      # TypeScript type checking without emitting files
```

## Tech Stack

- **Framework**: Next.js 15.0.3 with App Router
- **React**: 19.0.0 (with React Server Components)
- **TypeScript**: 5.6.3 (strict mode enabled)
- **Styling**: Tailwind CSS 3.4.14 with custom design system
- **Animation**: Framer Motion 11.11.17
- **Graph Visualization**: react-force-graph-2d 1.25.4
- **UI Components**: Custom components using class-variance-authority
- **Icons**: Lucide React 0.454.0
- **Backend Integration**: Supabase 2.45.4, Axios 1.7.7

## Architecture

### Design System

The project uses a custom design system called **"Clinical Precision with Warm Intelligence"** defined in `app/globals.css`:

- **Color Palette**: Deep navy-black backgrounds with carefully crafted accent colors
  - Primary accent: `#7c9cbf` (muted blue)
  - Warm accent: `#e5ab6f` (warm amber)
  - Graph nodes: Topics (`#6ea8d3`), Emotions (`#d98282`)
- **Typography**: Three-font system
  - Display: Crimson Pro (serif, for headings)
  - Sans: Inter (body text)
  - Mono: JetBrains Mono (code/data)
- **Spacing**: 8px baseline grid system
- **Animations**: CSS custom properties for consistent timing (150ms/300ms/500ms)

### Component Structure

```
components/
├── ui/                           # Base UI components
│   ├── button.tsx               # CVA-based button with multiple variants
│   └── card.tsx                 # Card container component
├── AnimatedGraphBackground.tsx  # Canvas-based animated network background
├── FeatureCard.tsx              # Feature display cards
├── HowItWorksFlow.tsx          # Process flow visualization
└── SemanticNetworkDemo.tsx     # SVG-based semantic network demo
```

### Key Patterns

1. **Client Components**: All interactive components use `'use client'` directive
2. **CSS Variables**: Design tokens defined as CSS custom properties, referenced in Tailwind config
3. **Variant System**: Components use `class-variance-authority` for type-safe variants
4. **Animation Strategy**:
   - Framer Motion for React component animations
   - Native Canvas API for background effects
   - SVG with Framer Motion for semantic network demo
5. **Utility Pattern**: `lib/utils.ts` provides `cn()` for class merging, plus common utilities

### Page Structure

The app uses Next.js App Router with a single-page landing structure:

```
app/
├── layout.tsx     # Root layout with fonts, metadata
├── page.tsx       # Main landing page (Hero, Features, How It Works, Security, CTA)
└── globals.css    # Design system and Tailwind directives
```

## Important Implementation Notes

### Next.js Configuration

- **Webpack Externals**: Canvas is externalized for react-force-graph-2d compatibility
- **Image Optimization**: AVIF and WebP formats enabled
- **Package Imports**: Lucide-react is optimized for smaller bundles
- React Strict Mode is enabled

### Styling Conventions

- Use semantic color variables (e.g., `bg-surface-elevated`, `text-text-secondary`) instead of hardcoded values
- Follow the established design system color palette
- Maintain the 8px spacing grid using the custom spacing scale
- Use Tailwind's `@apply` sparingly; prefer utility classes

### Animation Best Practices

- Initial animation delays are staggered for visual hierarchy (typically 0.1-0.2s increments)
- Use `viewport={{ once: true, margin: "-100px" }}` for scroll-triggered animations
- Physics-based animations use `type: 'spring'` with consistent stiffness/damping
- Background animations run on Canvas for performance (60fps target)

### Path Aliases

- `@/*` maps to the project root (configured in `tsconfig.json`)
- Use absolute imports: `import { cn } from '@/lib/utils'`

### Graph Visualization

- **SemanticNetworkDemo**: Static SVG demo with animated nodes/edges for hero section
- **AnimatedGraphBackground**: Canvas-based particle network for ambient background
- Future integration with react-force-graph-2d planned for real-time dynamic graphs

## Known Constraints

- Canvas component requires client-side rendering (webpack external configured)
- React 19 is used (ensure compatibility when adding new libraries)
- Node >=18.0.0 and npm >=9.0.0 required

## Current Development Status

Based on recent commits:
- Landing page complete with hero, features, how-it-works sections
- Backend integration in progress (Supabase + API layer being developed)
- Design system fully implemented
- Graph visualization demo components complete
