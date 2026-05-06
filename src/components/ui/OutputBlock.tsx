import * as React from "react";
import { cn } from "@/lib/utils";

export interface OutputBlockProps {
  value: string;
  label?: string;
  multiline?: boolean;
  obscured?: boolean;
  className?: string;
  "aria-label"?: string;
}

/**
 * Displays a generated secret or key in a monospaced block.
 * Announces value changes to screen readers via aria-live.
 * When `obscured` is true, text is blurred until hover or keyboard focus.
 */
export function OutputBlock({
  value,
  label,
  multiline = false,
  obscured = false,
  className,
  "aria-label": ariaLabel,
}: OutputBlockProps): React.JSX.Element {
  const [revealed, setReveal] = React.useState(false);

  // Reset blur when value changes (avoid stale reveal state across generations)
  React.useEffect(() => {
    if (obscured) setReveal(false);
  }, [value, obscured]);

  const isBlurred = obscured && !revealed;

  return (
    <div className={cn("w-full", className)}>
      {label && (
        <p className="mb-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide select-none">
          {label}
        </p>
      )}

      {/* aria-live announces when the value changes */}
      <div
        role="region"
        aria-live="polite"
        aria-atomic="true"
        aria-label={ariaLabel ?? label ?? "Generated value"}
        onMouseEnter={() => obscured && setReveal(true)}
        onMouseLeave={() => obscured && setReveal(false)}
        onFocus={() => obscured && setReveal(true)}
        onBlur={() => obscured && setReveal(false)}
        tabIndex={obscured ? 0 : undefined}
        className={cn(
          // Base styles
          "relative w-full rounded-md border bg-muted/60 px-4 py-3",
          "font-mono text-sm text-foreground",
          "transition-all duration-150",
          // Multiline vs single-line
          multiline
            ? "whitespace-pre-wrap break-words min-h-[6rem]"
            : "break-all",
          // Obscured state
          isBlurred && "select-none cursor-pointer",
          // Focus ring when obscured (keyboard-accessible reveal)
          obscured &&
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
      >
        {isBlurred ? (
          <>
            <span className="blur-sm select-none" aria-hidden="true">
              {value}
            </span>
            <span className="sr-only">Value hidden. Hover or focus to reveal.</span>
          </>
        ) : (
          <span>
            {value || <span className="text-muted-foreground italic">—</span>}
          </span>
        )}
      </div>
    </div>
  );
}
