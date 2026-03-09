import { Command } from "commander";
import { fail, success } from "../output.js";
import { getSupabase, upsertRow, insertRow } from "../db.js";
import { ensureDailyEntry } from "../lib/ensure-daily-entry.js";
import { parseNum, parseList, parseJsonObject, parseTimestamp, mergeSupplements, sparse } from "../lib/parse.js";
import { todayDate } from "../lib/date.js";
import { validateWorkoutType } from "../lib/workout-types.js";

// --- Extracted core functions (used by both CLI and MCP) ---

export async function logDaily(date: string, fields: { weight?: number; energy?: number; alcohol?: boolean; notes?: string }) {
  return upsertRow("daily_entries", { date, ...sparse(fields) });
}

export async function logSleep(date: string, fields: { apple_score?: number; oura_score?: number; hours?: number; cpap?: boolean; mouth_tape?: boolean; oura_readiness?: number; avg_hr_sleep?: number; avg_hrv?: number; notes?: string }) {
  await ensureDailyEntry(date);
  return upsertRow("sleep", { date, ...sparse(fields) });
}

export async function logFasting(date: string, fields: { protocol?: string; window_start?: string; window_end?: string; compliant?: boolean }) {
  await ensureDailyEntry(date);
  return upsertRow("fasting", { date, ...sparse(fields) });
}

export async function logBp(date: string, systolic: number, diastolic: number, fields: { time?: string } = {}) {
  await ensureDailyEntry(date);
  return insertRow("blood_pressure", { date, systolic, diastolic, ...sparse(fields) });
}

export async function logWorkout(date: string, type: string, fields: { duration_min?: number; distance_mi?: number; elevation_ft?: number; calories?: number; avg_hr?: number; notes?: string; planned?: boolean; completed?: boolean; details?: Record<string, unknown>; start_time?: string; end_time?: string; source?: string } = {}) {
  await validateWorkoutType(type);
  await ensureDailyEntry(date);
  const normalized = {
    ...fields,
    start_time: fields.start_time ? parseTimestamp(date, fields.start_time) : undefined,
    end_time: fields.end_time ? parseTimestamp(date, fields.end_time) : undefined,
    source: fields.source ?? "manual",
  };
  return insertRow("workouts", { date, type, ...sparse(normalized) });
}

export async function logMeal(date: string, name: string, fields: { time?: string; description?: string; protein_g?: number; fat_g?: number; carbs_g?: number; calories?: number; notes?: string } = {}) {
  await ensureDailyEntry(date);
  return insertRow("meals", { date, name, ...sparse(fields) });
}

export async function logPullups(date: string, total_count: number, fields: { sets?: number[] } = {}) {
  await ensureDailyEntry(date);
  return upsertRow("pullups", { date, total_count, ...sparse(fields) });
}

export async function logSupplements(date: string, supplements: string[]) {
  await ensureDailyEntry(date);
  const { data: existing, error } = await getSupabase().from("supplements").select("supplements").eq("date", date).maybeSingle();
  if (error) throw new Error(`Database error: ${error.message}`);
  const merged = mergeSupplements(existing?.supplements ?? [], supplements);
  return upsertRow("supplements", { date, supplements: merged });
}

export async function logBodycomp(date: string, fields: { body_fat_pct?: number; muscle_mass_lbs?: number; bone_mass_lbs?: number; body_water_pct?: number; visceral_fat?: number; bmr?: number; notes?: string } = {}) {
  await ensureDailyEntry(date);
  return upsertRow("body_composition", { date, ...sparse(fields) });
}

export async function logMetric(date: string, metric_name: string, value: number, fields: { unit?: string; notes?: string } = {}) {
  await ensureDailyEntry(date);
  return insertRow("custom_metrics", { date, metric_name: metric_name.toLowerCase(), value, ...sparse(fields) });
}

export function registerLogCommands(program: Command): void {
  const today = todayDate();
  const log = program
    .command("log")
    .description("Log health data");

  // --- daily ---
  log
    .command("daily")
    .description("Log daily metrics (weight, energy, alcohol)")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .option("--weight <lbs>", "Weight in pounds")
    .option("--energy <1-5>", "Energy level 1-5")
    .option("--alcohol", "Alcohol consumed")
    .option("--no-alcohol", "No alcohol consumed")
    .option("--notes <text>", "Notes")
    .action(async (opts) => {
      try {
        const result = await logDaily(opts.date as string, {
          weight: parseNum("weight", opts.weight),
          energy: parseNum("energy", opts.energy),
          alcohol: opts.alcohol as boolean | undefined,
          notes: opts.notes as string | undefined,
        });
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- sleep ---
  log
    .command("sleep")
    .description("Log sleep data")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .option("--apple <score>", "Apple Watch sleep score")
    .option("--oura <score>", "Oura Ring sleep score")
    .option("--hours <hours>", "Hours slept")
    .option("--cpap", "CPAP used")
    .option("--no-cpap", "No CPAP")
    .option("--mouth-tape", "Mouth tape used")
    .option("--no-mouth-tape", "No mouth tape")
    .option("--readiness <score>", "Oura readiness score")
    .option("--avg-hr-sleep <bpm>", "Average heart rate during sleep")
    .option("--hrv <ms>", "Average HRV")
    .option("--notes <text>", "Notes")
    .action(async (opts) => {
      try {
        const result = await logSleep(opts.date as string, {
          apple_score: parseNum("apple", opts.apple),
          oura_score: parseNum("oura", opts.oura),
          hours: parseNum("hours", opts.hours),
          cpap: opts.cpap as boolean | undefined,
          mouth_tape: opts.mouthTape as boolean | undefined,
          oura_readiness: parseNum("readiness", opts.readiness),
          avg_hr_sleep: parseNum("avg-hr-sleep", opts.avgHrSleep),
          avg_hrv: parseNum("hrv", opts.hrv),
          notes: opts.notes as string | undefined,
        });
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- fasting ---
  log
    .command("fasting")
    .description("Log fasting window")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .option("--protocol <type>", "Protocol (16:8, 18:6, OMAD)")
    .option("--start <time>", "Window start (HH:MM)")
    .option("--end <time>", "Window end (HH:MM)")
    .option("--compliant", "Stuck to protocol")
    .option("--no-compliant", "Did not comply")
    .action(async (opts) => {
      try {
        const result = await logFasting(opts.date as string, {
          protocol: opts.protocol as string | undefined,
          window_start: opts.start as string | undefined,
          window_end: opts.end as string | undefined,
          compliant: opts.compliant as boolean | undefined,
        });
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- bp ---
  log
    .command("bp")
    .description("Log blood pressure")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .requiredOption("--systolic <mmHg>", "Systolic pressure")
    .requiredOption("--diastolic <mmHg>", "Diastolic pressure")
    .option("--time <time>", "Time of reading (HH:MM)")
    .action(async (opts) => {
      try {
        const result = await logBp(opts.date as string, parseNum("systolic", opts.systolic)!, parseNum("diastolic", opts.diastolic)!, {
          time: opts.time as string | undefined,
        });
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- workout ---
  log
    .command("workout")
    .description("Log a workout")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .requiredOption("--type <type>", "Workout type (e.g. strength, hike, run, pickleball)")
    .option("--duration <min>", "Duration in minutes")
    .option("--distance <miles>", "Distance in miles")
    .option("--elevation <ft>", "Elevation gain in feet")
    .option("--calories <cal>", "Calories burned")
    .option("--hr <bpm>", "Average heart rate")
    .option("--notes <text>", "Notes")
    .option("--details <json>", "Type-specific details as JSON object")
    .option("--start-time <time>", "Start time — HH:MM or ISO 8601")
    .option("--end-time <time>", "End time — HH:MM or ISO 8601")
    .option("--source <source>", "Data source (default: manual)")
    .option("--planned", "Was planned")
    .option("--no-planned", "Was not planned")
    .option("--completed", "Was completed")
    .option("--no-completed", "Was not completed")
    .action(async (opts) => {
      try {
        const result = await logWorkout(opts.date as string, opts.type as string, {
          duration_min: parseNum("duration", opts.duration),
          distance_mi: parseNum("distance", opts.distance),
          elevation_ft: parseNum("elevation", opts.elevation),
          calories: parseNum("calories", opts.calories),
          avg_hr: parseNum("hr", opts.hr),
          notes: opts.notes as string | undefined,
          details: opts.details !== undefined ? parseJsonObject(opts.details as string) : undefined,
          start_time: opts.startTime as string | undefined,
          end_time: opts.endTime as string | undefined,
          source: opts.source as string | undefined,
          planned: opts.planned as boolean | undefined,
          completed: opts.completed as boolean | undefined,
        });
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- meal ---
  log
    .command("meal")
    .description("Log a meal")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .option("--time <time>", "Meal time (HH:MM)")
    .requiredOption("--name <name>", "Meal name")
    .option("--description <text>", "Description")
    .option("--protein <g>", "Protein grams")
    .option("--fat <g>", "Fat grams")
    .option("--carbs <g>", "Carbs grams")
    .option("--calories <cal>", "Calories")
    .option("--notes <text>", "Notes")
    .action(async (opts) => {
      try {
        const result = await logMeal(opts.date as string, opts.name as string, {
          time: opts.time as string | undefined,
          description: opts.description as string | undefined,
          protein_g: parseNum("protein", opts.protein),
          fat_g: parseNum("fat", opts.fat),
          carbs_g: parseNum("carbs", opts.carbs),
          calories: parseNum("calories", opts.calories),
          notes: opts.notes as string | undefined,
        });
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- pullups ---
  log
    .command("pullups")
    .description("Log pullup count")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .requiredOption("--total <count>", "Total reps")
    .option("--sets <reps>", "Reps per set (comma-separated, e.g. 3,3,3)")
    .action(async (opts) => {
      try {
        let sets: number[] | undefined;
        if (opts.sets !== undefined) {
          sets = parseList(opts.sets as string).map(s => parseNum("sets", s)!);
        }
        const result = await logPullups(opts.date as string, parseNum("total", opts.total)!, { sets });
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- supplements ---
  log
    .command("supplements")
    .description("Log supplements taken")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .requiredOption("--taken <list>", "Supplements (comma-separated)")
    .action(async (opts) => {
      try {
        const supplements = parseList(opts.taken as string);
        if (supplements.length === 0) fail("--taken requires at least one supplement");
        const result = await logSupplements(opts.date as string, supplements);
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- bodycomp ---
  log
    .command("bodycomp")
    .description("Log body composition (Hume Body Pod)")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .option("--fat <pct>", "Body fat percentage")
    .option("--muscle <lbs>", "Muscle mass in pounds")
    .option("--bone <lbs>", "Bone mass in pounds")
    .option("--water <pct>", "Body water percentage")
    .option("--visceral <score>", "Visceral fat score")
    .option("--bmr <cal>", "Basal metabolic rate")
    .option("--notes <text>", "Notes")
    .action(async (opts) => {
      try {
        const result = await logBodycomp(opts.date as string, {
          body_fat_pct: parseNum("fat", opts.fat),
          muscle_mass_lbs: parseNum("muscle", opts.muscle),
          bone_mass_lbs: parseNum("bone", opts.bone),
          body_water_pct: parseNum("water", opts.water),
          visceral_fat: parseNum("visceral", opts.visceral),
          bmr: parseNum("bmr", opts.bmr),
          notes: opts.notes as string | undefined,
        });
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- metric ---
  log
    .command("metric")
    .description("Log a custom metric")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .requiredOption("--name <name>", "Metric name (e.g. coffee, water)")
    .requiredOption("--value <number>", "Numeric value")
    .option("--unit <unit>", "Unit (e.g. cups, ml)")
    .option("--notes <text>", "Notes")
    .action(async (opts) => {
      try {
        const result = await logMetric(opts.date as string, opts.name as string, parseNum("value", opts.value)!, {
          unit: opts.unit as string | undefined,
          notes: opts.notes as string | undefined,
        });
        success(result);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });
}
