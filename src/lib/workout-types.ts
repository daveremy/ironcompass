import { supabase } from "./supabase";

export interface WorkoutTypeRecord {
  name: string;
  display_name: string;
  color: string;
}

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

export function buildColorMap(types: WorkoutTypeRecord[]): Record<string, string> {
  const map: Record<string, string> = {};
  for (const t of types) map[t.name] = t.color;
  return map;
}
