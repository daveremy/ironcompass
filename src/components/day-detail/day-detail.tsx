"use client";

import { useState, useEffect, useMemo } from "react";
import { fetchDayData, fetchStreak, fetchPersonalRecords, type DayData, type StreakResult, type PersonalRecord } from "@/lib/queries";
import { getWorkoutTypes, buildTypeLookup, type WorkoutTypeLookup } from "@/lib/workout-types";
import DayHeader from "./day-header";
import SectionVitals from "./section-vitals";
import SectionSleep from "./section-sleep";
import SectionFasting from "./section-fasting";
import SectionBP from "./section-bp";
import SectionWorkouts from "./section-workouts";
import SectionMeals from "./section-meals";
import SectionPullups from "./section-pullups";
import SectionSupplements from "./section-supplements";
import SectionBodyComp from "./section-body-comp";
import SectionCustomMetrics from "./section-custom-metrics";

const STREAK_LABELS: Record<string, string> = {
  "alcohol-free": "days alcohol-free",
  fasting: "days fasting",
  workout: "day workout streak",
  logging: "days logging",
};

const STREAK_METRICS = Object.keys(STREAK_LABELS);

// PR value extraction from day data
function extractPRValues(data: DayData): Record<string, number | null> {
  const vals: Record<string, number | null> = {};

  vals.pullups_max = data.pullups?.total_count ?? null;
  vals.sleep_hours = data.sleep?.hours ?? null;
  vals.sleep_oura = data.sleep?.oura_score ?? null;
  vals.weight_low = data.daily?.weight ?? null;
  vals.body_fat_low = data.bodyComp?.body_fat_pct ?? null;

  const completedWorkouts = data.workouts.filter((w) => w.completed !== false);
  const durations = completedWorkouts.filter((w) => w.duration_min != null).map((w) => w.duration_min!);
  vals.workout_longest = durations.length > 0 ? Math.max(...durations) : null;

  const hikes = completedWorkouts.filter((w) => w.type === "hike");
  const hikeDists = hikes.filter((w) => w.distance_mi != null).map((w) => w.distance_mi!);
  vals.hike_distance = hikeDists.length > 0 ? Math.max(...hikeDists) : null;
  const hikeElevs = hikes.filter((w) => w.elevation_ft != null).map((w) => w.elevation_ft!);
  vals.hike_elevation = hikeElevs.length > 0 ? Math.max(...hikeElevs) : null;

  const runs = completedWorkouts.filter((w) => w.type === "run");
  const runDists = runs.filter((w) => w.distance_mi != null).map((w) => w.distance_mi!);
  vals.run_distance = runDists.length > 0 ? Math.max(...runDists) : null;

  const mealsWithProtein = data.meals.filter((m) => m.protein_g != null);
  vals.protein_daily = mealsWithProtein.length > 0 ? mealsWithProtein.reduce((s, m) => s + m.protein_g!, 0) : null;

  const mealsWithCals = data.meals.filter((m) => m.calories != null);
  vals.calories_daily = mealsWithCals.length > 0 ? mealsWithCals.reduce((s, m) => s + m.calories!, 0) : null;

  return vals;
}

const MIN_TYPE_RECORDS = new Set(["weight_low", "body_fat_low"]);

function computePRBadges(data: DayData, records: PersonalRecord[]): PersonalRecord[] {
  if (records.length === 0) return [];
  const dayVals = extractPRValues(data);
  const badges: PersonalRecord[] = [];

  for (const rec of records) {
    const dayVal = dayVals[rec.key];
    if (dayVal == null) continue;
    if (MIN_TYPE_RECORDS.has(rec.key)) {
      if (dayVal <= rec.value) badges.push(rec);
    } else {
      if (dayVal >= rec.value) badges.push(rec);
    }
  }

  return badges;
}

export default function DayDetail({ date, backMonth }: { date: string; backMonth?: string }) {
  const [data, setData] = useState<DayData | null>(null);
  const [streaks, setStreaks] = useState<StreakResult[]>([]);
  const [records, setRecords] = useState<PersonalRecord[]>([]);
  const [typeLookup, setTypeLookup] = useState<WorkoutTypeLookup>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const typesPromise = getWorkoutTypes().catch(() => [] as Awaited<ReturnType<typeof getWorkoutTypes>>);
    const streaksPromise = Promise.all(
      STREAK_METRICS.map((m) => fetchStreak(m, date).catch(() => null))
    ).then((results) => results.filter((r): r is StreakResult => r != null && r.current_streak > 0));

    Promise.all([fetchDayData(date), typesPromise, streaksPromise])
      .then(([result, types, streakResults]) => {
        if (!controller.signal.aborted) {
          setData(result);
          setStreaks(streakResults);
          setTypeLookup(buildTypeLookup(types));
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => controller.abort();
  }, [date]);

  // Fetch records once (not dependent on date)
  useEffect(() => {
    fetchPersonalRecords()
      .then((result) => setRecords(result.records))
      .catch(() => setRecords([]));
  }, []);

  const prBadges = useMemo(() => {
    if (!data || records.length === 0) return [];
    return computePRBadges(data, records);
  }, [data, records]);

  if (loading) return <LoadingSkeleton date={date} backMonth={backMonth} />;

  if (error) {
    return (
      <div>
        <DayHeader date={date} backMonth={backMonth} />
        <div className="px-3 py-2 rounded border border-red-500/30 bg-red-500/5 text-red-400 text-xs font-mono">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div data-testid="day-detail" className="animate-slide-in">
      <DayHeader date={date} backMonth={backMonth} />
      {(streaks.length > 0 || prBadges.length > 0) && (
        <div className="flex flex-wrap gap-2 mb-3">
          {streaks.map((s) => (
            <span
              key={s.metric}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-accent/10 text-accent border border-accent/20"
            >
              <span className="font-bold">{s.current_streak}</span>
              <span className="text-accent/70">{STREAK_LABELS[s.metric] ?? s.metric}</span>
            </span>
          ))}
          {prBadges.map((pr) => (
            <span
              key={pr.key}
              data-testid={`pr-badge-${pr.key}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-amber-500/15 text-amber-400 border border-amber-500/30"
            >
              <span className="font-bold">PR</span>
              <span className="text-amber-400/70">{pr.label}</span>
            </span>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SectionVitals data={data!.daily} />
        <SectionSleep data={data!.sleep} />
        <SectionFasting data={data!.fasting} />
        <SectionBP data={data!.bloodPressure} />
        <div className="col-span-full">
          <SectionWorkouts data={data!.workouts} typeLookup={typeLookup} />
        </div>
        <div className="col-span-full">
          <SectionMeals data={data!.meals} />
        </div>
        <SectionPullups data={data!.pullups} />
        <SectionSupplements data={data!.supplements} />
        <div className="col-span-full">
          <SectionBodyComp data={data!.bodyComp} weight={data!.daily?.weight} />
        </div>
        <div className="col-span-full">
          <SectionCustomMetrics data={data!.customMetrics} />
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton({ date, backMonth }: { date: string; backMonth?: string }) {
  return (
    <div>
      <DayHeader date={date} backMonth={backMonth} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {Array.from({ length: 10 }).map((_, i) => (
          <div
            key={i}
            className={`skeleton rounded-lg h-32 ${[4, 5, 8, 9].includes(i) ? "col-span-full" : ""}`}
            style={{ animationDelay: `${i * 50}ms` }}
          />
        ))}
      </div>
    </div>
  );
}
