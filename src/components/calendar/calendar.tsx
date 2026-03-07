"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { WorkoutRow } from "@/lib/types";
import { getMonday, formatDate, addDays, isSameDay, parseDate } from "@/lib/date";
import CalendarHeader from "./calendar-header";
import CalendarDay from "./calendar-day";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function Calendar({ initialMonth }: { initialMonth?: string } = {}) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize on client to avoid hydration mismatch; resync when initialMonth changes
  useEffect(() => {
    if (initialMonth) {
      const d = parseDate(initialMonth);
      setCurrentMonth(new Date(d.getFullYear(), d.getMonth(), 1));
    } else {
      const now = new Date();
      setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
    }
  }, [initialMonth]);

  const fetchWorkouts = useCallback(
    async (month: Date, signal: AbortSignal) => {
      setLoading(true);
      setError(null);

      const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const gridStart = getMonday(firstOfMonth);
      const gridEnd = addDays(gridStart, 41);

      const { data, error: fetchError } = await supabase
        .from("workouts")
        .select("*")
        .gte("date", formatDate(gridStart))
        .lte("date", formatDate(gridEnd))
        .order("date");

      if (signal.aborted) return;

      if (fetchError) {
        setError(fetchError.message);
        setWorkouts([]);
      } else {
        setWorkouts(data ?? []);
      }
      setLoading(false);
    },
    []
  );

  useEffect(() => {
    if (!currentMonth) return;
    // Keep URL in sync so month is bookmarkable
    const monthStr = formatDate(currentMonth);
    const url = new URL(window.location.href);
    if (url.searchParams.get("month") !== monthStr) {
      url.searchParams.set("month", monthStr);
      window.history.replaceState(window.history.state, "", url.toString());
    }
    const controller = new AbortController();
    fetchWorkouts(currentMonth, controller.signal);
    return () => controller.abort();
  }, [currentMonth, fetchWorkouts]);

  const gridStart = useMemo(() => {
    if (!currentMonth) return null;
    const firstOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    return getMonday(firstOfMonth);
  }, [currentMonth]);

  const cells = useMemo(() => {
    if (!gridStart) return [];
    return Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));
  }, [gridStart]);

  const workoutsByDate = useMemo(() => {
    const map = new Map<string, WorkoutRow[]>();
    for (const w of workouts) {
      const arr = map.get(w.date);
      if (arr) arr.push(w);
      else map.set(w.date, [w]);
    }
    return map;
  }, [workouts]);

  const today = useMemo(() => new Date(), []);

  if (!currentMonth) {
    return <LoadingSkeleton />;
  }

  return (
    <div>
      <CalendarHeader
        currentMonth={currentMonth}
        onPrev={() =>
          setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
          )
        }
        onNext={() =>
          setCurrentMonth(
            new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
          )
        }
        onToday={() => {
          const now = new Date();
          setCurrentMonth(new Date(now.getFullYear(), now.getMonth(), 1));
        }}
      />

      {error && (
        <div className="mb-4 px-3 py-2 rounded border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Day-of-week labels */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-mono font-medium tracking-widest uppercase text-muted py-2"
          >
            {label}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-border bg-border">
        {loading ? (
          Array.from({ length: 42 }).map((_, i) => (
            <div
              key={i}
              className="skeleton min-h-[3.5rem] sm:min-h-[4.5rem]"
              style={{ animationDelay: `${(i % 7) * 50}ms` }}
            />
          ))
        ) : (
          cells.map((date, i) => {
            const key = formatDate(date);
            const dayWorkouts = workoutsByDate.get(key) ?? [];
            return (
              <div
                key={key}
                className="bg-surface"
                style={{
                  animation: `cell-in 0.2s ease-out ${(i % 7) * 30}ms both`,
                }}
              >
                <CalendarDay
                  date={date}
                  workouts={dayWorkouts}
                  isCurrentMonth={date.getMonth() === currentMonth.getMonth()}
                  isToday={isSameDay(date, today)}
                  onClick={() => router.push(`/?view=daily&date=${key}&month=${formatDate(currentMonth)}`)}
                />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-8 w-48 rounded" />
        <div className="flex gap-1">
          <div className="skeleton h-9 w-9 rounded" />
          <div className="skeleton h-9 w-16 rounded" />
          <div className="skeleton h-9 w-9 rounded" />
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px rounded-lg overflow-hidden border border-border bg-border">
        {Array.from({ length: 42 }).map((_, i) => (
          <div
            key={i}
            className="skeleton min-h-[3.5rem] sm:min-h-[4.5rem]"
            style={{ animationDelay: `${(i % 7) * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
