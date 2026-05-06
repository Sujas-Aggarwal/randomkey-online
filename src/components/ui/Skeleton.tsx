import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Base skeleton block. Pulses by default; goes static when
 * prefers-reduced-motion is active (via the CSS in globals.css which
 * overrides animation-duration to 0.01ms, stopping the pulse).
 */
export function Skeleton({
  className,
}: {
  className?: string;
}): React.JSX.Element {
  return (
    <div
      className={cn(
        "animate-pulse rounded-md bg-muted",
        className
      )}
      aria-hidden="true"
    />
  );
}

/** Skeleton for an OutputBlock — matches its height & shape. */
export function OutputBlockSkeleton(): React.JSX.Element {
  return (
    <div className="w-full space-y-2" aria-hidden="true">
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="h-12 w-full" />
    </div>
  );
}

/** Full skeleton matching the ToolLayout + GeneratorPanel structure. */
export function ToolPageSkeleton(): React.JSX.Element {
  return (
    <div className="mx-auto max-w-4xl space-y-8" aria-busy="true" aria-label="Loading tool">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2" aria-hidden="true">
        <Skeleton className="h-4 w-12" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-32" />
      </div>

      {/* Header */}
      <div className="space-y-2" aria-hidden="true">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
        <Skeleton className="h-3.5 w-48" />
      </div>

      {/* Generator panel */}
      <div className="rounded-lg border bg-card p-6 space-y-4" aria-hidden="true">
        <OutputBlockSkeleton />

        {/* Action buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-10 w-28" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Entropy meter */}
        <div className="space-y-1.5">
          <Skeleton className="h-1.5 w-full" />
          <Skeleton className="h-3.5 w-16" />
        </div>

        {/* Options */}
        <div className="border-t pt-4 space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-9 w-full" />
        </div>
      </div>
    </div>
  );
}
