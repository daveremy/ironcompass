import { WorkoutRow, getWorkoutColor } from "@/lib/types";

interface CalendarDayProps {
  date: Date;
  workouts: WorkoutRow[];
  isCurrentMonth: boolean;
  isToday: boolean;
  onClick: () => void;
}

function WorkoutDot({ type }: { type: string }) {
  const color = getWorkoutColor(type);
  return (
    <span
      className="w-2 h-2 rounded-full shrink-0"
      style={{
        backgroundColor: color,
        boxShadow: `0 0 6px ${color}66`,
      }}
    />
  );
}

export default function CalendarDay({
  date,
  workouts,
  isCurrentMonth,
  isToday,
  onClick,
}: CalendarDayProps) {
  const day = date.getDate();
  const isRest = isCurrentMonth && workouts.length === 0;
  const showOverflow = workouts.length > 3;
  const visibleWorkouts = workouts.slice(0, showOverflow ? 2 : 3);

  return (
    <button
      onClick={onClick}
      className={`
        w-full h-full flex flex-col items-start p-1.5 sm:p-2 rounded-lg border transition-all min-h-[3.5rem] sm:min-h-[4.5rem]
        ${isToday
          ? "border-accent/50 bg-accent/5"
          : "border-transparent hover:border-border hover:bg-surface-hover"
        }
        ${isCurrentMonth ? "" : "opacity-30"}
      `}
      style={isToday ? { animation: "ring-glow 3s ease-in-out infinite" } : undefined}
    >
      <span
        className={`
          text-xs font-mono leading-none
          ${isToday ? "text-accent font-bold" : isCurrentMonth ? "text-foreground/80" : "text-muted"}
        `}
      >
        {day}
      </span>

      <div className="flex items-center gap-1 mt-auto pt-1">
        {visibleWorkouts.map((w) => (
          <WorkoutDot key={w.id} type={w.type} />
        ))}
        {showOverflow && (
          <span className="text-[9px] font-mono text-muted leading-none">
            +{workouts.length - 2}
          </span>
        )}
        {isRest && (
          <span className="w-1.5 h-1.5 rounded-full bg-muted/30" />
        )}
      </div>
    </button>
  );
}
