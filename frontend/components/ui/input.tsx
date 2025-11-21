import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-11 w-full rounded-lg border border-border bg-surface px-4 py-2 text-sm text-text-primary placeholder:text-text-tertiary transition-all duration-base",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:border-accent-primary",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "hover:border-accent-primary/50 hover:bg-surface-elevated/50 backdrop-blur-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
