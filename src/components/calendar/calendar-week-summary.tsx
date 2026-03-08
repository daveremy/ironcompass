import { useRouter } from "next/navigation";
import type { WeekSummary } from "@/lib/types";

interface CalendarWeekSummaryProps {
  monday: string;
  month: string;
  summary: WeekSummary | undefined;
}

export default function CalendarWeekSummary({ monday, month, summary }: CalendarWeekSummaryProps) {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push(`/?view=weekly&date=${monday}&month=${month}`)}
      className="w-full h-full flex flex-col items-center justify-center gap-1 p-1 rounded-lg border border-transparent hover:border-border hover:bg-surface-hover transition-all min-h-[3.5rem] sm:min-h-[4.5rem]"
    >
      {summary ? (
        <>
          {summary.workoutCount > 0 && (
            <span className="text-xs font-mono font-bold text-accent">{summary.workoutCount}w</span>
          )}
          {summary.avgSleepHours != null && (
            <span className="text-[10px] font-mono text-purple-400">{summary.avgSleepHours.toFixed(1)}h</span>
          )}
          {summary.weightDelta != null && (
            <span className={`text-[10px] font-mono ${summary.weightDelta <= 0 ? "text-green-400" : "text-red-400"}`}>
              {summary.weightDelta > 0 ? "+" : ""}{summary.weightDelta.toFixed(1)}
            </span>
          )}
          {summary.fastingTotal > 0 && (
            <span className="text-[10px] font-mono text-cyan-400">{summary.fastingCompliant}/{summary.fastingTotal}</span>
          )}
        </>
      ) : (
        <span className="text-[10px] font-mono text-muted/30">--</span>
      )}
    </button>
  );
}
