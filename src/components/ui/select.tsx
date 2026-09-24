import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";

export const Select = SelectPrimitive.Root;
export const SelectValue = SelectPrimitive.Value;
export const SelectGroup = SelectPrimitive.Group;

export const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    className={cn(
      "brk-flex brk-h-9 brk-w-full brk-items-center brk-justify-between brk-rounded-md brk-border brk-border-input brk-bg-transparent brk-px-3 brk-py-2 brk-text-sm brk-shadow-sm focus:brk-outline-none focus:brk-ring-1 focus:brk-ring-ring disabled:brk-cursor-not-allowed disabled:brk-opacity-50",
      className
    )}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="brk-h-4 brk-w-4 brk-opacity-50" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ className, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      position={position}
      className={cn(
        "brk-z-50 brk-min-w-[8rem] brk-overflow-hidden brk-rounded-md brk-border brk-border-border brk-bg-card brk-text-card-foreground brk-shadow-md",
        position === "popper" && "brk-translate-y-1",
        className
      )}
      // Caps the dropdown at ~8 rows so a schema with many tables scrolls
      // instead of running off (or past) the screen; still shrinks further
      // if there isn't even that much room below the trigger.
      style={{ maxHeight: "min(20rem, var(--radix-select-content-available-height, 20rem))" }}
      {...props}
    >
      <SelectPrimitive.ScrollUpButton className="brk-flex brk-items-center brk-justify-center brk-py-1 brk-text-muted-foreground">
        <ChevronUp className="brk-h-4 brk-w-4" />
      </SelectPrimitive.ScrollUpButton>
      <SelectPrimitive.Viewport className="brk-overflow-y-auto brk-p-1">{children}</SelectPrimitive.Viewport>
      <SelectPrimitive.ScrollDownButton className="brk-flex brk-items-center brk-justify-center brk-py-1 brk-text-muted-foreground">
        <ChevronDown className="brk-h-4 brk-w-4" />
      </SelectPrimitive.ScrollDownButton>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = "SelectContent";

export const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    className={cn(
      "brk-relative brk-flex brk-w-full brk-cursor-pointer brk-select-none brk-items-center brk-rounded-sm brk-py-1.5 brk-pl-7 brk-pr-2 brk-text-sm brk-outline-none focus:brk-bg-secondary data-[disabled]:brk-pointer-events-none data-[disabled]:brk-opacity-50",
      className
    )}
    {...props}
  >
    <span className="brk-absolute brk-left-2 brk-flex brk-h-3.5 brk-w-3.5 brk-items-center brk-justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="brk-h-4 brk-w-4" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = "SelectItem";
