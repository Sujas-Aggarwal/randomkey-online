import * as React from "react";
import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SecurityBadgeProps {
  text?: string;
  className?: string;
}

/**
 * Subtle badge indicating that generation is local and private.
 * Used in ToolLayout and GeneratorPanel — not a marketing banner.
 */
export function SecurityBadge({
  text = "Generated locally · Never transmitted",
  className,
}: SecurityBadgeProps): React.JSX.Element {
  return (
    <p
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground",
        className
      )}
    >
      <ShieldCheck
        className="h-3.5 w-3.5 text-green-600 dark:text-green-500 shrink-0"
        aria-hidden="true"
      />
      <span>{text}</span>
    </p>
  );
}
