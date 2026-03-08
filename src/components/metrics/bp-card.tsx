"use client";

import { useMemo } from "react";
import SectionCard from "@/components/day-detail/section-card";
import { Stat } from "@/components/day-detail/section-vitals";
import Sparkline from "./sparkline";
import ChartContainer from "./chart-container";
import { formatNumber } from "@/lib/format";
import type { TrendSummary } from "@/lib/queries";

interface BPPoint {
  date: string;
  systolic: number | null;
  diastolic: number | null;
}

interface BPCardProps {
  points: BPPoint[];
  summaries: Record<string, TrendSummary>;
}

export default function BPCard({ points, summaries }: BPCardProps) {
  const empty = points.length === 0;

  const sysPoints = useMemo(
    () => points.filter((p) => p.systolic != null).map((p) => ({ date: p.date, value: p.systolic! })),
    [points],
  );

  const diaPoints = useMemo(
    () => points.filter((p) => p.diastolic != null).map((p) => ({ date: p.date, value: p.diastolic! })),
    [points],
  );

  return (
    <SectionCard title="Blood Pressure" accent="#ef4444" empty={empty}>
      {!empty && (
        <>
          <ChartContainer points={points.map((p) => ({ date: p.date, value: p.systolic ?? p.diastolic ?? 0 }))}>
            <div className="h-full relative">
              {sysPoints.length > 0 && (
                <div className="absolute inset-0">
                  <Sparkline points={sysPoints} color="#ef4444" fill={false} />
                </div>
              )}
              {diaPoints.length > 0 && (
                <div className="absolute inset-0">
                  <Sparkline points={diaPoints} color="#3b82f6" fill={false} />
                </div>
              )}
            </div>
          </ChartContainer>
          <div className="flex gap-3 mb-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-0.5 bg-[#ef4444] rounded" />
              <span className="text-[10px] font-mono text-muted">Systolic</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-0.5 bg-[#3b82f6] rounded" />
              <span className="text-[10px] font-mono text-muted">Diastolic</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Stat label="Avg Systolic" value={formatNumber(summaries.systolic?.avg ?? null, 0)} unit="mmHg" />
            <Stat label="Avg Diastolic" value={formatNumber(summaries.diastolic?.avg ?? null, 0)} unit="mmHg" />
          </div>
        </>
      )}
    </SectionCard>
  );
}
