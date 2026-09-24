import * as React from "react";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className, sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Content
    ref={ref}
    sideOffset={sideOffset}
    className={cn(
      "brk-z-50 brk-overflow-hidden brk-rounded-md brk-border brk-border-border brk-bg-card brk-px-3 brk-py-1.5 brk-text-xs brk-text-card-foreground brk-shadow-md",
      className
    )}
    {...props}
  />
));
TooltipContent.displayName = "TooltipContent";
