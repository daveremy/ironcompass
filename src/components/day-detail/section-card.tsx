interface SectionCardProps {
  title: string;
  accent?: string;
  empty?: boolean;
  children: React.ReactNode;
}

export default function SectionCard({
  title,
  accent = "#22c55e",
  empty = false,
  children,
}: SectionCardProps) {
  return (
    <div
      data-testid={`section-${title.toLowerCase().replace(/\s+/g, "-")}`}
      className="bg-surface rounded-lg border border-border overflow-hidden"
      style={{ borderLeftColor: accent, borderLeftWidth: 3 }}
    >
      <div className="px-4 py-3 border-b border-border">
        <h3 className="font-mono text-[11px] font-semibold tracking-[0.15em] uppercase text-muted">
          {title}
        </h3>
      </div>
      <div className="px-4 py-3">
        {empty ? (
          <p className="text-sm text-muted/50 font-mono">Not logged</p>
        ) : (
          children
        )}
      </div>
    </div>
  );
}
