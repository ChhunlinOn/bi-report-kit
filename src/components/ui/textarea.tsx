import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "brk-flex brk-w-full brk-rounded-md brk-border brk-border-input brk-bg-transparent brk-px-3 brk-py-2 brk-text-sm brk-shadow-sm brk-transition-colors placeholder:brk-text-muted-foreground focus-visible:brk-outline-none focus-visible:brk-ring-1 focus-visible:brk-ring-ring disabled:brk-cursor-not-allowed disabled:brk-opacity-50",
        className
      )}
      {...props}
    />
  )
);
Textarea.displayName = "Textarea";
