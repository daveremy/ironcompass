import type { MetricRow } from "@/lib/types";
import SectionCard from "./section-card";

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function SectionCustomMetrics({ data }: { data: MetricRow[] }) {
  if (data.length === 0) return null;

  // Group by metric_name
  const grouped = new Map<string, MetricRow[]>();
  for (const row of data) {
    if (!grouped.has(row.metric_name)) grouped.set(row.metric_name, []);
    grouped.get(row.metric_name)!.push(row);
  }

  return (
    <SectionCard title="Custom Metrics" accent="#8b5cf6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[...grouped.entries()].map(([name, rows]) => {
          const total = rows.reduce((s, r) => s + (r.numeric_value ?? 0), 0);
          const unit = rows[0].unit;
          const notes = rows.map((r) => r.notes).filter(Boolean);

          return (
            <div key={name}>
              <p className="text-[11px] font-mono text-muted uppercase tracking-wider mb-1">
                {capitalize(name)}
              </p>
              <p className="text-lg font-semibold text-foreground tabular-nums">
                {rows.length > 1 ? (
                  <>
                    <span className="text-sm text-muted font-normal">
                      {rows.map((r) => r.numeric_value).join(" + ")} ={" "}
                    </span>
                    {total}
                  </>
                ) : (
                  total
                )}
                {unit && <span className="text-sm text-muted font-normal ml-1">{unit}</span>}
              </p>
              {notes.length > 0 && (
                <p className="text-xs text-muted mt-0.5">{notes.join("; ")}</p>
              )}
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
