import * as React from "react";
import { cn } from "@/lib/utils";

interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Navigation Link Component
 *
 * Professional navigation link with enhanced spacing, typography, and accessibility.
 * Follows the "Clinical Precision with Warm Intelligence" design system.
 *
 * Features:
 * - WCAG 2.1 AA compliant (44px minimum touch target)
 * - Multi-layer hover feedback (color + background + underline)
 * - Optimized transitions (200ms for responsiveness)
 * - Keyboard accessible with focus state parity
 */
export const NavLink = React.forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ href, children, className }, ref) => {
    return (
      <a
        ref={ref}
        href={href}
        className={cn(
          // Layout & Spacing - 44px minimum touch target (WCAG)
          "relative inline-flex items-center min-h-[44px]",
          "px-5 py-2.5",

          // Typography - Enhanced readability
          "text-[15px] font-medium tracking-wide",

          // Colors - Design system alignment
          "text-text-secondary",
          "hover:text-text-primary focus:text-text-primary",

          // Visual Territory
          "rounded-md",
          "hover:bg-surface-elevated/40",

          // Micro-interaction
          "hover:translate-y-[-1px]",

          // Transitions - Performance optimized
          "transition-[color,background-color,transform] duration-200 ease-out",

          // Focus States - Accessibility
          "focus-visible:outline-2 focus-visible:outline-accent-primary focus-visible:outline-offset-2",

          // Underline Animation (::after pseudo-element)
          "after:absolute after:left-2 after:right-2 after:bottom-1",
          "after:h-[2px] after:w-0",
          "after:bg-accent-primary",
          "after:transition-[width] after:duration-200 after:ease-out",
          "hover:after:w-[calc(100%-1rem)] focus:after:w-[calc(100%-1rem)]",

          className
        )}
      >
        {children}
      </a>
    );
  }
);

NavLink.displayName = "NavLink";
