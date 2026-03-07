import { supabase } from "./supabase";
import type {
  BloodPressureRow,
  BodyCompositionRow,
  DailyEntryRow,
  FastingRow,
  MealRow,
  PullupsRow,
  SleepRow,
  SupplementsRow,
  WorkoutRow,
} from "./types";

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
  ]);

  const errors = [
    dailyRes, sleepRes, fastingRes, workoutsRes, mealsRes,
    bpRes, pullupsRes, supplementsRes, bodyCompRes,
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
  };
}
