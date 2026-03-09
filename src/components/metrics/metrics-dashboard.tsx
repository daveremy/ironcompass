"use client";

import { useState, useEffect, useCallback } from "react";
import {
  fetchTrend,
  fetchStreak,
  EMPTY_TREND_SUMMARY,
  type TrendResult,
  type SingleTrendResult,
  type MultiTrendResult,
  type StreakResult,
} from "@/lib/queries";
import { WEIGHT_GOAL, PROTEIN_TARGET } from "@/lib/config";
import RangeSelector from "./range-selector";
import MetricCard from "./metric-card";
import SleepCard from "./sleep-card";
import BPCard from "./bp-card";
import StreakCard from "./streak-card";

interface SleepCardPoint { date: string; oura_score: number | null; apple_score: number | null; hours: number | null }
interface BPCardPoint { date: string; systolic: number | null; diastolic: number | null }

function isSingle(t: TrendResult): t is SingleTrendResult {
  return "summary" in t;
}

function isMulti(t: TrendResult): t is MultiTrendResult {
  return "summaries" in t;
}

interface Trends {
  weight: TrendResult | null;
  sleep: TrendResult | null;
  pullups: TrendResult | null;
  bp: TrendResult | null;
  protein: TrendResult | null;
}

interface Streaks {
  alcoholFree: StreakResult | null;
  fasting: StreakResult | null;
}

function countFailed(results: PromiseSettledResult<unknown>[]): number {
  return results.filter((r) => r.status === "rejected").length;
}

export default function MetricsDashboard() {
  const [days, setDays] = useState(30);
  const [trends, setTrends] = useState<Trends | null>(null);
  const [trendsDays, setTrendsDays] = useState<number | null>(null);
  const [streaks, setStreaks] = useState<Streaks | null>(null);
  const [failedCount, setFailedCount] = useState(0);

  const loading = trends === null || trendsDays !== days;

  // Fetch streaks once on mount
  useEffect(() => {
    const controller = new AbortController();

    Promise.allSettled([
      fetchStreak("alcohol-free"),
      fetchStreak("fasting"),
    ]).then((results) => {
      if (controller.signal.aborted) return;
      const [af, f] = results;
      setStreaks({
        alcoholFree: af.status === "fulfilled" ? af.value : null,
        fasting: f.status === "fulfilled" ? f.value : null,
      });
      setFailedCount((prev) => prev + countFailed(results));
    });

    return () => controller.abort();
  }, []);

  const fetchTrends = useCallback((rangeDays: number) => {
    const controller = new AbortController();

    Promise.allSettled([
      fetchTrend("weight", rangeDays),
      fetchTrend("sleep", rangeDays),
      fetchTrend("pullups", rangeDays),
      fetchTrend("bp", rangeDays),
      fetchTrend("protein", rangeDays),
    ]).then((results) => {
      if (controller.signal.aborted) return;
      const [weight, sleep, pullups, bp, protein] = results;
      setTrends({
        weight: weight.status === "fulfilled" ? weight.value : null,
        sleep: sleep.status === "fulfilled" ? sleep.value : null,
        pullups: pullups.status === "fulfilled" ? pullups.value : null,
        bp: bp.status === "fulfilled" ? bp.value : null,
        protein: protein.status === "fulfilled" ? protein.value : null,
      });
      setTrendsDays(rangeDays);
      setFailedCount(countFailed(results));
    });

    return controller;
  }, []);

  // Fetch trends when days changes
  useEffect(() => {
    const controller = fetchTrends(days);
    return () => controller.abort();
  }, [days, fetchTrends]);

  if (loading && !trends) {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-mono text-sm font-bold tracking-[0.15em] uppercase text-foreground">
            Metrics
          </h2>
          <RangeSelector value={days} onChange={setDays} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div
              key={i}
              className="skeleton rounded-lg h-40"
              style={{ animationDelay: `${i * 50}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const weightData = trends?.weight && isSingle(trends.weight) ? trends.weight : null;
  const sleepData = trends?.sleep && isMulti(trends.sleep) ? trends.sleep : null;
  const pullupsData = trends?.pullups && isSingle(trends.pullups) ? trends.pullups : null;
  const bpData = trends?.bp && isMulti(trends.bp) ? trends.bp : null;
  const proteinData = trends?.protein && isSingle(trends.protein) ? trends.protein : null;

  return (
    <div data-testid="metrics-dashboard" className="animate-slide-in">
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-mono text-sm font-bold tracking-[0.15em] uppercase text-foreground">
          Metrics
        </h2>
        <RangeSelector value={days} onChange={setDays} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <MetricCard
          title="Weight"
          accent="#22c55e"
          points={weightData?.points ?? []}
          summary={weightData?.summary ?? EMPTY_TREND_SUMMARY}
          unit="lbs"
          goalLine={WEIGHT_GOAL}
          goalLabel="Target"
        />

        <SleepCard
          points={sleepData?.points as SleepCardPoint[] ?? []}
          summaries={sleepData?.summaries ?? {}}
        />

        <StreakCard
          title="Fasting Compliance"
          accent="#f97316"
          streak={streaks?.fasting?.current_streak ?? null}
          startDate={streaks?.fasting?.start_date ?? null}
          label="days compliant"
        />
        <StreakCard
          title="Alcohol-Free"
          accent="#06b6d4"
          streak={streaks?.alcoholFree?.current_streak ?? null}
          startDate={streaks?.alcoholFree?.start_date ?? null}
          label="days sober"
        />

        <MetricCard
          title="Pullups"
          accent="#eab308"
          points={pullupsData?.points ?? []}
          summary={pullupsData?.summary ?? EMPTY_TREND_SUMMARY}
        />

        <BPCard
          points={bpData?.points as BPCardPoint[] ?? []}
          summaries={bpData?.summaries ?? {}}
        />

        <div className="md:col-span-2">
          <MetricCard
            title="Protein"
            accent="#3b82f6"
            points={proteinData?.points ?? []}
            summary={proteinData?.summary ?? EMPTY_TREND_SUMMARY}
            unit="g"
            goalLine={PROTEIN_TARGET}
            goalLabel="Daily target"
          />
        </div>
      </div>

      {failedCount > 0 && (
        <div className="mt-3 px-3 py-2 rounded border border-amber-500/30 bg-amber-500/5 text-amber-400 text-xs font-mono">
          {failedCount} metric{failedCount > 1 ? "s" : ""} failed to load
        </div>
      )}

      {loading && (
        <div className="mt-3 text-center">
          <span className="text-xs font-mono text-muted animate-pulse">Updating...</span>
        </div>
      )}
    </div>
  );
}
