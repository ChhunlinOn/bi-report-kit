import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "@/lib/utils";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      "brk-inline-flex brk-h-9 brk-items-center brk-rounded-md brk-bg-secondary brk-p-1 brk-text-secondary-foreground",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "brk-inline-flex brk-items-center brk-justify-center brk-whitespace-nowrap brk-rounded-sm brk-px-3 brk-py-1 brk-text-sm brk-font-medium brk-transition-all disabled:brk-pointer-events-none disabled:brk-opacity-50 data-[state=active]:brk-bg-card data-[state=active]:brk-shadow-sm",
      className
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content
    ref={ref}
    className={cn("brk-mt-2 focus-visible:brk-outline-none", className)}
    {...props}
  />
));
TabsContent.displayName = "TabsContent";
