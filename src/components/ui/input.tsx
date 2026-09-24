import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      ref={ref}
      className={cn(
        "brk-flex brk-h-9 brk-w-full brk-rounded-md brk-border brk-border-input brk-bg-transparent brk-px-3 brk-py-1 brk-text-sm brk-shadow-sm brk-transition-colors placeholder:brk-text-muted-foreground focus-visible:brk-outline-none focus-visible:brk-ring-1 focus-visible:brk-ring-ring disabled:brk-cursor-not-allowed disabled:brk-opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";
