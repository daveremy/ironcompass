import SectionCard from "@/components/day-detail/section-card";
import { Stat } from "@/components/day-detail/section-vitals";
import Sparkline from "./sparkline";
import { formatNumber } from "@/lib/format";
import type { TrendSummary } from "@/lib/queries";

interface MetricCardProps {
  title: string;
  accent: string;
  points: Array<{ date: string; value: number }>;
  summary: TrendSummary;
  unit?: string;
  goalLine?: number;
  goalLabel?: string;
}

export default function MetricCard({
  title,
  accent,
  points,
  summary,
  unit,
  goalLine,
  goalLabel,
}: MetricCardProps) {
  const empty = points.length === 0;

  return (
    <SectionCard title={title} accent={accent} empty={empty}>
      {!empty && (
        <>
          <div className="h-20 mb-3">
            <Sparkline
              points={points}
              color={accent}
              goalLine={goalLine}
              goalColor={goalLine != null ? `${accent}44` : undefined}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <Stat label="Current" value={formatNumber(points[points.length - 1].value)} unit={unit} />
            <Stat label="Avg" value={formatNumber(summary.avg)} unit={unit} />
            <Stat label="Min" value={formatNumber(summary.min)} unit={unit} />
            <Stat label="Max" value={formatNumber(summary.max)} unit={unit} />
          </div>
          {goalLabel && goalLine != null && (
            <p className="text-[10px] font-mono text-muted mt-2">
              Goal: {goalLine}{unit ? ` ${unit}` : ""} ({goalLabel})
            </p>
          )}
        </>
      )}
    </SectionCard>
  );
}
