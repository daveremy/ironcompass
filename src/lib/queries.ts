import { supabase } from "./supabase";
import { formatDate, addDays, getMonday } from "./date";
import type {
  BloodPressureRow,
  BodyCompositionRow,
  CustomMetricRow,
  DailyEntryRow,
  DaySummary,
  FastingRow,
  MealRow,
  PullupsRow,
  SleepRow,
  SupplementsRow,
  WorkoutRow,
  WeekData,
  WeekSummary,
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
    supabase.from("workouts").select("*").eq("date", date).order("start_time", { ascending: true, nullsFirst: false }).order("created_at"),
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
  logged: (row: any) => boolean;
  queryFilter?: (query: any) => any;
}

const STREAK_MAP: Record<string, StreakConfig> = {
  "alcohol-free": { table: "daily_entries", select: "date, alcohol", pass: (r) => r.alcohol === false, logged: (r) => r.alcohol != null },
  fasting: { table: "fasting", select: "date, compliant", pass: (r) => r.compliant === true, logged: (r) => r.compliant != null },
  workout: { table: "workouts", select: "date", pass: () => true, logged: () => true, queryFilter: (q: any) => q.or("completed.is.null,completed.eq.true") },
  logging: { table: "daily_entries", select: "date", pass: () => true, logged: () => true },
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

  let query = supabase
    .from(cfg.table)
    .select(cfg.select)
    .gte("date", rangeStart)
    .lte("date", today)
    .order("date", { ascending: false });
  if (cfg.queryFilter) query = cfg.queryFilter(query);
  const { data, error } = await query;

  if (error) throw new Error(`Query failed: ${error.message}`);
  const rows = data ?? [];

  const rowsByDate = new Map<string, any>();
  for (const r of rows as any[]) {
    if (!rowsByDate.has(r.date)) rowsByDate.set(r.date, r);
  }

  let count = 0;
  let offset = 0;
  // Skip today if not yet logged (no row, or relevant field still null)
  const todayRow = rowsByDate.get(daysAgoDate(0));
  if (!todayRow || !cfg.logged(todayRow)) offset = 1;

  for (let i = offset; ; i++) {
    const d = daysAgoDate(i);
    if (d < rangeStart) break;
    const row = rowsByDate.get(d);
    if (row && cfg.pass(row)) count++;
    else break;
  }

  const startDate = count > 0 ? daysAgoDate(count + offset - 1) : null;
  return { metric, current_streak: count, start_date: startDate };
}

// ─── Weekly Data ──────────────────────────────────────────

export async function fetchWeekData(startDate: string): Promise<WeekData> {
  const start = startDate;
  const end = formatDate(addDays(new Date(start + "T00:00:00"), 6));

  const [dailyRes, sleepRes, workoutsRes, mealsRes, fastingRes, pullupsRes] =
    await Promise.all([
      supabase.from("daily_entries").select("*").gte("date", start).lte("date", end).order("date"),
      supabase.from("sleep").select("*").gte("date", start).lte("date", end).order("date"),
      supabase.from("workouts").select("*").gte("date", start).lte("date", end).order("date").order("start_time", { ascending: true, nullsFirst: false }),
      supabase.from("meals").select("*").gte("date", start).lte("date", end).order("date"),
      supabase.from("fasting").select("*").gte("date", start).lte("date", end).order("date"),
      supabase.from("pullups").select("*").gte("date", start).lte("date", end).order("date"),
    ]);

  const errors = [dailyRes, sleepRes, workoutsRes, mealsRes, fastingRes, pullupsRes]
    .filter((r) => r.error)
    .map((r) => r.error!.message);
  if (errors.length > 0) throw new Error(`Failed to fetch week data: ${errors.join("; ")}`);

  const daily = (dailyRes.data ?? []) as DailyEntryRow[];
  const sleep = (sleepRes.data ?? []) as SleepRow[];
  const workouts = (workoutsRes.data ?? []) as WorkoutRow[];
  const meals = (mealsRes.data ?? []) as MealRow[];
  const fasting = (fastingRes.data ?? []) as FastingRow[];
  const pullups = (pullupsRes.data ?? []) as PullupsRow[];

  // Index by date
  const dailyByDate = new Map(daily.map((d) => [d.date, d]));
  const sleepByDate = new Map(sleep.map((s) => [s.date, s]));
  const fastingByDate = new Map(fasting.map((f) => [f.date, f]));
  const pullupsByDate = new Map(pullups.map((p) => [p.date, p]));

  const workoutsByDate = new Map<string, WorkoutRow[]>();
  for (const w of workouts) {
    const arr = workoutsByDate.get(w.date);
    if (arr) arr.push(w); else workoutsByDate.set(w.date, [w]);
  }

  const mealTotalsByDate = new Map<string, { protein: number; calories: number }>();
  for (const m of meals) {
    let t = mealTotalsByDate.get(m.date);
    if (!t) { t = { protein: 0, calories: 0 }; mealTotalsByDate.set(m.date, t); }
    t.protein += m.protein_g ?? 0;
    t.calories += m.calories ?? 0;
  }

  // Build per-day summaries
  const days: DaySummary[] = [];
  const startD = new Date(start + "T00:00:00");
  for (let i = 0; i < 7; i++) {
    const dateStr = formatDate(addDays(startD, i));
    const d = dailyByDate.get(dateStr);
    const s = sleepByDate.get(dateStr);
    const f = fastingByDate.get(dateStr);
    const p = pullupsByDate.get(dateStr);
    const mt = mealTotalsByDate.get(dateStr);
    days.push({
      date: dateStr,
      weight: d?.weight ?? null,
      energy: d?.energy ?? null,
      alcohol: d?.alcohol ?? null,
      sleepHours: s?.hours ?? null,
      ouraScore: s?.oura_score ?? null,
      appleScore: s?.apple_score ?? null,
      workouts: workoutsByDate.get(dateStr) ?? [],
      totalProtein: mt ? mt.protein : null,
      totalCalories: mt ? mt.calories : null,
      fastingCompliant: f?.compliant ?? null,
      pullups: p?.total_count ?? null,
    });
  }

  // Summary aggregations
  const weightValues: number[] = [];
  let daysWith = 0;
  let daysWithout = 0;
  for (const d of daily) {
    if (d.weight != null) weightValues.push(d.weight);
    if (d.alcohol === true) daysWith++;
    else if (d.alcohol === false) daysWithout++;
  }
  const weightFirst = weightValues.length > 0 ? weightValues[0] : null;
  const weightLast = weightValues.length > 0 ? weightValues[weightValues.length - 1] : null;
  const weightDelta = weightFirst != null && weightLast != null && weightValues.length >= 2 ? weightLast - weightFirst : null;

  const sleepHours: number[] = [];
  const ouraScores: number[] = [];
  const appleScores: number[] = [];
  for (const s of sleep) {
    if (s.hours != null) sleepHours.push(s.hours);
    if (s.oura_score != null) ouraScores.push(s.oura_score);
    if (s.apple_score != null) appleScores.push(s.apple_score);
  }

  const workoutTypes = [...new Set(workouts.map((w) => w.type))];
  const fastingCompliant = fasting.filter((f) => f.compliant === true).length;
  const pullupTotal = pullups.reduce((sum, p) => sum + p.total_count, 0);
  const mealDays = [...mealTotalsByDate.values()];

  const allDates = new Set([
    ...daily.map((d) => d.date), ...sleep.map((s) => s.date),
    ...workouts.map((w) => w.date), ...meals.map((m) => m.date),
    ...fasting.map((f) => f.date), ...pullups.map((p) => p.date),
  ]);

  return {
    start,
    end,
    days,
    summary: {
      daysLogged: allDates.size,
      weight: { first: weightFirst, last: weightLast, delta: weightDelta },
      sleep: { avgHours: avg(sleepHours), avgOura: avg(ouraScores), avgApple: avg(appleScores) },
      workouts: { total: workouts.length, types: workoutTypes },
      meals: {
        avgDailyProtein: mealDays.length > 0 ? avg(mealDays.map((d) => d.protein)) : null,
        avgDailyCalories: mealDays.length > 0 ? avg(mealDays.map((d) => d.calories)) : null,
      },
      fasting: { compliantDays: fastingCompliant, totalDays: fasting.length },
      alcohol: { daysWith, daysWithout },
      pullups: { total: pullupTotal, days: pullups.length },
    },
  };
}

export async function fetchWeekSummaries(
  gridStart: string,
  gridEnd: string,
): Promise<Map<string, WeekSummary>> {
  const [workoutsRes, sleepRes, dailyRes, fastingRes] = await Promise.all([
    supabase.from("workouts").select("*").gte("date", gridStart).lte("date", gridEnd),
    supabase.from("sleep").select("*").gte("date", gridStart).lte("date", gridEnd),
    supabase.from("daily_entries").select("*").gte("date", gridStart).lte("date", gridEnd).order("date"),
    supabase.from("fasting").select("*").gte("date", gridStart).lte("date", gridEnd),
  ]);

  // If any query fails, return empty map (calendar still works)
  if (workoutsRes.error || sleepRes.error || dailyRes.error || fastingRes.error) {
    return new Map();
  }

  const workouts = (workoutsRes.data ?? []) as WorkoutRow[];
  const sleep = (sleepRes.data ?? []) as SleepRow[];
  const daily = (dailyRes.data ?? []) as DailyEntryRow[];
  const fasting = (fastingRes.data ?? []) as FastingRow[];

  // Helper: get Monday for a date string (cached)
  const mondayCache = new Map<string, string>();
  function mondayOf(dateStr: string): string {
    let mon = mondayCache.get(dateStr);
    if (!mon) {
      mon = formatDate(getMonday(new Date(dateStr + "T00:00:00")));
      mondayCache.set(dateStr, mon);
    }
    return mon;
  }

  const summaries = new Map<string, WeekSummary>();

  function ensure(monday: string): WeekSummary {
    let s = summaries.get(monday);
    if (!s) {
      s = { workoutCount: 0, avgSleepHours: null, weightDelta: null, fastingCompliant: 0, fastingTotal: 0 };
      summaries.set(monday, s);
    }
    return s;
  }

  // Workouts
  for (const w of workouts) {
    ensure(mondayOf(w.date)).workoutCount++;
  }

  // Sleep — group hours by week for averaging
  const sleepByWeek = new Map<string, number[]>();
  for (const s of sleep) {
    const mon = mondayOf(s.date);
    if (s.hours != null) {
      const arr = sleepByWeek.get(mon);
      if (arr) arr.push(s.hours);
      else sleepByWeek.set(mon, [s.hours]);
    }
    ensure(mon); // ensure week exists
  }
  for (const [mon, hours] of sleepByWeek) {
    ensure(mon).avgSleepHours = avg(hours);
  }

  // Weight — first and last per week
  const weightByWeek = new Map<string, number[]>();
  for (const d of daily) {
    if (d.weight != null) {
      const mon = mondayOf(d.date);
      const arr = weightByWeek.get(mon);
      if (arr) arr.push(d.weight);
      else weightByWeek.set(mon, [d.weight]);
    }
  }
  for (const [mon, weights] of weightByWeek) {
    if (weights.length >= 2) {
      ensure(mon).weightDelta = weights[weights.length - 1] - weights[0];
    }
  }

  // Fasting
  for (const f of fasting) {
    const mon = mondayOf(f.date);
    const s = ensure(mon);
    s.fastingTotal++;
    if (f.compliant === true) s.fastingCompliant++;
  }

  return summaries;
}

