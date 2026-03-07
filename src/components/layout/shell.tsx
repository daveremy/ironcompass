import type { ViewType } from "@/lib/types";

export default function Shell({ children, currentView = "calendar" }: { children: React.ReactNode; currentView?: ViewType }) {
  return (
    <div className="min-h-screen bg-background hud-scanlines">
      <header className="border-b border-border bg-surface/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl flex items-center justify-between px-4 sm:px-6 h-14">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_#22c55e66]" />
            <span className="font-mono text-sm font-bold tracking-[0.2em] uppercase text-foreground">
              Iron<span className="text-accent">Compass</span>
            </span>
          </div>

          <nav className="flex items-center gap-1">
            <span className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded ${
              currentView === "calendar" || currentView === "daily"
                ? "font-medium text-accent border border-accent/30 bg-accent/5"
                : "text-muted cursor-not-allowed"
            }`}>
              Calendar
            </span>
            <span className="px-3 py-1.5 text-xs font-mono tracking-wider uppercase text-muted cursor-not-allowed">
              Metrics
            </span>
            <span className="px-3 py-1.5 text-xs font-mono tracking-wider uppercase text-muted cursor-not-allowed">
              Weekly
            </span>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
