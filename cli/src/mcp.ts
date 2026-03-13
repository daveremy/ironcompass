#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetchDay, fetchWeek, computeTrend, computeStreak, fetchPersonalRecords, VALID_METRICS, VALID_STREAKS } from "./commands/query.js";
import { logDaily, logSleep, logFasting, logBp, logWorkout, logMeal, logPullups, logSupplements, logBodycomp, logMetric } from "./commands/log.js";
import { getWorkoutTypes } from "./lib/workout-types.js";
import { deleteRowById } from "./db.js";
import { todayDate } from "./lib/date.js";
import { dayUrl, calendarUrl } from "./lib/urls.js";
import { setPlan, getPlan, instantiatePlan, queryPlanStatus } from "./commands/plan.js";

const server = new McpServer({ name: "ironcompass", version: "0.1.0" });

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
}

function logResult(date: string, data: unknown) {
  return textResult({ ...data as Record<string, unknown>, dashboard_url: dayUrl(date) });
}

const optDate = z.string().optional().describe("YYYY-MM-DD, defaults to today");

// --- Query tools ---

server.registerTool("ironcompass_query_today", {
  title: "Today's Summary",
  description: "Get full health summary for a date (daily, sleep, fasting, workouts, meals, pullups, supplements, body composition)",
  inputSchema: z.object({ date: optDate }),
}, async ({ date }) => {
  return textResult(await fetchDay(date ?? todayDate()));
});

server.registerTool("ironcompass_query_week", {
  title: "Weekly Summary",
  description: "Get weekly health summary (last 7 days)",
  inputSchema: z.object({}),
}, async () => {
  return textResult(await fetchWeek());
});

server.registerTool("ironcompass_query_trend", {
  title: "Metric Trend",
  description: "Get trend data for a health metric over time",
  inputSchema: z.object({
    metric: z.string().describe(`Metric to trend. Built-in: ${VALID_METRICS.join(", ")}. Also accepts any custom metric name.`),
    days: z.number().optional().describe("Number of days (default 30)"),
  }),
}, async ({ metric, days }) => {
  const result = await computeTrend(metric, days ?? 30);
  return textResult({ ...result, dashboard_url: calendarUrl() });
});

server.registerTool("ironcompass_query_streak", {
  title: "Current Streak",
  description: "Get current streak for a health metric",
  inputSchema: z.object({
    metric: z.enum(VALID_STREAKS).describe("Streak metric"),
    as_of_date: z.string().optional().describe("Compute streak as of this date (YYYY-MM-DD). Defaults to today."),
  }),
}, async ({ metric, as_of_date }) => {
  const result = await computeStreak(metric, as_of_date);
  return textResult({ ...result, dashboard_url: calendarUrl() });
});

server.registerTool("ironcompass_query_records", {
  title: "Personal Records",
  description: "Get all-time personal records across all metrics",
  inputSchema: z.object({}),
}, async () => {
  return textResult(await fetchPersonalRecords());
});

// --- Log tools ---

server.registerTool("ironcompass_log_daily", {
  title: "Log Daily Metrics",
  description: "Log daily health metrics (weight, energy, alcohol, notes)",
  inputSchema: z.object({
    date: optDate,
    weight: z.number().optional().describe("Weight in lbs"),
    energy: z.number().optional().describe("Energy level 1-5"),
    alcohol: z.boolean().optional().describe("Alcohol consumed"),
    notes: z.string().optional(),
  }),
}, async ({ date, ...fields }) => {
  const d = date ?? todayDate();
  return logResult(d, await logDaily(d, fields));
});

server.registerTool("ironcompass_log_sleep", {
  title: "Log Sleep Data",
  description: "Log sleep data (scores, hours, CPAP, mouth tape, HRV)",
  inputSchema: z.object({
    date: optDate,
    apple_score: z.number().optional().describe("Apple Watch sleep score"),
    oura_score: z.number().optional().describe("Oura Ring sleep score"),
    hours: z.number().optional().describe("Hours slept"),
    cpap: z.boolean().optional().describe("CPAP used"),
    mouth_tape: z.boolean().optional().describe("Mouth tape used"),
    oura_readiness: z.number().optional().describe("Oura readiness score"),
    avg_hr_sleep: z.number().optional().describe("Average heart rate during sleep"),
    avg_hrv: z.number().optional().describe("Average HRV"),
    notes: z.string().optional(),
  }),
}, async ({ date, ...fields }) => {
  const d = date ?? todayDate();
  return logResult(d, await logSleep(d, fields));
});

server.registerTool("ironcompass_log_fasting", {
  title: "Log Fasting Window",
  description: "Log fasting window and compliance",
  inputSchema: z.object({
    date: optDate,
    protocol: z.string().optional().describe("Protocol (16:8, 18:6, OMAD)"),
    window_start: z.string().optional().describe("Eating window start (HH:MM)"),
    window_end: z.string().optional().describe("Eating window end (HH:MM)"),
    compliant: z.boolean().optional().describe("Stuck to protocol"),
  }),
}, async ({ date, ...fields }) => {
  const d = date ?? todayDate();
  return logResult(d, await logFasting(d, fields));
});

server.registerTool("ironcompass_log_bp", {
  title: "Log Blood Pressure",
  description: "Log a blood pressure reading",
  inputSchema: z.object({
    date: optDate,
    systolic: z.number().describe("Systolic pressure (mmHg)"),
    diastolic: z.number().describe("Diastolic pressure (mmHg)"),
    time: z.string().optional().describe("Time of reading (HH:MM)"),
  }),
}, async ({ date, systolic, diastolic, time }) => {
  const d = date ?? todayDate();
  return logResult(d, await logBp(d, systolic, diastolic, { time }));
});

server.registerTool("ironcompass_log_workout", {
  title: "Log Workout",
  description: "Log a workout session",
  inputSchema: z.object({
    date: optDate,
    type: z.string().describe("Workout type (e.g. strength, hike, run, pickleball, golf, elliptical, mobility, sauna, indoor_cycle)"),
    duration_min: z.number().optional().describe("Duration in minutes"),
    distance_mi: z.number().optional().describe("Distance in miles"),
    elevation_ft: z.number().optional().describe("Elevation gain in feet"),
    calories: z.number().optional().describe("Calories burned"),
    avg_hr: z.number().optional().describe("Average heart rate"),
    notes: z.string().optional(),
    details: z.record(z.string(), z.unknown()).optional().describe("Type-specific details (e.g. exercises, scores, power zones)"),
    start_time: z.string().optional().describe("Workout start time — HH:MM (auto-adds local offset) or ISO 8601 with timezone (e.g. 2026-03-10T07:59:00-07:00)"),
    end_time: z.string().optional().describe("Workout end time — HH:MM (auto-adds local offset) or ISO 8601 with timezone (e.g. 2026-03-10T09:00:00-07:00)"),
    source: z.string().optional().describe("Data source (e.g. manual, apple_health, hevy, strava). Defaults to manual"),
    planned: z.boolean().optional().describe("Was planned"),
    completed: z.boolean().optional().describe("Was completed"),
  }),
}, async ({ date, type, ...fields }) => {
  const d = date ?? todayDate();
  return logResult(d, await logWorkout(d, type, fields));
});

server.registerTool("ironcompass_log_meal", {
  title: "Log Meal",
  description: "Log a meal with macros",
  inputSchema: z.object({
    date: optDate,
    name: z.string().describe("Meal name"),
    time: z.string().optional().describe("Meal time (HH:MM)"),
    description: z.string().optional().describe("Description"),
    protein_g: z.number().optional().describe("Protein grams"),
    fat_g: z.number().optional().describe("Fat grams"),
    carbs_g: z.number().optional().describe("Carbs grams"),
    calories: z.number().optional().describe("Calories"),
    notes: z.string().optional(),
  }),
}, async ({ date, name, ...fields }) => {
  const d = date ?? todayDate();
  return logResult(d, await logMeal(d, name, fields));
});

server.registerTool("ironcompass_log_pullups", {
  title: "Log Pullups",
  description: "Log pullup count and sets",
  inputSchema: z.object({
    date: optDate,
    total_count: z.number().describe("Total reps"),
    sets: z.array(z.number()).optional().describe("Reps per set"),
  }),
}, async ({ date, total_count, sets }) => {
  const d = date ?? todayDate();
  return logResult(d, await logPullups(d, total_count, { sets }));
});

server.registerTool("ironcompass_log_supplements", {
  title: "Log Supplements",
  description: "Log supplements taken",
  inputSchema: z.object({
    date: optDate,
    supplements: z.array(z.string()).nonempty().describe("Supplements taken"),
  }),
}, async ({ date, supplements }) => {
  const d = date ?? todayDate();
  return logResult(d, await logSupplements(d, supplements));
});

server.registerTool("ironcompass_log_bodycomp", {
  title: "Log Body Composition",
  description: "Log body composition data (Hume Body Pod)",
  inputSchema: z.object({
    date: optDate,
    body_fat_pct: z.number().optional().describe("Body fat percentage"),
    muscle_mass_lbs: z.number().optional().describe("Muscle mass in pounds"),
    bone_mass_lbs: z.number().optional().describe("Bone mass in pounds"),
    body_water_pct: z.number().optional().describe("Body water percentage"),
    visceral_fat: z.number().optional().describe("Visceral fat score"),
    bmr: z.number().optional().describe("Basal metabolic rate"),
    notes: z.string().optional(),
  }),
}, async ({ date, ...fields }) => {
  const d = date ?? todayDate();
  return logResult(d, await logBodycomp(d, fields));
});

server.registerTool("ironcompass_log_metric", {
  title: "Log Custom Metric",
  description: "Log a custom numeric metric (e.g. coffee cups, water intake, mood score)",
  inputSchema: z.object({
    date: optDate,
    name: z.string().describe("Metric name (e.g. coffee, water, mood)"),
    value: z.number().describe("Numeric value"),
    unit: z.string().optional().describe("Unit (e.g. cups, ml, score)"),
    notes: z.string().optional(),
  }),
}, async ({ date, name, value, unit, notes }) => {
  const d = date ?? todayDate();
  return logResult(d, await logMetric(d, name, value, { unit, notes }));
});

// --- List tools ---

server.registerTool("ironcompass_list_workout_types", {
  title: "List Workout Types",
  description: "List all valid workout types with display names and colors",
  inputSchema: z.object({}),
}, async () => {
  return textResult(await getWorkoutTypes());
});

// --- Delete tools ---

server.registerTool("ironcompass_delete_metric", {
  title: "Delete Custom Metric",
  description: "Delete a custom metric entry by its ID",
  inputSchema: z.object({
    id: z.string().uuid().describe("Custom metric UUID to delete"),
  }),
}, async ({ id }) => {
  const deleted = await deleteRowById("custom_metrics", id);
  return textResult({ deleted, dashboard_url: dayUrl(deleted.date) });
});

server.registerTool("ironcompass_delete_meal", {
  title: "Delete Meal",
  description: "Delete a meal by its ID",
  inputSchema: z.object({
    id: z.string().uuid().describe("Meal UUID to delete"),
  }),
}, async ({ id }) => {
  const deleted = await deleteRowById("meals", id);
  return textResult({ deleted, dashboard_url: dayUrl(deleted.date) });
});

server.registerTool("ironcompass_delete_workout", {
  title: "Delete Workout",
  description: "Delete a workout by its ID",
  inputSchema: z.object({
    id: z.string().uuid().describe("Workout UUID to delete"),
  }),
}, async ({ id }) => {
  const deleted = await deleteRowById("workouts", id);
  return textResult({ deleted, dashboard_url: dayUrl(deleted.date) });
});

// --- Plan tools ---

server.registerTool("ironcompass_set_plan", {
  title: "Set Weekly Plan",
  description: "Set or replace the active weekly training plan template with schedule and optional targets",
  inputSchema: z.object({
    name: z.string().optional().describe("Plan name (default: 'default')"),
    schedule: z.record(z.string(), z.array(z.object({
      type: z.string(),
      duration_min: z.number().optional(),
      notes: z.string().optional(),
    }))).describe("Schedule: keys are days of week (monday-sunday), values are arrays of planned workouts"),
    targets: z.object({
      total_sessions: z.number().optional().describe("Target total workout sessions per week"),
      total_duration_min: z.number().optional().describe("Target total workout minutes per week"),
      by_type: z.record(z.string(), z.object({
        sessions: z.number().optional(),
        duration_min: z.number().optional(),
      })).optional().describe("Per-type targets"),
    }).optional().describe("Weekly targets"),
  }),
}, async ({ name, schedule, targets }) => {
  return textResult(await setPlan(schedule as any, { name, targets: targets as any }));
});

server.registerTool("ironcompass_get_plan", {
  title: "Get Weekly Plan",
  description: "Get the active weekly training plan template",
  inputSchema: z.object({}),
}, async () => {
  const plan = await getPlan();
  return textResult(plan ?? { message: "No active plan" });
});

server.registerTool("ironcompass_instantiate_plan", {
  title: "Instantiate Plan",
  description: "Create planned workout rows for a specific week from the active plan template. Idempotent — skips dates that already have planned workouts.",
  inputSchema: z.object({
    week_start: z.string().optional().describe("Monday of the week (YYYY-MM-DD). Defaults to current week."),
  }),
}, async ({ week_start }) => {
  return textResult(await instantiatePlan(week_start ?? undefined));
});

server.registerTool("ironcompass_query_plan", {
  title: "Plan Status",
  description: "Get plan-vs-actual workout status for a week, including target progress",
  inputSchema: z.object({
    week_start: z.string().optional().describe("Monday of the week (YYYY-MM-DD). Defaults to current week."),
  }),
}, async ({ week_start }) => {
  return textResult(await queryPlanStatus(week_start ?? undefined));
});

const transport = new StdioServerTransport();
await server.connect(transport);
