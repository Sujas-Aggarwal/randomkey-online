import * as React from "react";
import { motion, useReducedMotion } from "framer-motion";
import { cn } from "@/lib/utils";
import { entropyLabel, entropyPercent, type EntropyLabel } from "@/utils/entropy";

export interface EntropyMeterProps {
  bits: number;
  showLabel?: boolean;
  showBits?: boolean;
  className?: string;
}

const SEGMENT_COUNT = 4;

/** Maps an EntropyLabel to a Tailwind background color class. */
const SEGMENT_COLOR: Record<EntropyLabel, string> = {
  "very-weak": "bg-red-500",
  weak: "bg-orange-500",
  fair: "bg-yellow-500",
  strong: "bg-green-500",
  "very-strong": "bg-green-500",
};

/** Human-readable label text. */
const LABEL_TEXT: Record<EntropyLabel, string> = {
  "very-weak": "Very Weak",
  weak: "Weak",
  fair: "Fair",
  strong: "Strong",
  "very-strong": "Very Strong",
};

/** Number of segments to fill (1–4) per label. */
const SEGMENTS_FILLED: Record<EntropyLabel, number> = {
  "very-weak": 1,
  weak: 2,
  fair: 3,
  strong: 4,
  "very-strong": 4,
};

/**
 * Segmented entropy strength meter.
 * Accessible via role="meter" with appropriate aria attributes.
 */
export function EntropyMeter({
  bits,
  showLabel = true,
  showBits = false,
  className,
}: EntropyMeterProps): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();
  const label = entropyLabel(bits);
  const percent = entropyPercent(bits);
  const filledSegments = SEGMENTS_FILLED[label];
  const colorClass = SEGMENT_COLOR[label];
  const labelText = LABEL_TEXT[label];

  return (
    <div className={cn("w-full space-y-1.5", className)}>
      {/* Segmented bar */}
      <div
        role="meter"
        aria-valuenow={Math.round(bits)}
        aria-valuemin={0}
        aria-valuemax={128}
        aria-label={`Entropy strength: ${labelText}${showBits ? `, ${Math.round(bits)} bits` : ""}`}
        className="flex gap-1"
      >
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
          const filled = i < filledSegments;
          return (
            <div
              key={i}
              className={cn(
                "h-1.5 flex-1 rounded-full overflow-hidden",
                "bg-muted"
              )}
              aria-hidden="true"
            >
              {filled &&
                (prefersReducedMotion ? (
                  <div className={cn("h-full w-full", colorClass)} />
                ) : (
                  <motion.div
                    className={cn("h-full", colorClass)}
                    initial={{ width: 0 }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
                  />
                ))}
            </div>
          );
        })}
      </div>

      {/* Label row */}
      {(showLabel || showBits) && (
        <div className="flex items-center justify-between">
          {showLabel && (
            <span
              className={cn(
                "text-xs font-medium",
                label === "very-weak" && "text-red-500",
                label === "weak" && "text-orange-500",
                label === "fair" && "text-yellow-600 dark:text-yellow-400",
                (label === "strong" || label === "very-strong") && "text-green-600 dark:text-green-400"
              )}
            >
              {labelText}
            </span>
          )}
          {showBits && (
            <span className="text-xs text-muted-foreground tabular-nums">
              {Math.round(bits)} bits
            </span>
          )}
        </div>
      )}

      {/* Hidden for screen readers — meter role handles it */}
      <span className="sr-only">
        Entropy: {labelText}, {Math.round(bits)} bits ({percent}% of maximum)
      </span>
    </div>
  );
}
