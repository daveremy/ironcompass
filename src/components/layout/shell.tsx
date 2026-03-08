import Link from "next/link";
import type { ViewType } from "@/lib/types";

const NAV_ITEMS: { label: string; href: string; views: ViewType[] }[] = [
  { label: "Calendar", href: "/", views: ["calendar", "daily"] },
  { label: "Weekly", href: "/?view=weekly", views: ["weekly"] },
  { label: "Metrics", href: "/?view=metrics", views: ["metrics"] },
];

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
            {NAV_ITEMS.map((item) => {
              const active = item.views.includes(currentView);
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={`px-3 py-1.5 text-xs font-mono tracking-wider uppercase rounded transition-colors ${
                    active
                      ? "font-medium text-accent border border-accent/30 bg-accent/5"
                      : "text-muted hover:text-foreground hover:bg-surface-hover"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6">
        {children}
      </main>
    </div>
  );
}
