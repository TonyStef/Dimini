import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all duration-base focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary text-text-inverse hover:bg-accent-primary/90 hover:shadow-glow",
        warm:
          "bg-accent-warm text-text-inverse hover:bg-accent-warm/90 hover:shadow-[0_0_20px_rgba(229,171,111,0.3)]",
        secondary:
          "bg-surface-elevated text-text-primary hover:bg-surface-overlay hover:shadow-md border border-border",
        ghost:
          "text-text-primary hover:bg-surface-elevated hover:text-text-primary",
        outline:
          "border-2 border-border bg-surface/30 text-text-primary hover:bg-surface-elevated hover:border-accent-primary hover:shadow-glow backdrop-blur-sm",
        link:
          "text-accent-primary underline-offset-4 hover:underline hover:text-accent-primary/80",
      },
      size: {
        default: "h-11 px-6 py-2 rounded-lg",
        sm: "h-9 px-4 text-xs rounded-md",
        lg: "h-14 px-8 text-base rounded-xl",
        xl: "h-16 px-10 text-lg rounded-2xl",
        icon: "h-11 w-11 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
