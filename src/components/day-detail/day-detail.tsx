"use client";

import { useState, useEffect } from "react";
import { fetchDayData, fetchStreak, type DayData, type StreakResult } from "@/lib/queries";
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

export default function DayDetail({ date, backMonth }: { date: string; backMonth?: string }) {
  const [data, setData] = useState<DayData | null>(null);
  const [streaks, setStreaks] = useState<StreakResult[]>([]);
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
      {streaks.length > 0 && (
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
