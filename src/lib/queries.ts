import { supabase } from "./supabase";
import { formatDate, addDays } from "./date";
import type {
  BloodPressureRow,
  BodyCompositionRow,
  CustomMetricRow,
  DailyEntryRow,
  FastingRow,
  MealRow,
  PullupsRow,
  SleepRow,
  SupplementsRow,
  WorkoutRow,
} from "./types";

// ─── Day Data ────────────────────────────────────────────

export interface DayData {
  daily: DailyEntryRow | null;
  sleep: SleepRow | null;
  fasting: FastingRow | null;
  workouts: WorkoutRow[];
  meals: MealRow[];
  bloodPressure: BloodPressureRow[];
  pullups: PullupsRow | null;
  supplements: SupplementsRow | null;
  bodyComp: BodyCompositionRow | null;
  customMetrics: CustomMetricRow[];
}

export async function fetchDayData(date: string): Promise<DayData> {
  const [
    dailyRes,
    sleepRes,
    fastingRes,
    workoutsRes,
    mealsRes,
    bpRes,
    pullupsRes,
    supplementsRes,
    bodyCompRes,
    customMetricsRes,
  ] = await Promise.all([
    supabase.from("daily_entries").select("*").eq("date", date).maybeSingle(),
    supabase.from("sleep").select("*").eq("date", date).maybeSingle(),
    supabase.from("fasting").select("*").eq("date", date).maybeSingle(),
    supabase.from("workouts").select("*").eq("date", date).order("created_at"),
    supabase.from("meals").select("*").eq("date", date).order("time"),
    supabase.from("blood_pressure").select("*").eq("date", date).order("time"),
    supabase.from("pullups").select("*").eq("date", date).maybeSingle(),
    supabase.from("supplements").select("*").eq("date", date).maybeSingle(),
    supabase.from("body_composition").select("*").eq("date", date).maybeSingle(),
    supabase.from("custom_metrics").select("*").eq("date", date).order("metric_name").order("created_at"),
  ]);

  const errors = [
    dailyRes, sleepRes, fastingRes, workoutsRes, mealsRes,
    bpRes, pullupsRes, supplementsRes, bodyCompRes, customMetricsRes,
  ]
    .filter((r) => r.error)
    .map((r) => r.error!.message);

  if (errors.length > 0) {
    throw new Error(`Failed to fetch day data: ${errors.join("; ")}`);
  }

  return {
    daily: dailyRes.data,
    sleep: sleepRes.data,
    fasting: fastingRes.data,
    workouts: workoutsRes.data ?? [],
    meals: mealsRes.data ?? [],
    bloodPressure: bpRes.data ?? [],
    pullups: pullupsRes.data,
    supplements: supplementsRes.data,
    bodyComp: bodyCompRes.data,
    customMetrics: customMetricsRes.data ?? [],
  };
}

// ─── Trend & Streak Queries (ported from CLI) ──────────────
// Dynamic column processing requires loose typing — mirrors CLI pattern
/* eslint-disable @typescript-eslint/no-explicit-any */

type TableName = "daily_entries" | "sleep" | "blood_pressure" | "pullups" | "meals" | "body_composition" | "fasting" | "workouts" | "custom_metrics" | "supplements";

interface TrendConfig {
  table: TableName;
  columns: string[];
  type: "single" | "multi" | "multi-daily-avg" | "daily-sum";
}

const METRIC_MAP: Record<string, TrendConfig> = {
  weight: { table: "daily_entries", columns: ["weight"], type: "single" },
  energy: { table: "daily_entries", columns: ["energy"], type: "single" },
  sleep: { table: "sleep", columns: ["oura_score", "apple_score", "hours"], type: "multi" },
  hrv: { table: "sleep", columns: ["avg_hrv"], type: "single" },
  "hr-sleep": { table: "sleep", columns: ["avg_hr_sleep"], type: "single" },
  readiness: { table: "sleep", columns: ["oura_readiness"], type: "single" },
  bp: { table: "blood_pressure", columns: ["systolic", "diastolic"], type: "multi-daily-avg" },
  pullups: { table: "pullups", columns: ["total_count"], type: "single" },
  calories: { table: "meals", columns: ["calories"], type: "daily-sum" },
  protein: { table: "meals", columns: ["protein_g"], type: "daily-sum" },
  "body-fat": { table: "body_composition", columns: ["body_fat_pct"], type: "single" },
};

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export interface TrendSummary {
  min: number | null;
  max: number | null;
  avg: number | null;
  delta: number | null;
  count: number;
}

export const EMPTY_TREND_SUMMARY: TrendSummary = { min: null, max: null, avg: null, delta: null, count: 0 };

function singleSummary(values: number[]): TrendSummary {
  if (values.length === 0) return { ...EMPTY_TREND_SUMMARY };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: avg(values),
    delta: values.length >= 2 ? values[values.length - 1] - values[0] : null,
    count: values.length,
  };
}

function dailySumPoints(rows: any[], col: string): Array<{ date: string; value: number }> {
  const byDate: Record<string, number> = {};
  for (const r of rows) {
    if (r[col] != null) byDate[r.date] = (byDate[r.date] ?? 0) + Number(r[col]);
  }
  return Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

function multiSummaries(columns: string[], points: any[]): Record<string, TrendSummary> {
  const summaries: Record<string, TrendSummary> = {};
  for (const col of columns) {
    const vals = points.map((p: any) => p[col]).filter((v: any) => v != null);
    summaries[col] = singleSummary(vals);
  }
  return summaries;
}

export interface SingleTrendResult {
  metric: string;
  days: number;
  points: Array<{ date: string; value: number }>;
  summary: TrendSummary;
}

export interface MultiTrendResult {
  metric: string;
  days: number;
  points: Array<Record<string, any>>;
  summaries: Record<string, TrendSummary>;
}

export type TrendResult = SingleTrendResult | MultiTrendResult;

function todayDate(): string {
  return formatDate(new Date());
}

function daysAgoDate(n: number): string {
  return formatDate(addDays(new Date(), -n));
}

export async function fetchTrend(metric: string, days: number): Promise<TrendResult> {
  const cfg = METRIC_MAP[metric];
  if (!cfg) throw new Error(`Unknown metric: ${metric}`);

  const start = daysAgoDate(days - 1);
  const end = todayDate();
  const selectCols = ["date", ...cfg.columns].join(", ");

  const { data: rows, error } = await supabase
    .from(cfg.table)
    .select(selectCols)
    .gte("date", start)
    .lte("date", end)
    .order("date", { ascending: true });

  if (error) throw new Error(`Query failed: ${error.message}`);
  const data = rows ?? [];

  if (cfg.type === "single") {
    const col = cfg.columns[0];
    const points = data
      .filter((r: any) => r[col] != null)
      .map((r: any) => ({ date: r.date as string, value: r[col] as number }));
    return { metric, days, points, summary: singleSummary(points.map((p) => p.value)) };
  }

  if (cfg.type === "multi-daily-avg") {
    const byDate: Record<string, Record<string, number[]>> = {};
    for (const r of data as any[]) {
      if (!byDate[r.date]) {
        byDate[r.date] = Object.fromEntries(cfg.columns.map((c) => [c, []]));
      }
      for (const col of cfg.columns) {
        if (r[col] != null) byDate[r.date][col].push(r[col]);
      }
    }
    const points = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, cols]) => {
        const point: any = { date };
        for (const col of cfg.columns) point[col] = avg(cols[col]);
        return point;
      });
    return { metric, days, points, summaries: multiSummaries(cfg.columns, points) };
  }

  if (cfg.type === "multi") {
    const points = data.map((r: any) => {
      const point: any = { date: r.date };
      for (const col of cfg.columns) point[col] = r[col] ?? null;
      return point;
    });
    return { metric, days, points, summaries: multiSummaries(cfg.columns, points) };
  }

  // daily-sum
  const points = dailySumPoints(data, cfg.columns[0]);
  return { metric, days, points, summary: singleSummary(points.map((p) => p.value)) };
}

// ─── Streaks ─────────────────────────────────────────────

interface StreakConfig {
  table: TableName;
  select: string;
  pass: (row: any) => boolean;
}

const STREAK_MAP: Record<string, StreakConfig> = {
  "alcohol-free": { table: "daily_entries", select: "date, alcohol", pass: (r) => r.alcohol === false },
  fasting: { table: "fasting", select: "date, compliant", pass: (r) => r.compliant === true },
};

export interface StreakResult {
  metric: string;
  current_streak: number;
  start_date: string | null;
}

export async function fetchStreak(metric: string): Promise<StreakResult> {
  const cfg = STREAK_MAP[metric];
  if (!cfg) throw new Error(`Unknown streak: ${metric}`);

  const today = todayDate();
  const rangeStart = daysAgoDate(365);

  const { data, error } = await supabase
    .from(cfg.table)
    .select(cfg.select)
    .gte("date", rangeStart)
    .lte("date", today)
    .order("date", { ascending: false });

  if (error) throw new Error(`Query failed: ${error.message}`);
  const rows = data ?? [];

  const rowsByDate = new Map<string, any>();
  for (const r of rows as any[]) {
    if (!rowsByDate.has(r.date)) rowsByDate.set(r.date, r);
  }

  let count = 0;
  for (let i = 0; ; i++) {
    const d = daysAgoDate(i);
    if (d < rangeStart) break;
    const row = rowsByDate.get(d);
    if (row && cfg.pass(row)) count++;
    else break;
  }

  const startDate = count > 0 ? daysAgoDate(count - 1) : null;
  return { metric, current_streak: count, start_date: startDate };
}

