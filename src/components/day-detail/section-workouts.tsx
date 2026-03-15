import type { WorkoutRow } from "@/lib/types";
import type { WorkoutTypeLookup } from "@/lib/workout-types";
import { FALLBACK_COLOR } from "@/lib/workout-types";
import { getWorkoutStatus, type WorkoutStatus } from "@/lib/workout-status";
import { formatTime } from "@/lib/date";
import SectionCard from "./section-card";
import WorkoutTypeBadge from "@/components/ui/workout-type-badge";
import Badge from "./badge";
import { STRAVA_ORANGE } from "./strava-activity";
import WorkoutDetails from "./workout-details";

function StatusBadge({ status }: { status: WorkoutStatus }) {
  if (status === "completed" || status === "unplanned") return null;

  if (status === "scheduled") {
    return (
      <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-blue-400 bg-blue-500/10 border border-blue-500/30">
        Planned
      </span>
    );
  }

  // skipped
  return (
    <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-400 bg-gray-500/10 border border-gray-500/30">
      Skipped
    </span>
  );
}

function WorkoutCard({ workout, typeLookup, status }: { workout: WorkoutRow; typeLookup: WorkoutTypeLookup; status: WorkoutStatus }) {
  const info = typeLookup[workout.type];
  const isSkipped = status === "skipped";
  const stats = [
    workout.duration_min != null && `${workout.duration_min} min`,
    workout.distance_mi != null && `${workout.distance_mi} mi`,
    workout.elevation_ft != null && `${workout.elevation_ft} ft`,
    workout.calories != null && `${workout.calories} cal`,
    workout.avg_hr != null && `${workout.avg_hr} bpm`,
  ].filter(Boolean);

  return (
    <div className={`flex flex-col gap-1.5 p-3 rounded-md bg-background/50 border border-border/50 ${isSkipped ? "opacity-50" : ""}`}>
      <div className="flex items-center gap-2">
        {workout.start_time && (
          <span className="text-xs font-mono text-muted">{formatTime(workout.start_time)}</span>
        )}
        <span className={isSkipped ? "line-through" : ""}>
          <WorkoutTypeBadge type={workout.type} color={info?.color} displayName={info?.displayName} />
        </span>
        <StatusBadge status={status} />
        {workout.source && (
          workout.source === "strava"
            ? <Badge label="Strava" color={STRAVA_ORANGE} />
            : <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-400 bg-slate-800/50 border border-slate-700/50">
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
        <WorkoutDetails type={workout.type} details={workout.details} />
      )}
    </div>
  );
}

export default function SectionWorkouts({ data, typeLookup, today }: { data: WorkoutRow[]; typeLookup: WorkoutTypeLookup; today: string }) {
  // Compute status once per workout, then sort
  const order: Record<WorkoutStatus, number> = { completed: 0, unplanned: 0, scheduled: 1, skipped: 2 };
  const withStatus = data.map((w) => ({ workout: w, status: getWorkoutStatus(w, today) }));
  withStatus.sort((a, b) => order[a.status] - order[b.status]);

  return (
    <SectionCard title="Workouts" accent="#3b82f6" empty={data.length === 0}>
      {withStatus.length > 0 && (
        <div className="space-y-2">
          {withStatus.map(({ workout, status }) => (
            <WorkoutCard key={workout.id} workout={workout} typeLookup={typeLookup} status={status} />
          ))}
        </div>
      )}
    </SectionCard>
  );
}
