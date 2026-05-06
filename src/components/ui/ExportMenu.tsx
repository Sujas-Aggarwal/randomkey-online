import * as React from "react";
import { ChevronDown, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type ExportFormat = "txt" | "json" | "env" | "csv";

export interface ExportMenuProps {
  value: string;
  filename?: string;
  formats?: ExportFormat[];
}

const FORMAT_LABELS: Record<ExportFormat, string> = {
  txt: "Download as .txt",
  json: "Download as .json",
  env: "Download as .env",
  csv: "Download as .csv",
};

function buildContent(
  format: ExportFormat,
  value: string,
  slug: string
): { content: string; mimeType: string; ext: string } {
  const timestamp = new Date().toISOString();
  const envKey = slug.toUpperCase().replace(/[^A-Z0-9]/g, "_");

  switch (format) {
    case "txt":
      return { content: value, mimeType: "text/plain", ext: "txt" };

    case "json":
      return {
        content: JSON.stringify(
          { key: value, generated: timestamp, tool: slug },
          null,
          2
        ),
        mimeType: "application/json",
        ext: "json",
      };

    case "env":
      return {
        content: `${envKey}=${value}`,
        mimeType: "text/plain",
        ext: "env",
      };

    case "csv":
      return {
        content: `value,timestamp\n${JSON.stringify(value)},${timestamp}`,
        mimeType: "text/csv",
        ext: "csv",
      };
  }
}

function triggerDownload(content: string, mimeType: string, filename: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after the browser has had time to start the download
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

/**
 * Dropdown button that downloads the generated value in multiple formats.
 * All exports use Blob + createObjectURL — no server calls.
 */
export function ExportMenu({
  value,
  filename,
  formats = ["txt", "json"],
}: ExportMenuProps): React.JSX.Element {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const buttonRef = React.useRef<HTMLButtonElement>(null);

  // Derive slug from filename for env key naming
  const dateStr = new Date().toISOString().slice(0, 10);
  const slug = filename ?? `randomkey-export-${dateStr}`;

  // Close on outside click / Escape
  React.useEffect(() => {
    if (!open) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };

    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKey);
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.removeEventListener("mousedown", handleClick);
    };
  }, [open]);

  const handleExport = (format: ExportFormat) => {
    if (!value) return;
    const { content, mimeType, ext } = buildContent(format, value, slug);
    const finalFilename = `${slug}.${ext}`;
    triggerDownload(content, mimeType, finalFilename);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <Button
        ref={buttonRef}
        variant="outline"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Export generated value"
        disabled={!value}
        className="gap-2"
      >
        <Download className="h-4 w-4" aria-hidden="true" />
        <span>Export</span>
        <ChevronDown
          className={cn(
            "h-3.5 w-3.5 transition-transform duration-150",
            open && "rotate-180"
          )}
          aria-hidden="true"
        />
      </Button>

      {open && (
        <div
          role="menu"
          aria-label="Export options"
          className={cn(
            "absolute right-0 z-50 mt-1 min-w-[180px]",
            "rounded-md border bg-popover text-popover-foreground shadow-md",
            "py-1"
          )}
        >
          {formats.map((format) => (
            <button
              key={format}
              role="menuitem"
              onClick={() => handleExport(format)}
              className={cn(
                "flex w-full items-center gap-2 px-3 py-2 text-sm",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:outline-none focus-visible:bg-accent focus-visible:text-accent-foreground",
                "transition-colors"
              )}
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              {FORMAT_LABELS[format]}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
