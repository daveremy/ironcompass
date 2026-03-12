"use client";

import { useRouter } from "next/navigation";
import { parseDate, addDays, formatDate, DAYS, MONTHS } from "@/lib/date";

export default function DayHeader({ date, backMonth }: { date: string; backMonth?: string }) {
  const router = useRouter();
  const d = parseDate(date);
  const label = `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  const today = formatDate(new Date());
  const isToday = date === today;

  // Fall back to the viewed date's month for deep-linked day views
  const fallbackMonth = `${date.slice(0, 7)}-01`;
  const backUrl = `/?month=${backMonth ?? fallbackMonth}`;

  // Preserve the originating calendar month through day navigation
  const monthParam = backMonth ?? fallbackMonth;

  function navigateDay(offset: number) {
    const newDate = formatDate(addDays(parseDate(date), offset));
    router.push(`/?view=daily&date=${newDate}&month=${monthParam}`);
  }

  function goToday() {
    router.push(`/?view=daily&date=${today}&month=${monthParam}`);
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push(backUrl)}
          className="text-muted hover:text-foreground transition-colors text-2xl leading-none font-mono"
          aria-label="Back to calendar"
        >
          &#8249;
        </button>
        <h1 className="font-mono text-lg sm:text-xl font-bold text-foreground tracking-tight">
          {label}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => navigateDay(-1)}
          className="w-9 h-9 flex items-center justify-center rounded border border-border bg-surface text-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all active:scale-95 font-mono"
          aria-label="Previous day"
        >
          &#x2039;
        </button>
        {!isToday && (
          <button
            onClick={goToday}
            className="h-9 px-3 flex items-center justify-center rounded border border-border bg-surface text-xs font-mono font-medium tracking-wider uppercase text-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5 transition-all active:scale-95"
          >
            Today
          </button>
        )}
        <button
          onClick={() => navigateDay(1)}
          disabled={isToday}
          className={`w-9 h-9 flex items-center justify-center rounded border border-border bg-surface font-mono transition-all active:scale-95 ${isToday ? "text-muted/30 cursor-not-allowed" : "text-muted hover:text-foreground hover:border-accent/40 hover:bg-accent/5"}`}
          aria-label="Next day"
        >
          &#x203a;
        </button>
      </div>
    </div>
  );
}
