import type { WorkoutRow } from "./types";

export type WorkoutStatus = "scheduled" | "skipped" | "completed" | "unplanned";

export function getWorkoutStatus(w: WorkoutRow, today: string): WorkoutStatus {
  const isPlannedOnly = w.planned === true && w.completed === false;
  if (isPlannedOnly) {
    return w.date < today ? "skipped" : "scheduled";
  }
  return "completed";
}
