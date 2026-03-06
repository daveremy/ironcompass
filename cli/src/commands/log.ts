import { Command, Option } from "commander";
import { fail, success } from "../output.js";
import { getSupabase } from "../db.js";
import { ensureDailyEntry } from "../lib/ensure-daily-entry.js";
import { parseNum, parseList, sparse } from "../lib/parse.js";
import { todayDate } from "../lib/date.js";

const WORKOUT_TYPES = [
  "pickleball", "strength", "hike", "golf", "run",
  "elliptical", "mobility", "sauna", "hot_tub", "other",
] as const;

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
        const date = opts.date as string;
        const payload = {
          date,
          ...sparse({
            weight: parseNum("weight", opts.weight),
            energy: parseNum("energy", opts.energy),
            alcohol: opts.alcohol as boolean | undefined,
            notes: opts.notes as string | undefined,
          }),
        };
        const { data, error } = await getSupabase()
          .from("daily_entries")
          .upsert(payload, { onConflict: "date" })
          .select()
          .single();
        if (error) fail(`Failed to log daily: ${error.message}`);
        success(data);
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
        const date = opts.date as string;
        const payload = {
          date,
          ...sparse({
            apple_score: parseNum("apple", opts.apple),
            oura_score: parseNum("oura", opts.oura),
            hours: parseNum("hours", opts.hours),
            cpap: opts.cpap as boolean | undefined,
            mouth_tape: opts.mouthTape as boolean | undefined,
            oura_readiness: parseNum("readiness", opts.readiness),
            avg_hr_sleep: parseNum("avg-hr-sleep", opts.avgHrSleep),
            avg_hrv: parseNum("hrv", opts.hrv),
            notes: opts.notes as string | undefined,
          }),
        };
        await ensureDailyEntry(date);
        const { data, error } = await getSupabase()
          .from("sleep")
          .upsert(payload, { onConflict: "date" })
          .select()
          .single();
        if (error) fail(`Failed to log sleep: ${error.message}`);
        success(data);
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
        const date = opts.date as string;
        const payload = {
          date,
          ...sparse({
            protocol: opts.protocol as string | undefined,
            window_start: opts.start as string | undefined,
            window_end: opts.end as string | undefined,
            compliant: opts.compliant as boolean | undefined,
          }),
        };
        await ensureDailyEntry(date);
        const { data, error } = await getSupabase()
          .from("fasting")
          .upsert(payload, { onConflict: "date" })
          .select()
          .single();
        if (error) fail(`Failed to log fasting: ${error.message}`);
        success(data);
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
        const date = opts.date as string;
        const systolic = parseNum("systolic", opts.systolic)!;
        const diastolic = parseNum("diastolic", opts.diastolic)!;
        const payload = {
          date,
          systolic,
          diastolic,
          ...sparse({
            time: opts.time as string | undefined,
          }),
        };
        await ensureDailyEntry(date);
        const { data, error } = await getSupabase()
          .from("blood_pressure")
          .insert(payload)
          .select()
          .single();
        if (error) fail(`Failed to log bp: ${error.message}`);
        success(data);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });

  // --- workout ---
  log
    .command("workout")
    .description("Log a workout")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .addOption(new Option("--type <type>", "Workout type").choices(WORKOUT_TYPES as unknown as string[]).makeOptionMandatory())
    .option("--duration <min>", "Duration in minutes")
    .option("--distance <miles>", "Distance in miles")
    .option("--elevation <ft>", "Elevation gain in feet")
    .option("--calories <cal>", "Calories burned")
    .option("--hr <bpm>", "Average heart rate")
    .option("--notes <text>", "Notes")
    .option("--planned", "Was planned")
    .option("--no-planned", "Was not planned")
    .option("--completed", "Was completed")
    .option("--no-completed", "Was not completed")
    .action(async (opts) => {
      try {
        const date = opts.date as string;
        const payload = {
          date,
          type: opts.type as string,
          ...sparse({
            duration_min: parseNum("duration", opts.duration),
            distance_mi: parseNum("distance", opts.distance),
            elevation_ft: parseNum("elevation", opts.elevation),
            calories: parseNum("calories", opts.calories),
            avg_hr: parseNum("hr", opts.hr),
            notes: opts.notes as string | undefined,
            planned: opts.planned as boolean | undefined,
            completed: opts.completed as boolean | undefined,
          }),
        };
        await ensureDailyEntry(date);
        const { data, error } = await getSupabase()
          .from("workouts")
          .insert(payload)
          .select()
          .single();
        if (error) fail(`Failed to log workout: ${error.message}`);
        success(data);
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
        const date = opts.date as string;
        const payload = {
          date,
          name: opts.name as string,
          ...sparse({
            time: opts.time as string | undefined,
            description: opts.description as string | undefined,
            protein_g: parseNum("protein", opts.protein),
            fat_g: parseNum("fat", opts.fat),
            carbs_g: parseNum("carbs", opts.carbs),
            calories: parseNum("calories", opts.calories),
            notes: opts.notes as string | undefined,
          }),
        };
        await ensureDailyEntry(date);
        const { data, error } = await getSupabase()
          .from("meals")
          .insert(payload)
          .select()
          .single();
        if (error) fail(`Failed to log meal: ${error.message}`);
        success(data);
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
        const date = opts.date as string;
        const total_count = parseNum("total", opts.total)!;
        let sets: number[] | undefined;
        if (opts.sets !== undefined) {
          sets = parseList(opts.sets as string).map(s => parseNum("sets", s)!);
        }
        const payload = {
          date,
          total_count,
          ...sparse({ sets }),
        };
        await ensureDailyEntry(date);
        const { data, error } = await getSupabase()
          .from("pullups")
          .upsert(payload, { onConflict: "date" })
          .select()
          .single();
        if (error) fail(`Failed to log pullups: ${error.message}`);
        success(data);
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
        const date = opts.date as string;
        const supplements = parseList(opts.taken as string);
        if (supplements.length === 0) fail("--taken requires at least one supplement");
        const payload = { date, supplements };
        await ensureDailyEntry(date);
        const { data, error } = await getSupabase()
          .from("supplements")
          .upsert(payload, { onConflict: "date" })
          .select()
          .single();
        if (error) fail(`Failed to log supplements: ${error.message}`);
        success(data);
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
        const date = opts.date as string;
        const payload = {
          date,
          ...sparse({
            body_fat_pct: parseNum("fat", opts.fat),
            muscle_mass_lbs: parseNum("muscle", opts.muscle),
            bone_mass_lbs: parseNum("bone", opts.bone),
            body_water_pct: parseNum("water", opts.water),
            visceral_fat: parseNum("visceral", opts.visceral),
            bmr: parseNum("bmr", opts.bmr),
            notes: opts.notes as string | undefined,
          }),
        };
        await ensureDailyEntry(date);
        const { data, error } = await getSupabase()
          .from("body_composition")
          .upsert(payload, { onConflict: "date" })
          .select()
          .single();
        if (error) fail(`Failed to log bodycomp: ${error.message}`);
        success(data);
      } catch (e: any) { fail(e.message ?? String(e)); }
    });
}
