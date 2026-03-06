#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { fetchDay, fetchWeek, computeTrend, computeStreak, VALID_METRICS, VALID_STREAKS } from "./commands/query.js";
import { logDaily, logSleep, logFasting, logBp, logWorkout, logMeal, logPullups, logSupplements, logBodycomp, WORKOUT_TYPES } from "./commands/log.js";
import { todayDate } from "./lib/date.js";

const server = new McpServer({ name: "ironcompass", version: "0.1.0" });

function textResult(data: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }] };
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
    metric: z.enum(VALID_METRICS).describe("Metric to trend"),
    days: z.number().optional().describe("Number of days (default 30)"),
  }),
}, async ({ metric, days }) => {
  return textResult(await computeTrend(metric, days ?? 30));
});

server.registerTool("ironcompass_query_streak", {
  title: "Current Streak",
  description: "Get current streak for a health metric",
  inputSchema: z.object({
    metric: z.enum(VALID_STREAKS).describe("Streak metric"),
  }),
}, async ({ metric }) => {
  return textResult(await computeStreak(metric));
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
  return textResult(await logDaily(date ?? todayDate(), fields));
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
  return textResult(await logSleep(date ?? todayDate(), fields));
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
  return textResult(await logFasting(date ?? todayDate(), fields));
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
  return textResult(await logBp(date ?? todayDate(), systolic, diastolic, { time }));
});

server.registerTool("ironcompass_log_workout", {
  title: "Log Workout",
  description: "Log a workout session",
  inputSchema: z.object({
    date: optDate,
    type: z.enum(WORKOUT_TYPES).describe("Workout type"),
    duration_min: z.number().optional().describe("Duration in minutes"),
    distance_mi: z.number().optional().describe("Distance in miles"),
    elevation_ft: z.number().optional().describe("Elevation gain in feet"),
    calories: z.number().optional().describe("Calories burned"),
    avg_hr: z.number().optional().describe("Average heart rate"),
    notes: z.string().optional(),
    planned: z.boolean().optional().describe("Was planned"),
    completed: z.boolean().optional().describe("Was completed"),
  }),
}, async ({ date, type, ...fields }) => {
  return textResult(await logWorkout(date ?? todayDate(), type, fields));
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
  return textResult(await logMeal(date ?? todayDate(), name, fields));
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
  return textResult(await logPullups(date ?? todayDate(), total_count, { sets }));
});

server.registerTool("ironcompass_log_supplements", {
  title: "Log Supplements",
  description: "Log supplements taken",
  inputSchema: z.object({
    date: optDate,
    supplements: z.array(z.string()).nonempty().describe("Supplements taken"),
  }),
}, async ({ date, supplements }) => {
  return textResult(await logSupplements(date ?? todayDate(), supplements));
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
  return textResult(await logBodycomp(date ?? todayDate(), fields));
});

const transport = new StdioServerTransport();
await server.connect(transport);
