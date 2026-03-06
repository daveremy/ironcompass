import { Command, Option } from "commander";
import { fail } from "../output.js";

function todayDate(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const WORKOUT_TYPES = [
  "pickleball", "strength", "hike", "golf", "run",
  "elliptical", "mobility", "sauna", "hot_tub", "other",
] as const;

export function registerLogCommands(program: Command): void {
  const today = todayDate();
  const log = program
    .command("log")
    .description("Log health data");

  log
    .command("daily")
    .description("Log daily metrics (weight, energy, alcohol)")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .option("--weight <lbs>", "Weight in pounds")
    .option("--energy <1-5>", "Energy level 1-5")
    .option("--alcohol", "Alcohol consumed")
    .option("--no-alcohol", "No alcohol consumed")
    .option("--notes <text>", "Notes")
    .action(() => fail("Not implemented yet — see issue #4"));

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
    .option("--notes <text>", "Notes")
    .action(() => fail("Not implemented yet — see issue #4"));

  log
    .command("fasting")
    .description("Log fasting window")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .option("--protocol <type>", "Protocol (16:8, 18:6, OMAD)")
    .option("--start <time>", "Window start (HH:MM)")
    .option("--end <time>", "Window end (HH:MM)")
    .option("--compliant", "Stuck to protocol")
    .option("--no-compliant", "Did not comply")
    .action(() => fail("Not implemented yet — see issue #4"));

  log
    .command("bp")
    .description("Log blood pressure")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .requiredOption("--systolic <mmHg>", "Systolic pressure")
    .requiredOption("--diastolic <mmHg>", "Diastolic pressure")
    .option("--time <time>", "Time of reading (HH:MM)")
    .action(() => fail("Not implemented yet — see issue #4"));

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
    .action(() => fail("Not implemented yet — see issue #4"));

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
    .action(() => fail("Not implemented yet — see issue #4"));

  log
    .command("pullups")
    .description("Log pullup count")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .requiredOption("--total <count>", "Total reps")
    .option("--sets <reps>", "Reps per set (comma-separated, e.g. 3,3,3)")
    .action(() => fail("Not implemented yet — see issue #4"));

  log
    .command("supplements")
    .description("Log supplements taken")
    .option("--date <date>", "Date (YYYY-MM-DD)", today)
    .requiredOption("--taken <list>", "Supplements (comma-separated)")
    .action(() => fail("Not implemented yet — see issue #4"));

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
    .action(() => fail("Not implemented yet — see issue #4"));
}
