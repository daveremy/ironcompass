"use client";

import { useRouter } from "next/navigation";
import { parseDate, DAYS, MONTHS } from "@/lib/date";

export default function DayHeader({ date, backMonth }: { date: string; backMonth?: string }) {
  const router = useRouter();
  const d = parseDate(date);
  const label = `${DAYS[d.getDay()]}, ${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;

  // Fall back to the viewed date's month for deep-linked day views
  const fallbackMonth = `${date.slice(0, 7)}-01`;
  const backUrl = `/?month=${backMonth ?? fallbackMonth}`;

  return (
    <div className="flex items-center gap-3 mb-6">
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
  );
}
