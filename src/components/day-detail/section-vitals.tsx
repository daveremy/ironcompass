import type { DailyEntryRow, MetricRow } from "@/lib/types";
import { PROMOTED_VITALS } from "@/lib/promoted-vitals";
import SectionCard from "./section-card";

function Stat({
  label,
  value,
  unit,
  indicator,
}: {
  label: string;
  value: string | number | null | undefined;
  unit?: string;
  indicator?: "pr" | "streak";
}) {
  return (
    <div>
      <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-0.5">{label}</p>
      <p className="text-sm font-mono text-foreground">
        {value != null ? (
          <>
            {value}
            {unit && <span className="text-muted ml-0.5">{unit}</span>}
            {indicator === "pr" && <span className="text-amber-400 text-[10px] ml-1">★</span>}
            {indicator === "streak" && <span className="text-accent text-[10px] ml-1">⚡</span>}
          </>
        ) : (
          "--"
        )}
      </p>
    </div>
  );
}

export { Stat };

function aggregatePromoted(metrics: MetricRow[]): { name: string; value: number; unit: string | null }[] {
  const grouped = new Map<string, MetricRow[]>();
  for (const row of metrics) {
    if (!grouped.has(row.metric_name)) grouped.set(row.metric_name, []);
    grouped.get(row.metric_name)!.push(row);
  }

  const results: { name: string; value: number; unit: string | null }[] = [];
  for (const [name, rows] of grouped) {
    if (!Object.hasOwn(PROMOTED_VITALS, name)) continue;
    const config = PROMOTED_VITALS[name];
    const unit = rows[0].unit;
    if (config.aggregate === "sum") {
      results.push({ name, value: rows.reduce((s, r) => s + (r.numeric_value ?? 0), 0), unit });
    } else {
      results.push({ name, value: rows[rows.length - 1].numeric_value ?? 0, unit });
    }
  }
  return results;
}

export default function SectionVitals({
  data,
  promotedMetrics = [],
  bodyFatPct,
  prKeys,
  streakKeys,
}: {
  data: DailyEntryRow | null;
  promotedMetrics?: MetricRow[];
  bodyFatPct?: number | null;
  prKeys?: Set<string>;
  streakKeys?: Set<string>;
}) {
  const aggregated = aggregatePromoted(promotedMetrics);
  const hasAny = data || aggregated.length > 0 || bodyFatPct != null;

  return (
    <SectionCard title="Vitals" accent="#22c55e" empty={!hasAny}>
      {hasAny && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Stat
            label="Weight"
            value={data?.weight}
            unit="lbs"
            indicator={prKeys?.has("weight_low") ? "pr" : undefined}
          />
          <Stat label="Energy" value={data?.energy != null ? `${data.energy}/5` : null} />
          <Stat
            label="Alcohol"
            value={data?.alcohol != null ? (data.alcohol ? "Yes" : "No") : null}
            indicator={
              streakKeys?.has("alcohol-free") && data?.alcohol === false ? "streak" : undefined
            }
          />
          {bodyFatPct != null && (
            <Stat
              label="Body Fat"
              value={bodyFatPct}
              unit="%"
              indicator={prKeys?.has("body_fat_low") ? "pr" : undefined}
            />
          )}
          {aggregated.map(({ name, value, unit }) => (
            <Stat
              key={name}
              label={PROMOTED_VITALS[name].label}
              value={value}
              unit={unit ?? undefined}
            />
          ))}
          {data?.notes && (
            <div className="col-span-full">
              <Stat label="Notes" value={data.notes} />
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}
