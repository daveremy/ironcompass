import Badge from "@/components/day-detail/badge";
import { getWorkoutColor } from "@/lib/types";

export default function WorkoutTypeBadge({ type }: { type: string }) {
  return <Badge label={type} color={getWorkoutColor(type)} />;
}
