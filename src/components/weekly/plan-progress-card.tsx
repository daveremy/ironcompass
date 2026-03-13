import type { PlanStatusResult } from "@/lib/queries";
import type { WorkoutTypeLookup } from "@/lib/workout-types";
import { FALLBACK_COLOR } from "@/lib/workout-types";
import SectionCard from "@/components/day-detail/section-card";

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="w-full h-1.5 bg-border rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

export default function PlanProgressCard({ planStatus, typeLookup }: { planStatus: PlanStatusResult; typeLookup: WorkoutTypeLookup }) {
  const { summary, targets } = planStatus;

  return (
    <SectionCard title="Plan Progress" accent="#3b82f6">
      <div className="space-y-3">
        {/* Overall sessions */}
        <div>
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-xs font-mono text-foreground">
              {summary.completed}/{summary.planned} sessions
            </span>
            <span className="text-[10px] font-mono text-muted">
              {summary.skipped > 0 && `${summary.skipped} skipped`}
              {summary.skipped > 0 && summary.remaining > 0 && " / "}
              {summary.remaining > 0 && `${summary.remaining} remaining`}
            </span>
          </div>
          <ProgressBar value={summary.completed} max={summary.planned} color="#3b82f6" />
        </div>

        {/* Duration target */}
        {targets?.total_duration_min && (
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-xs font-mono text-foreground">
                {targets.total_duration_min.actual}/{targets.total_duration_min.target} min
              </span>
              {targets.total_duration_min.remaining > 0 && (
                <span className="text-[10px] font-mono text-muted">
                  {targets.total_duration_min.remaining} remaining
                </span>
              )}
            </div>
            <ProgressBar value={targets.total_duration_min.actual} max={targets.total_duration_min.target} color="#22c55e" />
          </div>
        )}

        {/* Per-type breakdown */}
        {targets?.by_type && Object.keys(targets.by_type).length > 0 && (
          <div className="border-t border-border pt-2 space-y-1.5">
            {Object.entries(targets.by_type).map(([type, t]) => {
              const color = typeLookup[type]?.color ?? FALLBACK_COLOR;
              const displayName = typeLookup[type]?.displayName ?? type;
              return (
                <div key={type} className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                  <span className="text-[10px] font-mono text-foreground/80 w-20 truncate">{displayName}</span>
                  {t.sessions && (
                    <span className="text-[10px] font-mono text-muted">{t.sessions.actual}/{t.sessions.target}</span>
                  )}
                  {t.duration_min && (
                    <span className="text-[10px] font-mono text-muted ml-1">{t.duration_min.actual}/{t.duration_min.target}m</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </SectionCard>
  );
}
