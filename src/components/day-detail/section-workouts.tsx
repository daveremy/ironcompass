import type { WorkoutRow } from "@/lib/types";
import { formatTime } from "@/lib/date";
import SectionCard from "./section-card";
import WorkoutTypeBadge from "@/components/ui/workout-type-badge";

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
        {workout.start_time && (
          <span className="text-xs font-mono text-muted">{formatTime(workout.start_time)}</span>
        )}
        <WorkoutTypeBadge type={workout.type} />
        {workout.source && (
          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/50 border border-slate-700/50">
            {workout.source}
          </span>
        )}
        {stats.length > 0 && (
          <span className="text-xs font-mono text-muted">{stats.join(" / ")}</span>
        )}
      </div>
      {workout.notes && (
        <p className="text-sm text-foreground/70">{workout.notes}</p>
      )}
      {workout.details && Object.keys(workout.details).length > 0 && (
        <pre className="text-xs font-mono text-foreground/60 bg-background/80 rounded p-2 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(workout.details, null, 2)}
        </pre>
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
