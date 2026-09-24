import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "brk-inline-flex brk-items-center brk-justify-center brk-gap-2 brk-whitespace-nowrap brk-rounded-md brk-text-sm brk-font-medium brk-transition-colors focus-visible:brk-outline-none focus-visible:brk-ring-2 focus-visible:brk-ring-ring disabled:brk-pointer-events-none disabled:brk-opacity-50",
  {
    variants: {
      variant: {
        default: "brk-bg-primary brk-text-primary-foreground hover:brk-opacity-90",
        secondary: "brk-bg-secondary brk-text-secondary-foreground hover:brk-opacity-80",
        outline: "brk-border brk-border-input brk-bg-transparent hover:brk-bg-secondary",
        ghost: "hover:brk-bg-secondary",
        destructive: "brk-bg-destructive brk-text-destructive-foreground hover:brk-opacity-90",
        link: "brk-text-primary brk-underline-offset-4 hover:brk-underline",
      },
      size: {
        default: "brk-h-9 brk-px-4 brk-py-2",
        sm: "brk-h-8 brk-rounded-md brk-px-3 brk-text-xs",
        lg: "brk-h-10 brk-rounded-md brk-px-6",
        icon: "brk-h-9 brk-w-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = "Button";
