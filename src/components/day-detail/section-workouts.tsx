import type { WorkoutRow } from "@/lib/types";
import { getWorkoutColor } from "@/lib/types";
import SectionCard from "./section-card";

function WorkoutTypeBadge({ type }: { type: string }) {
  const color = getWorkoutColor(type);
  return (
    <span
      className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase tracking-wider"
      style={{
        color,
        backgroundColor: `${color}15`,
        border: `1px solid ${color}40`,
      }}
    >
      {type}
    </span>
  );
}

function WorkoutCard({ workout }: { workout: WorkoutRow }) {
  const stats = [
    workout.duration_min != null && `${workout.duration_min} min`,
    workout.distance_mi != null && `${workout.distance_mi} mi`,
    workout.elevation_ft != null && `${workout.elevation_ft} ft`,
    workout.calories != null && `${workout.calories} cal`,
    workout.avg_hr != null && `${workout.avg_hr} bpm`,
  ].filter(Boolean);

  return (
    <div className="flex flex-col gap-1.5 p-3 rounded-md bg-background/50 border border-border/50">
      <div className="flex items-center gap-2">
        <WorkoutTypeBadge type={workout.type} />
        {stats.length > 0 && (
          <span className="text-xs font-mono text-muted">{stats.join(" / ")}</span>
        )}
      </div>
      {workout.notes && (
        <p className="text-sm text-foreground/70">{workout.notes}</p>
      )}
    </div>
  );
}

export default function SectionWorkouts({ data }: { data: WorkoutRow[] }) {
  return (
    <SectionCard title="Workouts" accent="#3b82f6" empty={data.length === 0}>
      {data.length > 0 && (
        <div className="space-y-2">
          {data.map((w) => (
            <WorkoutCard key={w.id} workout={w} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
