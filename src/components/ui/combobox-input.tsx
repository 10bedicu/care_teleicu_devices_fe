import * as React from "react";

import { cn } from "@/lib/utils";

import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboboxInputProps
  extends Omit<React.ComponentProps<typeof Input>, "value" | "onChange"> {
  /** Text shown in the field. */
  value: string;
  /** Fired on every keystroke in the field. */
  onValueChange: (value: string) => void;
  /** Whether the dropdown is open. */
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Dropdown content — suggestion rows, a command list, sub-editors, etc. */
  children: React.ReactNode;
  contentClassName?: string;
  align?: "start" | "center" | "end";
  /** Lets the caller drive focus (e.g. refocus after selecting an option). */
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

/**
 * A native text input that anchors a dropdown directly beneath it — the field
 * itself is where you type, and the dropdown only presents suggestions.
 * Ported from care_fe ComboboxInput (desktop popover path).
 */
export function ComboboxInput({
  value,
  onValueChange,
  open,
  onOpenChange,
  children,
  contentClassName,
  align = "start",
  className,
  disabled,
  inputRef: externalRef,
  ...inputProps
}: ComboboxInputProps) {
  const internalRef = React.useRef<HTMLInputElement>(null);
  const inputRef = externalRef ?? internalRef;

  return (
    <Popover open={open && !disabled} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <Input
            ref={inputRef}
            value={value}
            onChange={(e) => onValueChange(e.target.value)}
            disabled={disabled}
            className={className}
            autoComplete="off"
            {...inputProps}
          />
        </div>
      </PopoverTrigger>
      <PopoverContent
        align={align}
        className={cn(
          "w-[var(--radix-popover-trigger-width)] min-w-56 p-0",
          contentClassName,
        )}
        // Keep the caret in the field when the dropdown opens, so the user can
        // keep typing instead of having focus yanked into the list.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {children}
      </PopoverContent>
    </Popover>
  );
}

export default ComboboxInput;
