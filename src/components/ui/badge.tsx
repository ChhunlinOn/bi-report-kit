import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "brk-inline-flex brk-items-center brk-rounded-full brk-border brk-px-2 brk-py-0.5 brk-text-xs brk-font-medium",
  {
    variants: {
      variant: {
        default: "brk-border-transparent brk-bg-primary brk-text-primary-foreground",
        secondary: "brk-border-transparent brk-bg-secondary brk-text-secondary-foreground",
        outline: "brk-border-border brk-text-foreground",
        success: "brk-border-transparent brk-bg-emerald-100 brk-text-emerald-800",
        destructive: "brk-border-transparent brk-bg-destructive brk-text-destructive-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant, className }))} {...props} />;
}
