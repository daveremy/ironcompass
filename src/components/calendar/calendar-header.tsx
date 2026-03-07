import { MONTHS } from "@/lib/date";

interface CalendarHeaderProps {
  currentMonth: Date;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

export default function CalendarHeader({
  currentMonth,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  const month = MONTHS[currentMonth.getMonth()];
  const year = currentMonth.getFullYear();

  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-baseline gap-3">
        <h1 className="text-2xl sm:text-3xl font-mono font-bold tracking-tight text-foreground">
          {month}
        </h1>
        <span className="text-lg sm:text-xl font-mono text-muted font-light">
          {year}
        </span>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={onPrev}
          className="w-9 h-9 flex items-center justify-center rounded border border-border bg-surface text-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all active:scale-95 font-mono"
          aria-label="Previous month"
        >
          &#x2039;
        </button>
        <button
          onClick={onToday}
          className="h-9 px-3 flex items-center justify-center rounded border border-border bg-surface text-xs font-mono font-medium tracking-wider uppercase text-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all active:scale-95"
        >
          Today
        </button>
        <button
          onClick={onNext}
          className="w-9 h-9 flex items-center justify-center rounded border border-border bg-surface text-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all active:scale-95 font-mono"
          aria-label="Next month"
        >
          &#x203a;
        </button>
      </div>
    </div>
  );
}
