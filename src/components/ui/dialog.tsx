import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;

export const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="brk-fixed brk-inset-0 brk-z-50 brk-bg-black/40" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "brk-fixed brk-left-1/2 brk-top-1/2 brk-z-50 brk-w-full brk-max-w-lg brk-translate-x-[-50%] brk-translate-y-[-50%] brk-rounded-lg brk-border brk-border-border brk-bg-card brk-p-6 brk-text-card-foreground brk-shadow-lg",
        className
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="brk-absolute brk-right-4 brk-top-4 brk-opacity-60 hover:brk-opacity-100">
        <X className="brk-h-4 brk-w-4" />
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
DialogContent.displayName = "DialogContent";

export const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("brk-mb-4 brk-flex brk-flex-col brk-gap-1", className)} {...props} />
);

export const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title ref={ref} className={cn("brk-text-base brk-font-semibold", className)} {...props} />
));
DialogTitle.displayName = "DialogTitle";

export const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("brk-text-sm brk-text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = "DialogDescription";

export const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("brk-mt-4 brk-flex brk-justify-end brk-gap-2", className)} {...props} />
);
