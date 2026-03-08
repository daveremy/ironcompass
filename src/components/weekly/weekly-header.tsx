import { MONTHS } from "@/lib/date";

interface WeeklyHeaderProps {
  monday: Date;
  sunday: Date;
  onPrev: () => void;
  onNext: () => void;
  onThisWeek: () => void;
}

function formatRange(monday: Date, sunday: Date): string {
  const mMonth = MONTHS[monday.getMonth()].slice(0, 3);
  const sMonth = MONTHS[sunday.getMonth()].slice(0, 3);
  const mYear = monday.getFullYear();
  const sYear = sunday.getFullYear();

  if (mYear !== sYear) {
    return `${mMonth} ${monday.getDate()}, ${mYear} – ${sMonth} ${sunday.getDate()}, ${sYear}`;
  }
  if (monday.getMonth() === sunday.getMonth()) {
    return `${mMonth} ${monday.getDate()} – ${sunday.getDate()}, ${sYear}`;
  }
  return `${mMonth} ${monday.getDate()} – ${sMonth} ${sunday.getDate()}, ${sYear}`;
}

export default function WeeklyHeader({
  monday,
  sunday,
  onPrev,
  onNext,
  onThisWeek,
}: WeeklyHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-foreground">
          {formatRange(monday, sunday)}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="w-9 h-9 flex items-center justify-center rounded border border-border bg-surface text-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all active:scale-95 font-mono"
          aria-label="Previous week"
        >
          &#x2039;
        </button>
        <button
          onClick={onThisWeek}
          className="h-9 px-3 flex items-center justify-center rounded border border-border bg-surface text-xs font-mono font-medium tracking-wider uppercase text-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all active:scale-95"
        >
          This Week
        </button>
        <button
          onClick={onNext}
          className="w-9 h-9 flex items-center justify-center rounded border border-border bg-surface text-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all active:scale-95 font-mono"
          aria-label="Next week"
        >
          &#x203a;
        </button>
      </div>
    </div>
  );
}
