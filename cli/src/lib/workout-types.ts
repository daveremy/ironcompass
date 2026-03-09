import { getSupabase } from "../db.js";

export interface WorkoutTypeRecord {
  name: string;
  display_name: string;
  color: string;
}

let _cache: WorkoutTypeRecord[] | null = null;
let _cacheTime = 0;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function getWorkoutTypes(): Promise<WorkoutTypeRecord[]> {
  if (_cache && Date.now() - _cacheTime < TTL_MS) return _cache;
  const { data, error } = await getSupabase()
    .from("workout_types")
    .select("name, display_name, color")
    .order("name");
  if (error) throw new Error(`Failed to fetch workout types: ${error.message}`);
  _cache = data as WorkoutTypeRecord[];
  _cacheTime = Date.now();
  return _cache;
}

export async function getWorkoutTypeNames(): Promise<string[]> {
  return (await getWorkoutTypes()).map((t) => t.name);
}

export async function validateWorkoutType(type: string): Promise<void> {
  const names = await getWorkoutTypeNames();
  if (!names.includes(type)) {
    throw new Error(`Unknown workout type "${type}". Valid types: ${names.join(", ")}`);
  }
}
