import { Construction } from "lucide-react";

interface PlaceholderToolProps {
  toolId: string;
}

export function PlaceholderTool({ toolId }: PlaceholderToolProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border bg-muted">
        <Construction className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
      </div>
      <h2 className="text-lg font-semibold text-foreground">Coming in Phase 4</h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        The <strong>{toolId}</strong> tool is being built. The infrastructure,
        routing, and registry are all in place — implementation comes next.
      </p>
    </div>
  );
}
