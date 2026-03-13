import { Command } from "commander";
import { fail, success } from "../output.js";
import { getSupabase, throwIfError } from "../db.js";
import { todayDate } from "../lib/date.js";
import { ensureDailyEntry } from "../lib/ensure-daily-entry.js";
import { validateWorkoutType } from "../lib/workout-types.js";

// ─── Types ──────────────────────────────────────────

export interface PlannedWorkout {
  type: string;
  duration_min?: number;
  notes?: string;
}

export interface WeeklyPlanSchedule {
  [key: string]: PlannedWorkout[];
}

export interface WeeklyPlanTargets {
  total_sessions?: number;
  total_duration_min?: number;
  by_type?: Record<string, { sessions?: number; duration_min?: number }>;
}

export interface WeeklyPlan {
  id: string;
  name: string;
  active: boolean;
  schedule: WeeklyPlanSchedule;
  targets: WeeklyPlanTargets | null;
  created_at: string;
  updated_at: string;
}

export type WorkoutStatus = "scheduled" | "skipped" | "completed" | "unplanned";

const DAYS_OF_WEEK = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

// ─── Core functions (used by CLI + MCP) ─────────────

export async function setPlan(
  schedule: WeeklyPlanSchedule,
  opts: { name?: string; targets?: WeeklyPlanTargets } = {},
): Promise<WeeklyPlan> {
  const sb = getSupabase();

  // Validate schedule keys are valid days of the week
  const validDays = new Set<string>(DAYS_OF_WEEK);
  const invalidKeys = Object.keys(schedule).filter((k) => !validDays.has(k));
  if (invalidKeys.length > 0) {
    throw new Error(`Invalid schedule keys: ${invalidKeys.join(", ")}. Must be: ${DAYS_OF_WEEK.join(", ")}`);
  }

  // Validate all unique workout types in schedule
  const uniqueTypes = new Set(DAYS_OF_WEEK.flatMap((day) => (schedule[day] ?? []).map((w) => w.type)));
  for (const type of uniqueTypes) {
    await validateWorkoutType(type);
  }

  // Deactivate existing active plans
  const { error: deactivateErr } = await sb.from("weekly_plan").update({ active: false } as any).eq("active", true);
  if (deactivateErr) throw new Error(`Database error: ${deactivateErr.message}`);

  // Insert new plan
  const { data, error } = await sb
    .from("weekly_plan")
    .insert({
      name: opts.name ?? "default",
      active: true,
      schedule: schedule as any,
      targets: (opts.targets ?? null) as any,
    } as any)
    .select()
    .single();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data as unknown as WeeklyPlan;
}

export async function getPlan(): Promise<WeeklyPlan | null> {
  const sb = getSupabase();
  const { data, error } = await sb
    .from("weekly_plan")
    .select("*")
    .eq("active", true)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw new Error(`Database error: ${error.message}`);
  return data as unknown as WeeklyPlan | null;
}

export function getMondayOfWeek(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr + "T00:00:00") : new Date();
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function validateMonday(dateStr: string): void {
  const d = new Date(dateStr + "T00:00:00");
  if (d.getDay() !== 1) throw new Error(`week_start must be a Monday, got ${dateStr} (${["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][d.getDay()]})`);
}

export async function instantiatePlan(weekStart?: string): Promise<{ created: number; skipped: number; week_start: string }> {
  const plan = await getPlan();
  if (!plan) throw new Error("No active weekly plan found. Set one with set_plan first.");

  const monday = weekStart ?? getMondayOfWeek();
  if (weekStart) validateMonday(weekStart);
  const sb = getSupabase();

  // Get existing planned workouts for the week
  const weekEnd = addDaysStr(monday, 6);
  const { data: existing, error: fetchErr } = await sb
    .from("workouts")
    .select("date, type, planned, completed")
    .gte("date", monday)
    .lte("date", weekEnd)
    .eq("planned", true);

  if (fetchErr) throw new Error(`Database error: ${fetchErr.message}`);

  // Count all existing planned workouts per date:type (including completed) for idempotency
  const existingCounts = new Map<string, number>();
  for (const w of (existing ?? []) as any[]) {
    const key = `${w.date}:${w.type}`;
    existingCounts.set(key, (existingCounts.get(key) ?? 0) + 1);
  }

  let created = 0;
  let skipped = 0;
  const ensuredDates = new Set<string>();

  for (let i = 0; i < 7; i++) {
    const dateStr = addDaysStr(monday, i);
    const dayName = DAYS_OF_WEEK[i];
    const planned = plan.schedule[dayName] ?? [];

    // Count how many of each type are planned for this day
    const neededCounts = new Map<string, number>();
    for (const pw of planned) {
      neededCounts.set(pw.type, (neededCounts.get(pw.type) ?? 0) + 1);
    }

    for (const pw of planned) {
      const key = `${dateStr}:${pw.type}`;
      const existingCount = existingCounts.get(key) ?? 0;
      const neededCount = neededCounts.get(pw.type) ?? 0;

      if (existingCount >= neededCount) {
        skipped++;
        continue;
      }

      // Ensure daily entry once per date (FK constraint requires it)
      if (!ensuredDates.has(dateStr)) {
        await ensureDailyEntry(dateStr);
        ensuredDates.add(dateStr);
      }
      const { error: insertErr } = await sb
        .from("workouts")
        .insert({
          date: dateStr,
          type: pw.type,
          duration_min: pw.duration_min ?? null,
          notes: pw.notes ?? null,
          planned: true,
          completed: false,
          source: "plan",
        } as any);

      if (insertErr) throw new Error(`Database error: ${insertErr.message}`);
      existingCounts.set(key, existingCount + 1);
      created++;
    }
  }

  return { created, skipped, week_start: monday };
}

export async function queryPlanStatus(weekStart?: string, existingPlan?: WeeklyPlan | null) {
  const plan = existingPlan !== undefined ? existingPlan : await getPlan();
  const monday = weekStart ?? getMondayOfWeek();
  if (weekStart) validateMonday(weekStart);
  const weekEnd = addDaysStr(monday, 6);
  const today = todayDate();
  const sb = getSupabase();

  // Fetch all workouts for the week
  const { data: workouts, error } = await sb
    .from("workouts")
    .select("*")
    .gte("date", monday)
    .lte("date", weekEnd)
    .order("date")
    .order("start_time", { ascending: true, nullsFirst: false })
    .order("created_at");

  if (error) throw new Error(`Database error: ${error.message}`);
  const allWorkouts = (workouts ?? []) as any[];

  const days = [];
  for (let i = 0; i < 7; i++) {
    const dateStr = addDaysStr(monday, i);
    const dayName = DAYS_OF_WEEK[i];
    const dayWorkouts = allWorkouts.filter((w) => w.date === dateStr);

    // Split: all planned rows (including completed-in-place) vs non-planned actuals
    const allPlannedRows = dayWorkouts.filter((w) => w.planned === true);
    const nonPlannedActual = dayWorkouts.filter((w) => w.planned !== true);

    // Match planned to actuals one-to-one by type (supports duplicate types)
    // A planned row completed in-place (completed=true) counts as its own match
    const matchedActualIds = new Set<string>();
    const planned = allPlannedRows.map((pw) => {
      // Completed in-place — the planned row itself was marked completed
      if (pw.completed === true) {
        return { type: pw.type, duration_min: pw.duration_min, notes: pw.notes, status: "completed" as WorkoutStatus };
      }
      // Still pending — look for a matching non-planned actual
      const match = nonPlannedActual.find((a) => a.type === pw.type && !matchedActualIds.has(a.id));
      if (match) matchedActualIds.add(match.id);
      const isSkipped = !match && dateStr < today;
      const status: WorkoutStatus = match ? "completed" : isSkipped ? "skipped" : "scheduled";
      return { type: pw.type, duration_min: pw.duration_min, notes: pw.notes, status };
    });

    const unplanned = nonPlannedActual.filter((a) => !matchedActualIds.has(a.id)).map((a) => ({
      type: a.type,
      duration_min: a.duration_min,
      id: a.id,
    }));

    const matchedActual = nonPlannedActual.filter((a) => matchedActualIds.has(a.id)).map((a) => ({
      type: a.type,
      duration_min: a.duration_min,
      id: a.id,
    }));

    days.push({
      date: dateStr,
      day: dayName,
      planned,
      actual: matchedActual,
      unplanned,
    });
  }

  // Compute targets
  let targets = null;
  if (plan?.targets) {
    const completedWorkouts = allWorkouts.filter((w) => !(w.planned === true && w.completed === false));
    const totalActual = completedWorkouts.length;
    const totalDuration = completedWorkouts.reduce((s, w) => s + (w.duration_min ?? 0), 0);

    targets = {
      total_sessions: plan.targets.total_sessions != null
        ? { target: plan.targets.total_sessions, actual: totalActual, remaining: Math.max(0, plan.targets.total_sessions - totalActual) }
        : undefined,
      total_duration_min: plan.targets.total_duration_min != null
        ? { target: plan.targets.total_duration_min, actual: totalDuration, remaining: Math.max(0, plan.targets.total_duration_min - totalDuration) }
        : undefined,
      by_type: plan.targets.by_type
        ? Object.fromEntries(
            Object.entries(plan.targets.by_type).map(([type, t]) => {
              const typeWorkouts = completedWorkouts.filter((w) => w.type === type);
              return [type, {
                sessions: t.sessions != null
                  ? { target: t.sessions, actual: typeWorkouts.length }
                  : undefined,
                duration_min: t.duration_min != null
                  ? { target: t.duration_min, actual: typeWorkouts.reduce((s: number, w: any) => s + (w.duration_min ?? 0), 0) }
                  : undefined,
              }];
            }),
          )
        : undefined,
    };
  }

  // Summary
  const allPlanned = days.flatMap((d) => d.planned);
  const summary = {
    planned: allPlanned.length,
    completed: allPlanned.filter((p) => p.status === "completed").length,
    skipped: allPlanned.filter((p) => p.status === "skipped").length,
    remaining: allPlanned.filter((p) => p.status === "scheduled").length,
  };

  return {
    week_start: monday,
    template: plan?.schedule ?? null,
    days,
    targets,
    summary,
  };
}

// ─── CLI registration ────────────────────────────────

export function registerPlanCommands(program: Command): void {
  const plan = program
    .command("plan")
    .description("Manage weekly training plan");

  plan
    .command("show")
    .description("Show active plan template")
    .action(async () => {
      try {
        const p = await getPlan();
        if (!p) return success({ message: "No active plan" });
        success(p);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  plan
    .command("set")
    .description("Set weekly plan")
    .requiredOption("--schedule <json>", "Schedule JSON")
    .option("--name <name>", "Plan name")
    .option("--targets <json>", "Targets JSON")
    .action(async (opts) => {
      try {
        const schedule = JSON.parse(opts.schedule);
        const targets = opts.targets ? JSON.parse(opts.targets) : undefined;
        success(await setPlan(schedule, { name: opts.name, targets }));
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  plan
    .command("instantiate")
    .description("Create planned workout rows for a week")
    .option("--week <date>", "Week start (Monday, YYYY-MM-DD)")
    .action(async (opts) => {
      try {
        success(await instantiatePlan(opts.week));
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  plan
    .command("status")
    .description("Show plan-vs-actual for a week")
    .option("--week <date>", "Week start (Monday, YYYY-MM-DD)")
    .action(async (opts) => {
      try {
        success(await queryPlanStatus(opts.week));
      } catch (e: any) { fail(e.message ?? String(e)); }
    });
}
