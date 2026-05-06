import * as React from "react";
import * as RadixCheckbox from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  description?: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export function Checkbox({
  id,
  checked,
  onCheckedChange,
  label,
  description,
  className,
  disabled,
}: CheckboxProps): React.JSX.Element {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <div className={cn("flex items-start gap-3", className)}>
      <RadixCheckbox.Root
        id={inputId}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        className={cn(
          "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded",
          "border border-input bg-background shadow-sm",
          "transition-colors duration-150",
          "hover:border-primary",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
      >
        <RadixCheckbox.Indicator>
          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={2.5} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>

      {label && (
        <label
          htmlFor={inputId}
          className={cn(
            "cursor-pointer select-none text-sm text-foreground leading-snug",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {label}
          {description && (
            <span className="block mt-0.5 text-xs text-muted-foreground font-normal">
              {description}
            </span>
          )}
        </label>
      )}
    </div>
  );
}

/* Checkbox wrapped inside a bordered card tile (for charset grids) */
interface CheckboxTileProps {
  id?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label: string;
  className?: string;
  disabled?: boolean;
}

export function CheckboxTile({
  id,
  checked,
  onCheckedChange,
  label,
  className,
  disabled,
}: CheckboxTileProps): React.JSX.Element {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;

  return (
    <label
      htmlFor={inputId}
      className={cn(
        "flex cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2.5 text-sm",
        "transition-colors duration-150 select-none",
        "hover:bg-accent",
        checked
          ? "border-primary/50 bg-primary/5 text-foreground"
          : "border-border bg-background text-foreground",
        disabled && "cursor-not-allowed opacity-50",
        className
      )}
    >
      <RadixCheckbox.Root
        id={inputId}
        checked={checked}
        onCheckedChange={(v) => onCheckedChange(v === true)}
        disabled={disabled}
        className={cn(
          "flex h-4 w-4 shrink-0 items-center justify-center rounded",
          "border border-input bg-background shadow-sm",
          "transition-colors duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
          "data-[state=checked]:border-primary data-[state=checked]:bg-primary",
        )}
      >
        <RadixCheckbox.Indicator>
          <Check className="h-3 w-3 text-primary-foreground" strokeWidth={2.5} />
        </RadixCheckbox.Indicator>
      </RadixCheckbox.Root>
      <span>{label}</span>
    </label>
  );
}
