import { Command } from "commander";
import { fail, success } from "../output.js";
import { getSupabase } from "../db.js";
import { todayDate, daysAgo } from "../lib/date.js";
import { parseNum } from "../lib/parse.js";
import type { Database } from "../types/database.js";

type TableName = keyof Database["public"]["Tables"];

function throwIfError({ error }: { error: any }) {
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
}

// --- fetchDay ---

async function fetchDay(date: string) {
  const sb = getSupabase();
  const results = await Promise.all([
    sb.from("daily_entries").select().eq("date", date).maybeSingle(),
    sb.from("sleep").select().eq("date", date).maybeSingle(),
    sb.from("fasting").select().eq("date", date).maybeSingle(),
    sb.from("blood_pressure").select().eq("date", date),
    sb.from("workouts").select().eq("date", date),
    sb.from("meals").select().eq("date", date),
    sb.from("pullups").select().eq("date", date).maybeSingle(),
    sb.from("supplements").select().eq("date", date).maybeSingle(),
    sb.from("body_composition").select().eq("date", date).maybeSingle(),
  ]);
  results.forEach(throwIfError);
  const [daily, sleep, fasting, bp, workouts, meals, pullups, supplements, bodycomp] = results;

  return {
    date,
    daily: daily.data ?? null,
    sleep: sleep.data ?? null,
    fasting: fasting.data ?? null,
    blood_pressure: bp.data ?? [],
    workouts: workouts.data ?? [],
    meals: meals.data ?? [],
    pullups: pullups.data ?? null,
    supplements: supplements.data ?? null,
    body_composition: bodycomp.data ?? null,
  };
}

// --- fetchWeek ---

function avg(nums: number[]): number | null {
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

async function fetchWeek() {
  const start = daysAgo(6);
  const end = todayDate();
  const sb = getSupabase();

  const results = await Promise.all([
    sb.from("daily_entries").select().gte("date", start).lte("date", end).order("date"),
    sb.from("sleep").select().gte("date", start).lte("date", end).order("date"),
    sb.from("workouts").select().gte("date", start).lte("date", end).order("date"),
    sb.from("meals").select().gte("date", start).lte("date", end).order("date"),
    sb.from("fasting").select().gte("date", start).lte("date", end).order("date"),
    sb.from("pullups").select().gte("date", start).lte("date", end).order("date"),
  ]);
  results.forEach(throwIfError);
  const [daily, sleep, workouts, meals, fasting, pullups] = results;

  const dailyRows = daily.data ?? [];
  const sleepRows = sleep.data ?? [];
  const workoutRows = workouts.data ?? [];
  const mealRows = meals.data ?? [];
  const fastingRows = fasting.data ?? [];
  const pullupRows = pullups.data ?? [];

  // Weight delta
  const weights = dailyRows
    .map((r: any) => ({ date: r.date, weight: r.weight }))
    .filter((r: any) => r.weight != null);
  const weightDelta =
    weights.length >= 2
      ? weights[weights.length - 1].weight - weights[0].weight
      : null;

  // Sleep averages
  const sleepHours = sleepRows.map((r: any) => r.hours).filter((v: any) => v != null);
  const ouraScores = sleepRows.map((r: any) => r.oura_score).filter((v: any) => v != null);
  const appleScores = sleepRows.map((r: any) => r.apple_score).filter((v: any) => v != null);

  // Workouts
  const completedCount = workoutRows.filter((r: any) => r.completed === true).length;
  const plannedCount = workoutRows.filter((r: any) => r.planned === true).length;
  const workoutTypes = [...new Set(workoutRows.map((r: any) => r.type))];

  // Meals: avg daily protein and calories (only days with meals)
  const mealsByDate: Record<string, { protein: number; calories: number }> = {};
  for (const m of mealRows as any[]) {
    if (!mealsByDate[m.date]) mealsByDate[m.date] = { protein: 0, calories: 0 };
    if (m.protein_g != null) mealsByDate[m.date].protein += m.protein_g;
    if (m.calories != null) mealsByDate[m.date].calories += m.calories;
  }
  const mealDays = Object.values(mealsByDate);
  const avgDailyProtein = mealDays.length > 0 ? avg(mealDays.map((d) => d.protein)) : null;
  const avgDailyCalories = mealDays.length > 0 ? avg(mealDays.map((d) => d.calories)) : null;

  // Fasting compliance
  const fastingCompliant = fastingRows.filter((r: any) => r.compliant === true).length;

  // Alcohol
  const alcoholTrue = dailyRows.filter((r: any) => r.alcohol === true).length;
  const alcoholFalse = dailyRows.filter((r: any) => r.alcohol === false).length;

  // Pullups
  const pullupTotal = pullupRows.reduce((s: number, r: any) => s + (r.total_count ?? 0), 0);

  return {
    start,
    end,
    days_logged: dailyRows.length,
    weight: {
      first: weights.length > 0 ? weights[0].weight : null,
      last: weights.length > 0 ? weights[weights.length - 1].weight : null,
      delta: weightDelta,
    },
    sleep: {
      avg_hours: avg(sleepHours),
      avg_oura_score: avg(ouraScores),
      avg_apple_score: avg(appleScores),
    },
    workouts: {
      total: workoutRows.length,
      completed_count: completedCount,
      planned_count: plannedCount,
      types: workoutTypes,
    },
    meals: {
      avg_daily_protein_g: avgDailyProtein,
      avg_daily_calories: avgDailyCalories,
    },
    fasting: {
      compliant_days: fastingCompliant,
      total_days: fastingRows.length,
    },
    alcohol: {
      days_with: alcoholTrue,
      days_without: alcoholFalse,
    },
    pullups: {
      total: pullupTotal,
      days: pullupRows.length,
    },
  };
}

// --- computeTrend ---

const VALID_METRICS = [
  "weight", "energy", "sleep", "hrv", "hr-sleep", "readiness",
  "bp", "pullups", "calories", "protein", "body-fat",
] as const;

type MetricName = (typeof VALID_METRICS)[number];

interface TrendConfig {
  table: TableName;
  columns: string[];
  type: "single" | "multi" | "multi-daily-avg" | "daily-sum";
}

const METRIC_MAP: Record<MetricName, TrendConfig> = {
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

function singleSummary(values: number[]) {
  if (values.length === 0) return { min: null, max: null, avg: null, delta: null, count: 0 };
  return {
    min: Math.min(...values),
    max: Math.max(...values),
    avg: avg(values),
    delta: values.length >= 2 ? values[values.length - 1] - values[0] : null,
    count: values.length,
  };
}

function multiSummaries(columns: string[], points: any[]) {
  const summaries: Record<string, any> = {};
  for (const col of columns) {
    const vals = points.map((p: any) => p[col]).filter((v: any) => v != null);
    summaries[col] = singleSummary(vals);
  }
  return summaries;
}

async function computeTrend(metric: string, days: number) {
  if (!VALID_METRICS.includes(metric as MetricName)) {
    throw new Error(`Unknown metric "${metric}". Valid metrics: ${VALID_METRICS.join(", ")}`);
  }
  if (!Number.isInteger(days) || days <= 0) {
    throw new Error(`--days must be a positive integer, got "${days}"`);
  }

  const cfg = METRIC_MAP[metric as MetricName];
  const start = daysAgo(days - 1);
  const end = todayDate();
  const sb = getSupabase();
  const selectCols = ["date", ...cfg.columns].join(", ");

  const { data: rows, error } = await sb
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
      .map((r: any) => ({ date: r.date, value: r[col] }));
    return {
      metric, days, start, end, points,
      summary: singleSummary(points.map((p: any) => p.value)),
    };
  }

  if (cfg.type === "multi-daily-avg") {
    // Average multiple readings per day, then trend over daily averages
    const byDate: Record<string, Record<string, number[]>> = {};
    for (const r of data as any[]) {
      if (!byDate[r.date]) {
        byDate[r.date] = Object.fromEntries(cfg.columns.map(c => [c, []]));
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
    return { metric, days, start, end, points, summaries: multiSummaries(cfg.columns, points) };
  }

  if (cfg.type === "multi") {
    const points = data.map((r: any) => {
      const point: any = { date: r.date };
      for (const col of cfg.columns) point[col] = r[col] ?? null;
      return point;
    });
    return { metric, days, start, end, points, summaries: multiSummaries(cfg.columns, points) };
  }

  // daily-sum
  const col = cfg.columns[0];
  const byDate: Record<string, number> = {};
  for (const r of data as any[]) {
    if (r[col] != null) {
      byDate[r.date] = (byDate[r.date] ?? 0) + r[col];
    }
  }
  const points = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
  return {
    metric, days, start, end, points,
    summary: singleSummary(points.map((p) => p.value)),
  };
}

// --- computeStreak ---

const VALID_STREAKS = ["alcohol-free", "fasting", "workout", "logging"] as const;
type StreakName = (typeof VALID_STREAKS)[number];

interface StreakConfig {
  table: TableName;
  select: string;
  pass: (row: any) => boolean;
}

const STREAK_MAP: Record<StreakName, StreakConfig> = {
  "alcohol-free": { table: "daily_entries", select: "date, alcohol", pass: (r) => r.alcohol === false },
  fasting: { table: "fasting", select: "date, compliant", pass: (r) => r.compliant === true },
  workout: { table: "workouts", select: "date", pass: () => true },
  logging: { table: "daily_entries", select: "date", pass: () => true },
};

async function computeStreak(metric: string) {
  if (!VALID_STREAKS.includes(metric as StreakName)) {
    throw new Error(`Unknown streak "${metric}". Valid streaks: ${VALID_STREAKS.join(", ")}`);
  }

  const cfg = STREAK_MAP[metric as StreakName];
  const today = todayDate();
  const sb = getSupabase();

  // Use date range instead of row limit to handle multi-row tables (e.g. workouts)
  const rangeStart = daysAgo(365);
  const { data, error } = await sb
    .from(cfg.table)
    .select(cfg.select)
    .gte("date", rangeStart)
    .lte("date", today)
    .order("date", { ascending: false });
  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  const rows = data ?? [];

  const rowsByDate = new Map<string, any>();
  for (const r of rows as any[]) {
    if (!rowsByDate.has(r.date)) rowsByDate.set(r.date, r);
  }

  const earliest = rangeStart;
  let count = 0;
  for (let i = 0; ; i++) {
    const d = daysAgo(i);
    if (d < earliest) break;
    const row = rowsByDate.get(d);
    if (row && cfg.pass(row)) { count++; }
    else break;
  }

  const startDate = count > 0 ? daysAgo(count - 1) : null;
  return { metric, current_streak: count, start_date: startDate, as_of: today };
}

// --- register commands ---

export function registerQueryCommands(program: Command): void {
  program
    .command("today")
    .description("Today's full summary")
    .option("--date <date>", "Date (YYYY-MM-DD)", todayDate())
    .action(async (opts) => {
      try {
        success(await fetchDay(opts.date));
      } catch (e: any) {
        fail(e.message ?? String(e));
      }
    });

  program
    .command("week")
    .description("Weekly summary")
    .action(async () => {
      try {
        success(await fetchWeek());
      } catch (e: any) {
        fail(e.message ?? String(e));
      }
    });

  program
    .command("trend")
    .description("Trend data for a metric")
    .argument("<metric>", `Metric to trend (${VALID_METRICS.join(", ")})`)
    .option("--days <n>", "Number of days", "30")
    .action(async (metric, opts) => {
      try {
        const days = parseNum("days", opts.days)!;
        success(await computeTrend(metric, days));
      } catch (e: any) {
        fail(e.message ?? String(e));
      }
    });

  program
    .command("streak")
    .description("Current streak for a metric")
    .argument("<metric>", `Metric (${VALID_STREAKS.join(", ")})`)
    .action(async (metric) => {
      try {
        success(await computeStreak(metric));
      } catch (e: any) {
        fail(e.message ?? String(e));
      }
    });

  program
    .command("status")
    .description("Overall dashboard summary")
    .action(async () => {
      try {
        const today = todayDate();
        const [day, week, alcoholStreak, fastingStreak, workoutStreak, loggingStreak, weightTrend] =
          await Promise.all([
            fetchDay(today),
            fetchWeek(),
            computeStreak("alcohol-free"),
            computeStreak("fasting"),
            computeStreak("workout"),
            computeStreak("logging"),
            computeTrend("weight", 7),
          ]);

        success({
          today: day,
          week,
          streaks: {
            alcohol_free: alcoholStreak,
            fasting: fastingStreak,
            workout: workoutStreak,
            logging: loggingStreak,
          },
          weight_trend_7d: weightTrend,
        });
      } catch (e: any) {
        fail(e.message ?? String(e));
      }
    });
}
