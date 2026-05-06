import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Star, Home, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SecurityBadge } from "@/components/ui/SecurityBadge";
import { FAQSection, type FAQItem } from "@/components/FAQSection";
import { MetaTags } from "@/seo/MetaTags";
import { useUserStore } from "@/store/userStore";
import { getToolBySlug } from "@/data/tools";
import { TOOLS } from "@/data/tools";
import { cn } from "@/lib/utils";

export type { FAQItem };

interface ToolLayoutProps {
  toolId: string;
  children: React.ReactNode;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string[];
  /** FAQ items rendered in a FAQSection below the tool content */
  faqItems?: FAQItem[];
  /** IDs of related tools to show at the bottom */
  relatedToolIds?: string[];
  /** Security callout shown between the generator and FAQ */
  securityNotes?: string;
}

export function ToolLayout({
  toolId,
  children,
  metaTitle,
  metaDescription,
  metaKeywords,
  faqItems,
  relatedToolIds,
  securityNotes,
}: ToolLayoutProps): React.JSX.Element {
  const { addRecentTool, isFavorite, toggleFavorite } = useUserStore();
  const tool = getToolBySlug(toolId);
  const isStarred = isFavorite(toolId);

  useEffect(() => {
    addRecentTool(toolId);
  }, [toolId, addRecentTool]);

  // Resolve related tool objects (filter out unknown IDs)
  const relatedTools = (relatedToolIds ?? [])
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is NonNullable<typeof t> => t !== undefined)
    .slice(0, 6);

  return (
    <>
      <MetaTags
        title={metaTitle ?? tool?.name}
        description={metaDescription ?? tool?.description}
        keywords={metaKeywords ?? tool?.keywords}
        canonicalPath={`/tools/${toolId}`}
      />

      <div className="mx-auto max-w-4xl">
        {/* Breadcrumb */}
        <nav
          className="mb-6 flex items-center gap-1.5 text-sm text-muted-foreground"
          aria-label="Breadcrumb"
        >
          <Link
            to="/"
            className="flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <Home className="h-3.5 w-3.5" aria-hidden="true" />
            Home
          </Link>
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
          {tool && (
            <span className="text-foreground font-medium">{tool.name}</span>
          )}
        </nav>

        {/* Tool header */}
        {tool && (
          <div className="mb-2 flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {tool.name}
              </h1>
              <p className="mt-1.5 text-muted-foreground">{tool.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => toggleFavorite(toolId)}
              aria-label={isStarred ? "Remove from favorites" : "Add to favorites"}
              className="shrink-0"
            >
              <Star
                className={cn(
                  "h-4 w-4 transition-colors",
                  isStarred
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
            </Button>
          </div>
        )}

        {/* Security badge below H1 */}
        <SecurityBadge className="mb-6" />

        {/* Tool content (GeneratorPanel + tool-specific options) */}
        <div className="space-y-8">
          {children}

          {/* Security notes callout */}
          {securityNotes && (
            <aside
              aria-label="Security notes"
              className={cn(
                "flex gap-3 rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-3",
                "dark:border-yellow-900/50 dark:bg-yellow-950/30"
              )}
            >
              <AlertTriangle
                className="mt-0.5 h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400"
                aria-hidden="true"
              />
              <p className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
                {securityNotes}
              </p>
            </aside>
          )}

          {/* FAQ Section */}
          {faqItems && faqItems.length > 0 && (
            <FAQSection items={faqItems} />
          )}

          {/* Related Tools */}
          {relatedTools.length > 0 && (
            <section aria-labelledby="related-tools-heading">
              <h2
                id="related-tools-heading"
                className="mb-3 text-base font-semibold tracking-tight text-foreground"
              >
                Related Tools
              </h2>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {relatedTools.map((relTool) => (
                  <Link
                    key={relTool.id}
                    to={`/tools/${relTool.slug}`}
                    className={cn(
                      "group rounded-md border bg-card px-3 py-2.5",
                      "text-sm font-medium text-foreground",
                      "hover:border-primary/50 hover:bg-accent transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                  >
                    <span className="line-clamp-1">{relTool.name}</span>
                    <span className="mt-0.5 block truncate text-xs text-muted-foreground group-hover:text-muted-foreground">
                      {relTool.description}
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </>
  );
}
