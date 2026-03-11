import Badge from "@/components/day-detail/badge";
import { FALLBACK_COLOR } from "@/lib/workout-types";

export default function WorkoutTypeBadge({ type, color, displayName }: { type: string; color?: string; displayName?: string }) {
  return (
    <span data-testid={`badge-${type}`}>
      <Badge label={displayName ?? type} color={color ?? FALLBACK_COLOR} />
    </span>
  );
}
