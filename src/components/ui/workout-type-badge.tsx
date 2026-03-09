import Badge from "@/components/day-detail/badge";
import { FALLBACK_COLOR } from "@/lib/workout-types";

export default function WorkoutTypeBadge({ type, color }: { type: string; color?: string }) {
  return (
    <span data-testid={`badge-${type}`}>
      <Badge label={type} color={color ?? FALLBACK_COLOR} />
    </span>
  );
}
