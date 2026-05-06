import * as React from "react";
import { OutputBlock } from "@/components/ui/OutputBlock";
import { CopyButton } from "@/components/ui/CopyButton";
import { RegenerateButton } from "@/components/ui/RegenerateButton";
import { EntropyMeter } from "@/components/ui/EntropyMeter";
import { ExportMenu, type ExportFormat } from "@/components/ui/ExportMenu";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { OutputBlockSkeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";

export interface GeneratorPanelProps {
  output: string | string[];
  onRegenerate: () => void;
  isGenerating?: boolean;
  children?: React.ReactNode;
  outputLabel?: string;
  multiline?: boolean;
  showEntropy?: boolean;
  entropyBits?: number;
  exportFormats?: ExportFormat[];
  filename?: string;
  className?: string;
}

/**
 * The main interactive panel used by every tool page.
 *
 * Layout (top to bottom):
 *  1. OutputBlock (or multiple for array output)
 *  2. CopyButton + RegenerateButton (+ ExportMenu if array)
 *  3. EntropyMeter (if showEntropy)
 *  4. children (options / controls)
 *  5. SecurityBadge
 *
 * Keyboard: ⌘Enter / Ctrl+Enter triggers onRegenerate when the panel is focused.
 */
export function GeneratorPanel({
  output,
  onRegenerate,
  isGenerating = false,
  children,
  outputLabel,
  multiline = false,
  showEntropy = false,
  entropyBits = 0,
  exportFormats = ["txt", "json"],
  filename,
  className,
}: GeneratorPanelProps): React.JSX.Element {
  const panelRef = React.useRef<HTMLDivElement>(null);

  // ⌘Enter / Ctrl+Enter shortcut
  React.useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        onRegenerate();
      }
    };

    panel.addEventListener("keydown", handleKey);
    return () => panel.removeEventListener("keydown", handleKey);
  }, [onRegenerate]);

  const outputs = Array.isArray(output) ? output : [output];
  // For copy/export we join array outputs with newlines
  const joinedOutput = outputs.join("\n");
  // Display the primary (first) value for single-value tools
  const primaryOutput = outputs[0] ?? "";

  return (
    <section
      ref={panelRef}
      aria-label="Generator"
      className={cn(
        "rounded-lg border bg-card text-card-foreground shadow-sm",
        "p-5 sm:p-6 space-y-5",
        className
      )}
    >
      {/* Output area */}
      <div className="space-y-3">
        {isGenerating ? (
          <>
            {outputs.map((_, i) => (
              <OutputBlockSkeleton key={i} />
            ))}
          </>
        ) : outputs.length === 1 ? (
          <OutputBlock
            value={primaryOutput}
            label={outputLabel}
            multiline={multiline}
            aria-label={outputLabel ?? "Generated value"}
          />
        ) : (
          <div className="space-y-2">
            {outputs.map((val, i) => (
              <OutputBlock
                key={i}
                value={val}
                label={outputLabel ? `${outputLabel} ${i + 1}` : undefined}
                multiline={multiline}
                aria-label={`Generated value ${i + 1} of ${outputs.length}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Actions row */}
      <div className="flex flex-wrap items-center gap-2">
        <CopyButton value={joinedOutput} size="md" variant="outline" />

        <RegenerateButton
          onClick={onRegenerate}
          isGenerating={isGenerating}
          shortcutHint
        />

        <ExportMenu
          value={joinedOutput}
          filename={filename}
          formats={exportFormats}
        />
      </div>

      {/* Entropy meter */}
      {showEntropy && (
        <EntropyMeter bits={entropyBits} showLabel showBits />
      )}

      {/* Options / controls slot */}
      {children && (
        <div className="border-t pt-5">
          {children}
        </div>
      )}

      {/* Security badge */}
      <SecurityBadge />
    </section>
  );
}
