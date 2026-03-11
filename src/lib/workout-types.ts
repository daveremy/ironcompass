import { supabase } from "./supabase";

export interface WorkoutTypeRecord {
  name: string;
  display_name: string;
  color: string;
}

export interface WorkoutTypeInfo {
  color: string;
  displayName: string;
}

export type WorkoutTypeLookup = Record<string, WorkoutTypeInfo>;

export const FALLBACK_COLOR = "#737373";

let _cache: WorkoutTypeRecord[] | null = null;

export async function getWorkoutTypes(): Promise<WorkoutTypeRecord[]> {
  if (_cache) return _cache;
  const { data, error } = await supabase
    .from("workout_types")
    .select("name, display_name, color")
    .order("name");
  if (error) throw new Error(`Failed to fetch workout types: ${error.message}`);
  _cache = data as WorkoutTypeRecord[];
  return _cache;
}

export function buildTypeLookup(types: WorkoutTypeRecord[]): WorkoutTypeLookup {
  const map: WorkoutTypeLookup = {};
  for (const t of types) map[t.name] = { color: t.color, displayName: t.display_name };
  return map;
}
