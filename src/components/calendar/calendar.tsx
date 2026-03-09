"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { fetchWeekSummaries } from "@/lib/queries";
import type { WorkoutRow, WeekSummary } from "@/lib/types";
import { getWorkoutTypes, buildColorMap } from "@/lib/workout-types";
import { getMonday, formatDate, addDays, isSameDay, parseDate, SHORT_DAYS } from "@/lib/date";
import CalendarHeader from "./calendar-header";
import CalendarDay from "./calendar-day";
import CalendarWeekSummary from "./calendar-week-summary";

export default function Calendar({ initialMonth }: { initialMonth?: string } = {}) {
  const router = useRouter();
  const [currentMonth, setCurrentMonth] = useState<Date | null>(null);
  const [workouts, setWorkouts] = useState<WorkoutRow[]>([]);
  const [weekSummaries, setWeekSummaries] = useState<Map<string, WeekSummary>>(new Map());
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workout types once
  useEffect(() => {
    getWorkoutTypes().then((types) => setColorMap(buildColorMap(types))).catch(() => {});
  }, []);

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

  const fetchData = useCallback(
    async (month: Date, signal: AbortSignal) => {
      setLoading(true);
      setError(null);

      const firstOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
      const gridStart = getMonday(firstOfMonth);
      const gridEnd = addDays(gridStart, 41);
      const gridStartStr = formatDate(gridStart);
      const gridEndStr = formatDate(gridEnd);

      const [workoutsResult, summariesResult] = await Promise.allSettled([
        supabase
          .from("workouts")
          .select("*")
          .gte("date", gridStartStr)
          .lte("date", gridEndStr)
          .order("date"),
        fetchWeekSummaries(gridStartStr, gridEndStr),
      ]);

      if (signal.aborted) return;

      // Workouts
      if (workoutsResult.status === "fulfilled") {
        const { data, error: fetchError } = workoutsResult.value;
        if (fetchError) {
          setError(fetchError.message);
          setWorkouts([]);
        } else {
          setWorkouts(data ?? []);
        }
      } else {
        setError("Failed to fetch workouts");
        setWorkouts([]);
      }

      // Week summaries — independent, don't block calendar
      if (summariesResult.status === "fulfilled") {
        setWeekSummaries(summariesResult.value);
      } else {
        setWeekSummaries(new Map());
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
    fetchData(currentMonth, controller.signal);
    return () => controller.abort();
  }, [currentMonth, fetchData]);

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

  // Build rows of 7 days + 1 summary
  const rows: Date[][] = [];
  for (let i = 0; i < 42; i += 7) {
    rows.push(cells.slice(i, i + 7));
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
      <div className="grid grid-cols-7 sm:grid-cols-[repeat(7,1fr)_4rem] mb-1">
        {SHORT_DAYS.map((label) => (
          <div
            key={label}
            className="text-center text-[10px] font-mono font-medium tracking-widest uppercase text-muted py-2"
          >
            {label}
          </div>
        ))}
        <div className="hidden sm:block text-center text-[10px] font-mono font-medium tracking-widest uppercase text-muted py-2">
          WK
        </div>
      </div>

      {/* Calendar grid */}
      <div data-testid="calendar-grid" className="grid grid-cols-7 sm:grid-cols-[repeat(7,1fr)_4rem] gap-px rounded-lg overflow-hidden border border-border bg-border">
        {loading ? (
          Array.from({ length: 48 }).map((_, i) => (
            <div
              key={i}
              className={`skeleton min-h-[3.5rem] sm:min-h-[4.5rem] ${i % 8 === 7 ? "hidden sm:block" : ""}`}
              style={{ animationDelay: `${(i % 8) * 50}ms` }}
            />
          ))
        ) : (
          rows.map((week, rowIndex) => {
            const mondayStr = formatDate(week[0]);
            const summary = weekSummaries.get(mondayStr);
            return [
              ...week.map((date, dayIndex) => {
                const key = formatDate(date);
                const dayWorkouts = workoutsByDate.get(key) ?? [];
                return (
                  <div
                    key={key}
                    className="bg-surface"
                    style={{
                      animation: `cell-in 0.2s ease-out ${dayIndex * 30}ms both`,
                    }}
                  >
                    <CalendarDay
                      date={date}
                      workouts={dayWorkouts}
                      colorMap={colorMap}
                      isCurrentMonth={date.getMonth() === currentMonth.getMonth()}
                      isToday={isSameDay(date, today)}
                      onClick={() => router.push(`/?view=daily&date=${key}&month=${formatDate(currentMonth)}`)}
                    />
                  </div>
                );
              }),
              <div
                key={`wk-${rowIndex}`}
                className="hidden sm:block bg-surface"
                style={{
                  animation: `cell-in 0.2s ease-out 210ms both`,
                }}
              >
                <CalendarWeekSummary monday={mondayStr} month={formatDate(currentMonth)} summary={summary} />
              </div>,
            ];
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
      <div className="grid grid-cols-7 sm:grid-cols-[repeat(7,1fr)_4rem] gap-px rounded-lg overflow-hidden border border-border bg-border">
        {Array.from({ length: 48 }).map((_, i) => (
          <div
            key={i}
            className={`skeleton min-h-[3.5rem] sm:min-h-[4.5rem] ${i % 8 === 7 ? "hidden sm:block" : ""}`}
            style={{ animationDelay: `${(i % 8) * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
