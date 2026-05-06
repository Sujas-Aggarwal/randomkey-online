import * as React from "react";
import { RefreshCw } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface RegenerateButtonProps {
  onClick: () => void;
  isGenerating?: boolean;
  shortcutHint?: boolean;
  className?: string;
}

/**
 * A standalone "Generate new value" button with an optional keyboard shortcut hint.
 * The icon rotates while isGenerating (respects prefers-reduced-motion).
 */
export function RegenerateButton({
  onClick,
  isGenerating = false,
  shortcutHint = false,
  className,
}: RegenerateButtonProps): React.JSX.Element {
  const prefersReducedMotion = useReducedMotion();

  const iconElement = prefersReducedMotion ? (
    <RefreshCw className="h-4 w-4" aria-hidden="true" />
  ) : (
    <motion.span
      animate={isGenerating ? { rotate: 360 } : { rotate: 0 }}
      transition={
        isGenerating
          ? { duration: 0.6, ease: "linear", repeat: Infinity }
          : { duration: 0 }
      }
      className="inline-flex"
      aria-hidden="true"
    >
      <RefreshCw className="h-4 w-4" />
    </motion.span>
  );

  return (
    <Button
      variant="default"
      onClick={onClick}
      disabled={isGenerating}
      aria-label="Generate new value"
      className={cn("gap-2", className)}
    >
      {iconElement}
      <span>Generate</span>
      {shortcutHint && (
        <kbd
          className="ml-1 hidden rounded border border-primary-foreground/30 px-1 py-0.5 text-[10px] font-mono opacity-70 sm:inline-flex"
          aria-label="Keyboard shortcut: Control or Command plus Enter"
        >
          ⌘↵
        </kbd>
      )}
    </Button>
  );
}
