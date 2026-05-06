import { NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Clock, ChevronDown } from "lucide-react";
import { useState } from "react";
import { getToolsGroupedByCategory, TOOLS } from "@/data/tools";
import { useUserStore } from "@/store/userStore";
import { cn } from "@/lib/utils";
import { SITE } from "@/lib/site";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import type { Tool } from "@/types/tool";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

interface CategorySectionProps {
  label: string;
  tools: Tool[];
}

function CategorySection({ label, tools }: CategorySectionProps): React.JSX.Element {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="mb-2">
      <button
        onClick={() => setExpanded((e) => !e)}
        className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors"
        aria-expanded={expanded}
      >
        {label}
        <ChevronDown
          className={cn(
            "h-3 w-3 transition-transform duration-200",
            expanded ? "rotate-0" : "-rotate-90"
          )}
          aria-hidden="true"
        />
      </button>
      <AnimatePresence initial={false}>
        {expanded && (
          <motion.ul
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {tools.map((tool) => (
              <li key={tool.id}>
                <NavLink
                  to={`/tools/${tool.slug}`}
                  className={({ isActive }) =>
                    cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                      isActive
                        ? "bg-accent text-accent-foreground font-medium"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    )
                  }
                >
                  {tool.name}
                </NavLink>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Sidebar({ open, onClose }: SidebarProps): React.JSX.Element {
  const { favorites, recentTools } = useUserStore();
  const groups = getToolsGroupedByCategory();

  const favoriteTools = TOOLS.filter((t) => favorites.includes(t.id));
  const recentToolsList = recentTools
    .map((id) => TOOLS.find((t) => t.id === id))
    .filter((t): t is Tool => t !== undefined);

  const sidebarContent = (
    <nav
      className="flex h-full flex-col"
      aria-label="Tool navigation"
    >
      <div className="flex h-14 items-center justify-between border-b px-4 shrink-0">
        <NavLink
          to="/"
          className="text-sm font-bold tracking-tight text-foreground"
          aria-label={`${SITE.name} home`}
        >
          {SITE.shortName}<span className="text-primary">.online</span>
        </NavLink>
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="md:hidden"
          aria-label="Close navigation"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          {favoriteTools.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Star className="h-3 w-3" aria-hidden="true" />
                Favorites
              </div>
              <ul>
                {favoriteTools.map((tool) => (
                  <li key={tool.id}>
                    <NavLink
                      to={`/tools/${tool.slug}`}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )
                      }
                    >
                      {tool.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recentToolsList.length > 0 && (
            <div className="mb-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <Clock className="h-3 w-3" aria-hidden="true" />
                Recent
              </div>
              <ul>
                {recentToolsList.slice(0, 5).map((tool) => (
                  <li key={tool.id}>
                    <NavLink
                      to={`/tools/${tool.slug}`}
                      className={({ isActive }) =>
                        cn(
                          "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground font-medium"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted"
                        )
                      }
                    >
                      {tool.name}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {groups.map((group) => (
            <CategorySection
              key={group.category}
              label={group.label}
              tools={group.tools}
            />
          ))}
        </div>
      </ScrollArea>
    </nav>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
            onClick={onClose}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed left-0 top-0 z-50 h-full w-64 border-r bg-background md:hidden"
            aria-label="Site navigation"
          >
            {sidebarContent}
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Desktop static sidebar */}
      <aside
        className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-background md:h-screen md:sticky md:top-0"
        aria-label="Site navigation"
      >
        {sidebarContent}
      </aside>
    </>
  );
}
