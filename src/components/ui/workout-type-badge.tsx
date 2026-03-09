import Badge from "@/components/day-detail/badge";
import { FALLBACK_COLOR } from "@/lib/workout-types";

export default function WorkoutTypeBadge({ type, color }: { type: string; color?: string }) {
  return <Badge label={type} color={color ?? FALLBACK_COLOR} />;
}
