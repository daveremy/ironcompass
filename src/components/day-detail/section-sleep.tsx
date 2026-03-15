import type { SleepRow, MetricRow } from "@/lib/types";
import SectionCard from "./section-card";
import Badge from "./badge";
import { Stat } from "./section-vitals";

export default function SectionSleep({
  data,
  sleepTags = [],
  prKeys,
}: {
  data: SleepRow | null;
  sleepTags?: MetricRow[];
  prKeys?: Set<string>;
}) {
  // Build stats array — only include fields that have data
  const stats: {
    label: string;
    value: number | string;
    unit?: string;
    indicator?: "pr" | "streak";
  }[] = [];

  if (data?.hours != null)
    stats.push({
      label: "Hours",
      value: data.hours,
      indicator: prKeys?.has("sleep_hours") ? "pr" : undefined,
    });
  if (data?.apple_score != null)
    stats.push({ label: "🍎 Apple", value: data.apple_score });
  if (data?.oura_score != null)
    stats.push({
      label: "◎ Oura",
      value: data.oura_score,
      indicator: prKeys?.has("sleep_oura") ? "pr" : undefined,
    });
  if (data?.oura_readiness != null)
    stats.push({ label: "◎ Readiness", value: data.oura_readiness });
  if (data?.avg_hrv != null)
    stats.push({ label: "Avg HRV", value: data.avg_hrv, unit: "ms" });
  if (data?.avg_hr_sleep != null)
    stats.push({ label: "Avg HR", value: data.avg_hr_sleep, unit: "bpm" });
  const OURA_SUBSCORES: { key: keyof SleepRow; label: string }[] = [
    { key: "oura_total", label: "◎ Total" },
    { key: "oura_deep", label: "◎ Deep" },
    { key: "oura_rem", label: "◎ REM" },
    { key: "oura_efficiency", label: "◎ Efficiency" },
    { key: "oura_latency", label: "◎ Latency" },
    { key: "oura_restfulness", label: "◎ Restful" },
    { key: "oura_timing", label: "◎ Timing" },
  ];
  for (const { key, label } of OURA_SUBSCORES) {
    if (data?.[key] != null) stats.push({ label, value: data[key] as number });
  }

  // Only show active badges (cpap=true, mouth_tape=true, logged sleep tags)
  const activeBadges: string[] = [];
  if (data?.cpap) activeBadges.push("CPAP");
  if (data?.mouth_tape) activeBadges.push("Mouth Tape");

  const hasContent =
    stats.length > 0 || activeBadges.length > 0 || sleepTags.length > 0 || !!data?.notes;

  return (
    <SectionCard title="Sleep" accent="#8b5cf6" empty={!hasContent}>
      {hasContent && (
        <div className="space-y-3">
          {stats.length > 0 && (
            <div className="grid grid-cols-2 gap-4">
              {stats.map((s) => (
                <Stat
                  key={s.label}
                  label={s.label}
                  value={s.value}
                  unit={s.unit}
                  indicator={s.indicator}
                />
              ))}
            </div>
          )}
          {(activeBadges.length > 0 || sleepTags.length > 0) && (
            <div className="flex gap-2 flex-wrap">
              {activeBadges.map((label) => (
                <Badge key={label} label={label} />
              ))}
              {sleepTags.map((tag) => (
                <Badge
                  key={tag.id}
                  label={tag.metric_name.replace(/-/g, " ")}
                />
              ))}
            </div>
          )}
          {data?.notes && (
            <p className="text-sm text-foreground/80">{data.notes}</p>
          )}
        </div>
      )}
    </SectionCard>
  );
}
