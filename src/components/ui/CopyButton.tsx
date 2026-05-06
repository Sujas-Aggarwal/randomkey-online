import * as React from "react";
import { Check, Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CopyState = "idle" | "copied" | "error";

export interface CopyButtonProps {
  value: string;
  label?: string;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "ghost" | "outline";
  className?: string;
}

const SIZE_MAP = {
  sm: "sm" as const,
  md: "default" as const,
  lg: "lg" as const,
};

const ICON_SIZE_CLASS: Record<string, string> = {
  sm: "h-3.5 w-3.5",
  md: "h-4 w-4",
  lg: "h-5 w-5",
};

/**
 * Copy-to-clipboard button with inline state feedback.
 * No toast library — state resets after 1.5 s.
 */
export function CopyButton({
  value,
  label = "Copy",
  size = "md",
  variant = "outline",
  className,
}: CopyButtonProps): React.JSX.Element {
  const [state, setState] = React.useState<CopyState>("idle");
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = React.useCallback(async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setState("copied");
    } catch {
      setState("error");
    }

    // Clear any pending reset
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    timeoutRef.current = setTimeout(() => {
      setState("idle");
    }, 1500);
  }, [value]);

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const iconClass = ICON_SIZE_CLASS[size] ?? "h-4 w-4";

  const icon =
    state === "copied" ? (
      <Check className={cn(iconClass, "text-green-500")} aria-hidden="true" />
    ) : state === "error" ? (
      <X className={cn(iconClass, "text-destructive")} aria-hidden="true" />
    ) : (
      <Copy className={iconClass} aria-hidden="true" />
    );

  const displayLabel =
    state === "copied" ? "Copied!" : state === "error" ? "Failed" : label;

  const ariaLabel =
    state === "copied"
      ? "Copied to clipboard"
      : state === "error"
        ? "Copy failed"
        : "Copy to clipboard";

  return (
    <Button
      variant={variant}
      size={SIZE_MAP[size]}
      onClick={() => void handleCopy()}
      aria-label={ariaLabel}
      className={cn("gap-2", className)}
      disabled={!value}
    >
      {icon}
      <span>{displayLabel}</span>
    </Button>
  );
}
