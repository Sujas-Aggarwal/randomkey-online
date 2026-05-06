import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Command } from "cmdk";
import { Search, KeyRound } from "lucide-react";
import { TOOLS } from "@/data/tools";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps): React.JSX.Element {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const handleSelect = useCallback(
    (slug: string) => {
      navigate(`/tools/${slug}`);
      onOpenChange(false);
      setSearch("");
    },
    [navigate, onOpenChange]
  );

  // Reset search when closed
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Global keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  const filteredTools = TOOLS.filter((tool) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.keywords.some((kw) => kw.toLowerCase().includes(q))
    );
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden p-0 shadow-2xl max-w-2xl">
        <Command className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group]:not([hidden])_~[cmdk-group]]:pt-0 [&_[cmdk-group]]:px-2 [&_[cmdk-input-wrapper]_svg]:h-5 [&_[cmdk-input-wrapper]_svg]:w-5 [&_[cmdk-input]]:h-12 [&_[cmdk-item]]:px-2 [&_[cmdk-item]]:py-3 [&_[cmdk-item]_svg]:h-5 [&_[cmdk-item]_svg]:w-5">
          <div className="flex items-center border-b px-3 pr-12" aria-label="Search">
            <Search className="mr-2 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
            <Command.Input
              value={search}
              onValueChange={setSearch}
              placeholder="Search tools..."
              className="flex h-11 w-full bg-transparent py-3 text-sm outline-none focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Search tools"
            />
          </div>
          <Command.List
            className="max-h-[400px] overflow-y-auto overflow-x-hidden"
            aria-label="Tool search results"
          >
            <Command.Empty className="py-6 text-center text-sm text-muted-foreground">
              No tools found.
            </Command.Empty>

            {filteredTools.length > 0 && (
              <Command.Group heading="Tools">
                {filteredTools.map((tool) => (
                  <Command.Item
                    key={tool.id}
                    value={`${tool.name} ${tool.description} ${tool.keywords.join(" ")}`}
                    onSelect={() => handleSelect(tool.slug)}
                    className="flex cursor-pointer select-none items-center gap-3 rounded-md px-3 py-2.5 text-sm outline-none aria-selected:bg-accent aria-selected:text-accent-foreground"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-md border bg-background">
                      <KeyRound className="h-4 w-4 text-primary" aria-hidden="true" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{tool.name}</span>
                      <span className="text-xs text-muted-foreground line-clamp-1">
                        {tool.description}
                      </span>
                    </div>
                  </Command.Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
          <div className="border-t px-3 py-2 flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-2">
              <span>
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">↑↓</kbd>
                {" "}navigate
              </span>
              <span>
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono">↵</kbd>
                {" "}select
              </span>
              <span>
                <kbd className="rounded border bg-muted px-1 py-0.5 font-mono text-[10px]">esc</kbd>
                {" "}close
              </span>
            </span>
            <span>{filteredTools.length} tools</span>
          </div>
        </Command>
      </DialogContent>
    </Dialog>
  );
}
