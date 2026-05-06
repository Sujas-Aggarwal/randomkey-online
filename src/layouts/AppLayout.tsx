import { useState, useCallback } from "react";
import { Outlet, Link } from "react-router-dom";
import { Menu, Command } from "lucide-react";
import { Sidebar } from "@/components/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CommandPalette } from "@/components/CommandPalette";
import { Button } from "@/components/ui/button";
import { SITE } from "@/lib/site";

export function AppLayout(): React.JSX.Element {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);

  const closeSidebar = useCallback(() => setSidebarOpen(false), []);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar open={sidebarOpen} onClose={closeSidebar} />

      <div className="flex flex-1 flex-col min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/95 backdrop-blur px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" aria-hidden="true" />
          </Button>

          <div className="flex-1" />

          <button
            type="button"
            onClick={() => setCommandOpen(true)}
            aria-label="Search tools (Cmd+K)"
            className="hidden sm:flex h-9 w-52 items-center justify-between gap-2 rounded-md border border-input bg-muted/40 px-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus:outline-none"
          >
            <span>Search tools...</span>
            <kbd className="inline-flex h-5 items-center gap-0.5 rounded border border-border bg-background px-1.5 text-[10px] font-medium text-muted-foreground">
              <span>⌘</span>K
            </kbd>
          </button>

          <Button
            variant="ghost"
            size="icon"
            className="sm:hidden"
            onClick={() => setCommandOpen(true)}
            aria-label="Search tools"
          >
            <Command className="h-4 w-4" aria-hidden="true" />
          </Button>

          <ThemeToggle />
        </header>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6" id="main-content">
          <Outlet />
        </main>

        {/* Footer */}
        <footer className="border-t py-6 px-4 md:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
            <p>
              &copy; {new Date().getFullYear()}{" "}
              <Link
                to="/"
                className="hover:text-foreground transition-colors font-medium"
              >
                {SITE.name}
              </Link>{" "}
              — All generation happens in your browser. Nothing is sent to servers.
            </p>
            <nav aria-label="Footer navigation" className="flex items-center gap-4">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <Link to="/about" className="hover:text-foreground transition-colors">
                About
              </Link>
              <a
                href="https://github.com/Sujas-Aggarwal/randomkey-online"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-foreground transition-colors"
              >
                GitHub
              </a>
            </nav>
          </div>
        </footer>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
