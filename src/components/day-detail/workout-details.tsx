import { toTitleCase } from "@/lib/format";
import StravaActivity from "./strava-activity";

const STRAVA_KEYS = ["strava_id", "summary_polyline", "embed_token"];

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    if (value.every((v) => typeof v !== "object" || v === null)) return value.join(", ");
    return JSON.stringify(value, null, 2);
  }
  if (typeof value === "object" && value !== null) return JSON.stringify(value, null, 2);
  return String(value);
}

function GenericDetails({ details }: { details: Record<string, unknown> }) {
  const entries = Object.entries(details);
  if (entries.length === 0) return null;

  return (
    <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-xs font-mono">
      {entries.map(([key, value]) => {
        const isObjectArray = Array.isArray(value) && value.some((v) => typeof v === "object" && v !== null);
        const isComplex = isObjectArray || (typeof value === "object" && value !== null && !Array.isArray(value));
        if (isComplex) {
          return (
            <div key={key} className="col-span-2">
              <span className="text-muted">{toTitleCase(key)}:</span>
              <pre className="text-foreground/60 bg-background/80 rounded p-2 mt-1 overflow-x-auto whitespace-pre-wrap">
                {JSON.stringify(value, null, 2)}
              </pre>
            </div>
          );
        }
        return (
          <div key={key} className="contents">
            <span className="text-muted">{toTitleCase(key)}</span>
            <span className="text-foreground/80">{formatValue(value)}</span>
          </div>
        );
      })}
    </div>
  );
}

interface Exercise {
  name?: string;
  sets?: Array<{ reps?: number; weight?: number; unit?: string }>;
  [key: string]: unknown;
}

function StrengthDetails({ details }: { details: Record<string, unknown> }) {
  const exercises = details.exercises;
  if (!Array.isArray(exercises) || exercises.length === 0) {
    return <GenericDetails details={details} />;
  }

  const remaining = Object.fromEntries(
    Object.entries(details).filter(([k]) => k !== "exercises")
  );

  return (
    <div className="space-y-3">
      {(exercises as Exercise[]).map((ex, i) => (
        <div key={i}>
          <div className="text-xs font-mono font-semibold text-foreground/90 mb-1">
            {ex.name ?? `Exercise ${i + 1}`}
          </div>
          {Array.isArray(ex.sets) && ex.sets.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {ex.sets.map((set, j) => {
                const parts: string[] = [];
                if (set.reps != null) parts.push(`${set.reps} reps`);
                if (set.weight != null) parts.push(`${set.weight} ${set.unit ?? "lbs"}`);
                return (
                  <span
                    key={j}
                    className="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono text-foreground/70 bg-surface border border-border/50"
                  >
                    {parts.length > 0 ? parts.join(" @ ") : `Set ${j + 1}`}
                  </span>
                );
              })}
            </div>
          )}
          {(() => {
            const extraFields = Object.fromEntries(
              Object.entries(ex).filter(([k]) => k !== "name" && k !== "sets")
            );
            return Object.keys(extraFields).length > 0 ? <GenericDetails details={extraFields} /> : null;
          })()}
        </div>
      ))}
      {Object.keys(remaining).length > 0 && (
        <div className="border-t border-border/50 pt-2">
          <GenericDetails details={remaining} />
        </div>
      )}
    </div>
  );
}

function EnduranceDetails({ details }: { details: Record<string, unknown> }) {
  const statKeys = ["pace", "avg_pace", "splits", "route", "terrain", "laps"];
  const stats = Object.fromEntries(
    Object.entries(details).filter(([k]) => statKeys.includes(k))
  );
  const rest = Object.fromEntries(
    Object.entries(details).filter(([k]) => !statKeys.includes(k))
  );

  return (
    <div className="space-y-2">
      {Object.keys(stats).length > 0 && <GenericDetails details={stats} />}
      {Object.keys(rest).length > 0 && <GenericDetails details={rest} />}
    </div>
  );
}

export default function WorkoutDetails({ type, details }: { type: string; details: Record<string, unknown> }) {
  if (Object.keys(details).length === 0) return null;

  // Extract Strava fields before passing to type-specific renderers
  const stravaId = details.strava_id as string | number | undefined;
  const summaryPolyline = details.summary_polyline as string | undefined;
  const remaining = Object.fromEntries(
    Object.entries(details).filter(([k]) => !STRAVA_KEYS.includes(k))
  );

  const hasStrava = stravaId != null || summaryPolyline != null;

  const hasRemaining = Object.keys(remaining).length > 0;
  let typeContent: React.ReactNode = null;
  if (hasRemaining) {
    switch (type) {
      case "strength":
        typeContent = <StrengthDetails details={remaining} />;
        break;
      case "hike":
      case "run":
        typeContent = <EnduranceDetails details={remaining} />;
        break;
      default:
        typeContent = <GenericDetails details={remaining} />;
    }
  }

  return (
    <div className="space-y-2">
      {hasStrava && <StravaActivity strava_id={stravaId} summary_polyline={summaryPolyline} />}
      {typeContent}
    </div>
  );
}
