"use client";

import { useMemo } from "react";
import SectionCard from "@/components/day-detail/section-card";
import { Stat } from "@/components/day-detail/section-vitals";
import Sparkline from "./sparkline";
import { formatNumber } from "@/lib/format";
import type { TrendSummary } from "@/lib/queries";

interface SleepPoint {
  date: string;
  oura_score: number | null;
  apple_score: number | null;
  hours: number | null;
}

interface SleepCardProps {
  points: SleepPoint[];
  summaries: Record<string, TrendSummary>;
}

export default function SleepCard({ points, summaries }: SleepCardProps) {
  const empty = points.length === 0;

  const ouraPoints = useMemo(
    () => points.filter((p) => p.oura_score != null).map((p) => ({ date: p.date, value: p.oura_score! })),
    [points],
  );

  const applePoints = useMemo(
    () => points.filter((p) => p.apple_score != null).map((p) => ({ date: p.date, value: p.apple_score! })),
    [points],
  );

  return (
    <SectionCard title="Sleep" accent="#a855f7" empty={empty}>
      {!empty && (
        <>
          <div className="h-20 mb-3 relative">
            {ouraPoints.length > 0 && (
              <div className="absolute inset-0">
                <Sparkline points={ouraPoints} color="#a855f7" fill={false} />
              </div>
            )}
            {applePoints.length > 0 && (
              <div className="absolute inset-0">
                <Sparkline points={applePoints} color="#3b82f6" fill={false} />
              </div>
            )}
          </div>
          <div className="flex gap-3 mb-2">
            {ouraPoints.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-0.5 bg-[#a855f7] rounded" />
                <span className="text-[10px] font-mono text-muted">Oura</span>
              </div>
            )}
            {applePoints.length > 0 && (
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-0.5 bg-[#3b82f6] rounded" />
                <span className="text-[10px] font-mono text-muted">Apple</span>
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2">
            <Stat label="Avg Oura" value={formatNumber(summaries.oura_score?.avg ?? null)} />
            <Stat label="Avg Apple" value={formatNumber(summaries.apple_score?.avg ?? null)} />
            <Stat label="Avg Hours" value={formatNumber(summaries.hours?.avg ?? null)} unit="h" />
          </div>
        </>
      )}
    </SectionCard>
  );
}
