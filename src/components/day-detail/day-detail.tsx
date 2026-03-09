"use client";

import { useState, useEffect } from "react";
import { fetchDayData, type DayData } from "@/lib/queries";
import { getWorkoutTypes, buildColorMap } from "@/lib/workout-types";
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

export default function DayDetail({ date, backMonth }: { date: string; backMonth?: string }) {
  const [data, setData] = useState<DayData | null>(null);
  const [colorMap, setColorMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);

    const typesPromise = getWorkoutTypes().catch(() => [] as Awaited<ReturnType<typeof getWorkoutTypes>>);

    Promise.all([fetchDayData(date), typesPromise])
      .then(([result, types]) => {
        if (!controller.signal.aborted) {
          setData(result);
          setColorMap(buildColorMap(types));
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
    <div className="animate-slide-in">
      <DayHeader date={date} backMonth={backMonth} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <SectionVitals data={data!.daily} />
        <SectionSleep data={data!.sleep} />
        <SectionFasting data={data!.fasting} />
        <SectionBP data={data!.bloodPressure} />
        <div className="col-span-full">
          <SectionWorkouts data={data!.workouts} colorMap={colorMap} />
        </div>
        <div className="col-span-full">
          <SectionMeals data={data!.meals} />
        </div>
        <SectionPullups data={data!.pullups} />
        <SectionSupplements data={data!.supplements} />
        <div className="col-span-full">
          <SectionBodyComp data={data!.bodyComp} />
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
