"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getMonday, formatDate, addDays, parseDate, SHORT_DAYS } from "@/lib/date";
import { fetchWeekData, fetchPlanStatus, type PlanStatusResult } from "@/lib/queries";
import { getWorkoutStatus, type WorkoutStatus } from "@/lib/workout-status";
import type { WeekData, DaySummary } from "@/lib/types";
import { getWorkoutTypes, buildTypeLookup, FALLBACK_COLOR, type WorkoutTypeLookup } from "@/lib/workout-types";
import WeeklyHeader from "./weekly-header";
import PlanProgressCard from "./plan-progress-card";
import SectionCard from "@/components/day-detail/section-card";
import WorkoutTypeBadge from "@/components/ui/workout-type-badge";

const SECTIONS = [
  { key: "vitals", label: "Vitals", accent: "#22c55e" },
  { key: "sleep", label: "Sleep", accent: "#a855f7" },
  { key: "workouts", label: "Workouts", accent: "#3b82f6" },
  { key: "nutrition", label: "Nutrition", accent: "#f97316" },
  { key: "fasting", label: "Fasting", accent: "#06b6d4" },
  { key: "pullups", label: "Pullups", accent: "#eab308" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export default function WeeklyView({ date, backMonth }: { date?: string; backMonth?: string }) {
  const router = useRouter();
  const [monday, setMonday] = useState<Date | null>(null);
  const [hasNavigated, setHasNavigated] = useState(false);
  const [data, setData] = useState<WeekData | null>(null);
  const [planStatus, setPlanStatus] = useState<PlanStatusResult | null>(null);
  const [typeLookup, setTypeLookup] = useState<WorkoutTypeLookup>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch workout types once
  useEffect(() => {
    getWorkoutTypes().then((types) => setTypeLookup(buildTypeLookup(types))).catch(() => {});
  }, []);

  useEffect(() => {
    const base = date ? parseDate(date) : new Date();
    setMonday(getMonday(base));
  }, [date]);

  const mondayStr = useMemo(() => (monday ? formatDate(monday) : null), [monday]);
  const sunday = useMemo(() => (monday ? addDays(monday, 6) : null), [monday]);

  // Sync URL (date + month)
  useEffect(() => {
    if (!mondayStr || !monday) return;
    const url = new URL(window.location.href);
    const monthStr = formatDate(new Date(monday.getFullYear(), monday.getMonth(), 1));
    if (url.searchParams.get("date") !== mondayStr || url.searchParams.get("month") !== monthStr) {
      url.searchParams.set("view", "weekly");
      url.searchParams.set("date", mondayStr);
      url.searchParams.set("month", monthStr);
      window.history.replaceState(window.history.state, "", url.toString());
    }
  }, [mondayStr, monday]);

  const loadData = useCallback(async (start: string, signal: AbortSignal) => {
    setLoading(true);
    setError(null);
    try {
      const [result, plan] = await Promise.all([
        fetchWeekData(start),
        fetchPlanStatus(start).catch(() => null),
      ]);
      if (!signal.aborted) { setData(result); setPlanStatus(plan); setLoading(false); }
    } catch (err) {
      if (!signal.aborted) { setData(null); setPlanStatus(null); setError(err instanceof Error ? err.message : "Failed to load"); setLoading(false); }
    }
  }, []);

  useEffect(() => {
    if (!mondayStr) return;
    const controller = new AbortController();
    loadData(mondayStr, controller.signal);
    return () => controller.abort();
  }, [mondayStr, loadData]);

  const navigate = useCallback((offset: number) => {
    setHasNavigated(true);
    setMonday((prev) => (prev ? addDays(prev, offset) : null));
  }, []);

  const today = useMemo(() => formatDate(new Date()), []);

  if (!monday || !sunday) return <LoadingSkeleton />;

  const calendarMonth = backMonth && !hasNavigated
    ? backMonth
    : formatDate(new Date(monday.getFullYear(), monday.getMonth(), 1));

  return (
    <div data-testid="weekly-view" className="animate-slide-in">
      <div className="mb-3">
        <Link href={`/?month=${calendarMonth}`} className="text-xs font-mono text-muted hover:text-accent transition-colors">
          &larr; Calendar
        </Link>
      </div>

      <WeeklyHeader
        monday={monday}
        sunday={sunday}
        onPrev={() => navigate(-7)}
        onNext={() => navigate(7)}
        onThisWeek={() => { setHasNavigated(true); setMonday(getMonday(new Date())); }}
      />

      {error && (
        <div className="mb-4 px-3 py-2 rounded border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">{error}</div>
      )}

      {loading ? (
        <LoadingGrid />
      ) : data ? (
        <>
          {/* Day columns grid */}
          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="min-w-[900px] px-4 sm:px-0">
              {/* Column headers */}
              <div className="grid grid-cols-[repeat(7,1fr)_minmax(10rem,1fr)] gap-px mb-px">
                {data.days.map((day, i) => {
                  const isToday = day.date === today;
                  return (
                    <button
                      key={day.date}
                      onClick={() => router.push(`/?view=daily&date=${day.date}&month=${day.date.slice(0, 7)}-01`)}
                      className={`text-center py-2 rounded-t-lg transition-colors hover:bg-surface-hover ${isToday ? "bg-accent/5" : "bg-surface"}`}
                    >
                      <div className="text-[10px] font-mono font-medium tracking-widest uppercase text-muted">{SHORT_DAYS[i]}</div>
                      <div className={`text-sm font-mono ${isToday ? "text-accent font-bold" : "text-foreground"}`}>
                        {parseInt(day.date.slice(8))}
                      </div>
                    </button>
                  );
                })}
                <div className="text-center py-2 bg-accent/5 rounded-t-lg">
                  <div className="text-[10px] font-mono font-medium tracking-widest uppercase text-accent">Summary</div>
                  <div className="text-sm font-mono text-accent font-bold">WK</div>
                </div>
              </div>

              {/* Sections grid — each section is a row spanning all 8 columns */}
              <div className="rounded-b-lg overflow-hidden border border-border bg-border flex flex-col gap-px">
                {SECTIONS.map((section) => (
                  <div key={section.key} className="grid grid-cols-[repeat(7,1fr)_minmax(10rem,1fr)] gap-px">
                    {data.days.map((day, i) => (
                      <div
                        key={day.date}
                        className="bg-surface px-2 py-2 min-h-[3rem]"
                        style={i === 0 ? { borderLeft: `2px solid ${section.accent}` } : undefined}
                      >
                        {i === 0 && (
                          <div className="text-[9px] font-mono font-semibold tracking-[0.15em] uppercase mb-1" style={{ color: section.accent }}>
                            {section.label}
                          </div>
                        )}
                        <DayCell section={section.key} day={day} typeLookup={typeLookup} today={today} />
                      </div>
                    ))}
                    <div className="bg-accent/[0.03] px-2 py-2 min-h-[3rem]">
                      <SummaryCell section={section.key} summary={data.summary} typeLookup={typeLookup} planStatus={planStatus} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary cards */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            {planStatus && <PlanProgressCard planStatus={planStatus} typeLookup={typeLookup} />}
            <WorkoutSectionCard data={data} typeLookup={typeLookup} planStatus={planStatus} />
            <NutritionSectionCard data={data} />
            <SleepSectionCard data={data} />
            <HighlightsCard data={data} />
          </div>
        </>
      ) : null}
    </div>
  );
}

// ─── Grid Cells ──────────────────────────────────────

function DayCell({ section, day, typeLookup, today }: { section: SectionKey; day: DaySummary; typeLookup: WorkoutTypeLookup; today: string }) {
  switch (section) {
    case "vitals":
      if (day.weight == null && day.energy == null && day.alcohol == null)
        return <Empty />;
      return (
        <div className="space-y-0.5">
          {day.weight != null && <Val v={day.weight} u="lbs" />}
          {day.energy != null && <div><Val v={`${day.energy}/5`} u="nrg" /></div>}
          {day.alcohol != null && (
            <div className={`text-[10px] font-mono ${day.alcohol ? "text-red-400" : "text-green-400"}`}>
              {day.alcohol ? "Alcohol" : "No alc"}
            </div>
          )}
        </div>
      );
    case "sleep":
      if (day.sleepHours == null) return <Empty />;
      return (
        <div className="space-y-0.5">
          <Val v={day.sleepHours.toFixed(1)} u="h" />
          {day.ouraScore != null && <div className="text-[10px] font-mono text-muted">Oura {day.ouraScore}</div>}
          {day.appleScore != null && <div className="text-[10px] font-mono text-muted">Apple {day.appleScore}</div>}
        </div>
      );
    case "workouts":
      if (day.workouts.length === 0) return <Empty />;
      return (
        <div className="flex flex-col gap-1">
          {day.workouts.map((w) => {
            const status = getWorkoutStatus(w, today);
            const isPlannedOnly = status === "scheduled" || status === "skipped";
            const isSkipped = status === "skipped";
            return (
              <div key={w.id} className={`flex items-center gap-1 ${isSkipped ? "opacity-40 line-through" : ""}`}>
                <span
                  className="w-1.5 h-1.5 rounded-full shrink-0"
                  style={isPlannedOnly && !isSkipped
                    ? { border: `1px solid ${typeLookup[w.type]?.color ?? FALLBACK_COLOR}`, backgroundColor: "transparent" }
                    : { backgroundColor: isSkipped ? "#737373" : (typeLookup[w.type]?.color ?? FALLBACK_COLOR) }
                  }
                />
                <span className="text-[10px] font-mono text-foreground/80 truncate">{typeLookup[w.type]?.displayName ?? w.type}</span>
                {w.duration_min != null && <span className="text-[10px] font-mono text-muted">{w.duration_min}m</span>}
              </div>
            );
          })}
        </div>
      );
    case "nutrition":
      if (day.totalProtein == null && day.totalCalories == null) return <Empty />;
      return (
        <div className="space-y-0.5">
          {day.totalProtein != null && <Val v={Math.round(day.totalProtein)} u="g P" />}
          {day.totalCalories != null && <div className="text-[10px] font-mono text-muted">{Math.round(day.totalCalories)} cal</div>}
        </div>
      );
    case "fasting":
      if (day.fastingCompliant == null) return <Empty />;
      return (
        <span className={`text-xs font-mono ${day.fastingCompliant ? "text-green-400" : "text-red-400"}`}>
          {day.fastingCompliant ? "\u2713" : "\u2717"}
        </span>
      );
    case "pullups":
      if (day.pullups == null) return <Empty />;
      return <Val v={day.pullups} />;
  }
}

function SummaryCell({ section, summary, typeLookup, planStatus }: { section: SectionKey; summary: WeekData["summary"]; typeLookup: WorkoutTypeLookup; planStatus?: PlanStatusResult | null }) {
  switch (section) {
    case "vitals":
      return (
        <div className="space-y-0.5">
          {summary.weight.delta != null ? <Delta v={summary.weight.delta} u="lbs" /> : <Empty />}
          {summary.alcohol.daysWithout > 0 && (
            <div className="text-[10px] font-mono text-green-400">{summary.alcohol.daysWithout} alc-free</div>
          )}
        </div>
      );
    case "sleep":
      if (summary.sleep.avgHours == null) return <Empty />;
      return (
        <div className="space-y-0.5">
          <Val v={summary.sleep.avgHours.toFixed(1)} u="h avg" />
          {summary.sleep.avgOura != null && <div className="text-[10px] font-mono text-muted">Oura {Math.round(summary.sleep.avgOura)} avg</div>}
        </div>
      );
    case "workouts": {
      const completedCount = summary.workouts.total;
      const plannedTotal = planStatus?.summary.planned ?? 0;
      if (completedCount === 0 && plannedTotal === 0) return <Empty />;
      return (
        <div>
          {plannedTotal > 0
            ? <Val v={`${planStatus?.summary.completed ?? completedCount}/${plannedTotal}`} u="done" />
            : <Val v={completedCount} u="total" />
          }
          <div className="flex flex-wrap gap-1 mt-1">
            {summary.workouts.types.map((t) => (
              <span key={t} className="w-2 h-2 rounded-full" style={{ backgroundColor: typeLookup[t]?.color ?? FALLBACK_COLOR }} />
            ))}
          </div>
        </div>
      );
    }
    case "nutrition":
      if (summary.meals.avgDailyProtein == null && summary.meals.avgDailyCalories == null) return <Empty />;
      return (
        <div className="space-y-0.5">
          {summary.meals.avgDailyProtein != null && <Val v={Math.round(summary.meals.avgDailyProtein)} u="g avg" />}
          {summary.meals.avgDailyCalories != null && (
            <div className="text-[10px] font-mono text-muted">{Math.round(summary.meals.avgDailyCalories)} cal avg</div>
          )}
        </div>
      );
    case "fasting":
      if (summary.fasting.totalDays === 0) return <Empty />;
      return <Val v={`${summary.fasting.compliantDays}/${summary.fasting.totalDays}`} />;
    case "pullups":
      if (summary.pullups.total === 0) return <Empty />;
      return (
        <div className="space-y-0.5">
          <Val v={summary.pullups.total} u="total" />
          <div className="text-[10px] font-mono text-muted">{summary.pullups.days} day{summary.pullups.days !== 1 ? "s" : ""}</div>
        </div>
      );
  }
}

// ─── Summary Cards ──────────────────────────────────

function ExpandToggle({ expanded, onToggle }: { expanded: boolean; onToggle: () => void }) {
  return (
    <button onClick={onToggle} className="text-[10px] font-mono text-accent hover:text-accent/80 transition-colors">
      {expanded ? "\u25B2 Hide" : "\u25BC Details"}
    </button>
  );
}

function WorkoutSectionCard({ data, typeLookup, planStatus }: { data: WeekData; typeLookup: WorkoutTypeLookup; planStatus?: PlanStatusResult | null }) {
  const [expanded, setExpanded] = useState(false);
  const { summary, days } = data;
  const allWorkouts = days.flatMap((d) => d.workouts.map((w) => ({ ...w, dayDate: d.date })));

  if (summary.workouts.total === 0) {
    return (
      <SectionCard title="Workouts" accent="#3b82f6">
        <p className="text-sm text-muted/50 font-mono">No workouts</p>
      </SectionCard>
    );
  }

  return (
    <SectionCard title="Workouts" accent="#3b82f6">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-mono text-foreground">
          {planStatus
            ? <>{planStatus.summary.completed}/{planStatus.summary.planned} completed</>
            : <>{summary.workouts.total} workout{summary.workouts.total !== 1 ? "s" : ""}</>
          }
          <span className="text-muted ml-1">&middot; {summary.workouts.types.length} type{summary.workouts.types.length !== 1 ? "s" : ""}</span>
        </p>
        <ExpandToggle expanded={expanded} onToggle={() => setExpanded(!expanded)} />
      </div>
      <div className="flex flex-wrap gap-1 mb-2">
        {summary.workouts.types.map((t) => <WorkoutTypeBadge key={t} type={t} color={typeLookup[t]?.color} displayName={typeLookup[t]?.displayName} />)}
      </div>
      {expanded && (
        <div className="mt-3 border-t border-border pt-3 space-y-2">
          {allWorkouts.map((w) => (
            <div key={w.id} className="flex items-center gap-2 text-xs font-mono">
              <span className="text-muted w-12">{w.dayDate.slice(5)}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: typeLookup[w.type]?.color ?? FALLBACK_COLOR }} />
              <span className="text-foreground/80">{typeLookup[w.type]?.displayName ?? w.type}</span>
              {w.duration_min != null && <span className="text-muted">{w.duration_min}m</span>}
              {w.distance_mi != null && <span className="text-muted">{w.distance_mi}mi</span>}
              {w.calories != null && <span className="text-muted">{w.calories}cal</span>}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function NutritionSectionCard({ data }: { data: WeekData }) {
  const [expanded, setExpanded] = useState(false);
  const { summary, days } = data;
  const daysWithMeals = days.filter((d) => d.totalProtein != null || d.totalCalories != null);

  if (summary.meals.avgDailyProtein == null && summary.meals.avgDailyCalories == null) {
    return (
      <SectionCard title="Nutrition" accent="#f97316">
        <p className="text-sm text-muted/50 font-mono">No meals logged</p>
      </SectionCard>
    );
  }

  const bestCalDay = daysWithMeals.reduce<DaySummary | null>((best, d) =>
    d.totalCalories != null && (best == null || (best.totalCalories ?? 0) < d.totalCalories) ? d : best, null);

  return (
    <SectionCard title="Nutrition" accent="#f97316">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-mono text-foreground">
          {summary.meals.avgDailyProtein != null && <>{Math.round(summary.meals.avgDailyProtein)}g P</>}
          {summary.meals.avgDailyCalories != null && <span className="text-muted ml-1">{summary.meals.avgDailyProtein != null && <>&middot; </>}{Math.round(summary.meals.avgDailyCalories)} cal avg</span>}
        </p>
        {daysWithMeals.length > 0 && (
          <ExpandToggle expanded={expanded} onToggle={() => setExpanded(!expanded)} />
        )}
      </div>
      {bestCalDay && (
        <p className="text-[10px] font-mono text-muted">
          Best: {SHORT_DAYS[days.indexOf(bestCalDay)]} {bestCalDay.totalCalories != null && Math.round(bestCalDay.totalCalories)} cal
        </p>
      )}
      {expanded && (
        <div className="mt-3 border-t border-border pt-3">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-muted text-left">
                <th className="pb-1 font-medium">Day</th>
                <th className="pb-1 font-medium text-right">Protein</th>
                <th className="pb-1 font-medium text-right">Calories</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={d.date} className="border-t border-border/50">
                  <td className="py-1 text-muted">{SHORT_DAYS[i]}</td>
                  <td className="py-1 text-right text-foreground/80">{d.totalProtein != null ? `${Math.round(d.totalProtein)}g` : "--"}</td>
                  <td className="py-1 text-right text-foreground/80">{d.totalCalories != null ? Math.round(d.totalCalories) : "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function SleepSectionCard({ data }: { data: WeekData }) {
  const [expanded, setExpanded] = useState(false);
  const { summary, days } = data;
  const daysWithSleep = days.filter((d) => d.sleepHours != null);

  if (summary.sleep.avgHours == null) {
    return (
      <SectionCard title="Sleep" accent="#a855f7">
        <p className="text-sm text-muted/50 font-mono">No sleep data</p>
      </SectionCard>
    );
  }

  const bestSleepDay = daysWithSleep.reduce<DaySummary | null>((best, d) =>
    d.sleepHours != null && (best == null || (best.sleepHours ?? 0) < d.sleepHours) ? d : best, null);

  return (
    <SectionCard title="Sleep" accent="#a855f7">
      <div className="flex items-baseline justify-between mb-2">
        <p className="text-sm font-mono text-foreground">
          {summary.sleep.avgHours.toFixed(1)}h avg
          {summary.sleep.avgOura != null && <span className="text-muted ml-1">&middot; Oura {Math.round(summary.sleep.avgOura)}</span>}
        </p>
        {daysWithSleep.length > 0 && (
          <ExpandToggle expanded={expanded} onToggle={() => setExpanded(!expanded)} />
        )}
      </div>
      {bestSleepDay && (
        <p className="text-[10px] font-mono text-muted">
          Best: {SHORT_DAYS[days.indexOf(bestSleepDay)]} {bestSleepDay.sleepHours?.toFixed(1)}h
        </p>
      )}
      {expanded && (
        <div className="mt-3 border-t border-border pt-3">
          <table className="w-full text-xs font-mono">
            <thead>
              <tr className="text-muted text-left">
                <th className="pb-1 font-medium">Day</th>
                <th className="pb-1 font-medium text-right">Hours</th>
                <th className="pb-1 font-medium text-right">Oura</th>
                <th className="pb-1 font-medium text-right">Apple</th>
              </tr>
            </thead>
            <tbody>
              {days.map((d, i) => (
                <tr key={d.date} className="border-t border-border/50">
                  <td className="py-1 text-muted">{SHORT_DAYS[i]}</td>
                  <td className="py-1 text-right text-foreground/80">{d.sleepHours != null ? d.sleepHours.toFixed(1) : "--"}</td>
                  <td className="py-1 text-right text-foreground/80">{d.ouraScore ?? "--"}</td>
                  <td className="py-1 text-right text-foreground/80">{d.appleScore ?? "--"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}

function HighlightsCard({ data }: { data: WeekData }) {
  const { summary } = data;
  return (
    <SectionCard title="Highlights" accent="#22c55e">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-0.5">Weight</p>
          {summary.weight.first != null && summary.weight.last != null ? (
            <p className="text-sm font-mono text-foreground">
              {summary.weight.first} &rarr; {summary.weight.last}
              {summary.weight.delta != null && (
                <span className={`ml-1 ${summary.weight.delta > 0 ? "text-red-400" : "text-green-400"}`}>
                  ({summary.weight.delta > 0 ? "+" : ""}{summary.weight.delta.toFixed(1)})
                </span>
              )}
            </p>
          ) : (
            <p className="text-sm font-mono text-muted/50">--</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-0.5">Fasting</p>
          {summary.fasting.totalDays > 0 ? (
            <p className="text-sm font-mono text-foreground">
              {summary.fasting.compliantDays}/{summary.fasting.totalDays} compliant
            </p>
          ) : (
            <p className="text-sm font-mono text-muted/50">--</p>
          )}
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-0.5">Alcohol-free</p>
          <p className="text-sm font-mono text-foreground">
            {(summary.alcohol.daysWith + summary.alcohol.daysWithout) > 0
              ? `${summary.alcohol.daysWithout} day${summary.alcohol.daysWithout !== 1 ? "s" : ""}`
              : <span className="text-muted/50">--</span>}
          </p>
        </div>
        <div>
          <p className="text-[10px] font-mono uppercase tracking-wider text-muted mb-0.5">Pullups</p>
          <p className="text-sm font-mono text-foreground">
            {summary.pullups.total > 0
              ? <>{summary.pullups.total} <span className="text-muted">({summary.pullups.days} day{summary.pullups.days !== 1 ? "s" : ""})</span></>
              : <span className="text-muted/50">--</span>}
          </p>
        </div>
      </div>
    </SectionCard>
  );
}

// ─── Helpers ──────────────────────────────────────────

function Val({ v, u }: { v: string | number; u?: string }) {
  return (
    <span className="text-xs font-mono text-foreground">
      {v}{u && <span className="text-muted ml-0.5">{u}</span>}
    </span>
  );
}

function Delta({ v, u }: { v: number; u?: string }) {
  const positive = v > 0;
  return (
    <span className={`text-xs font-mono ${positive ? "text-red-400" : "text-green-400"}`}>
      {positive ? "+" : ""}{v.toFixed(1)}{u && <span className="text-muted ml-0.5">{u}</span>}
    </span>
  );
}

function Empty() {
  return <span className="text-[10px] font-mono text-muted/20">--</span>;
}

// ─── Loading States ──────────────────────────────────

function LoadingSkeleton() {
  return (
    <div>
      <div className="skeleton h-4 w-20 rounded mb-3" />
      <div className="flex items-center justify-between mb-4">
        <div className="skeleton h-8 w-64 rounded" />
        <div className="flex gap-1">
          <div className="skeleton h-9 w-9 rounded" />
          <div className="skeleton h-9 w-24 rounded" />
          <div className="skeleton h-9 w-9 rounded" />
        </div>
      </div>
      <LoadingGrid />
    </div>
  );
}

function LoadingGrid() {
  return (
    <div className="overflow-x-auto -mx-4 sm:mx-0">
      <div className="min-w-[900px] px-4 sm:px-0">
        <div className="grid grid-cols-[repeat(7,1fr)_minmax(10rem,1fr)] gap-px rounded-lg overflow-hidden border border-border bg-border">
          {Array.from({ length: 48 }).map((_, i) => (
            <div key={i} className="skeleton min-h-[3rem]" style={{ animationDelay: `${(i % 8) * 40}ms` }} />
          ))}
        </div>
      </div>
    </div>
  );
}
