"use client";

import { Fragment, useMemo, useState } from "react";
import type { MealRow, MealItem } from "@/lib/types";
import SectionCard from "./section-card";

const MEAL_TYPE_COLORS: Record<string, string> = {
  breakfast: "bg-amber-500/20 text-amber-400",
  lunch: "bg-green-500/20 text-green-400",
  dinner: "bg-blue-500/20 text-blue-400",
  snack: "bg-purple-500/20 text-purple-400",
};

const MEAL_TYPE_ORDER: Record<string, number> = {
  breakfast: 0, lunch: 1, dinner: 2, snack: 3,
};

function MacroCell({ value, unit }: { value: number | null; unit: string }) {
  return (
    <td className="px-2 py-1 text-right text-xs font-mono text-foreground/80">
      {value != null ? <>{value}{unit && <span className="text-muted ml-0.5">{unit}</span>}</> : "--"}
    </td>
  );
}

function sortMeals(meals: MealRow[]): MealRow[] {
  return [...meals].sort((a, b) => {
    // Only compare by type when both meals have one; untyped meals use time order
    if (a.type && b.type) {
      const typeA = MEAL_TYPE_ORDER[a.type] ?? 99;
      const typeB = MEAL_TYPE_ORDER[b.type] ?? 99;
      if (typeA !== typeB) return typeA - typeB;
    }
    if (a.time && !b.time) return -1;
    if (!a.time && b.time) return 1;
    return (a.time ?? "").localeCompare(b.time ?? "");
  });
}

function parseMealItems(raw: unknown): MealItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is MealItem =>
    item != null && typeof item === "object" && typeof item.name === "string"
  );
}

export default function SectionMeals({ data }: { data: MealRow[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const sorted = useMemo(() => sortMeals(data), [data]);

  const totals = data.reduce(
    (acc, m) => ({
      protein: acc.protein + (m.protein_g ?? 0),
      fat: acc.fat + (m.fat_g ?? 0),
      carbs: acc.carbs + (m.carbs_g ?? 0),
      calories: acc.calories + (m.calories ?? 0),
    }),
    { protein: 0, fat: 0, carbs: 0, calories: 0 }
  );

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <SectionCard title="Meals" accent="#f97316" empty={data.length === 0}>
      {data.length > 0 && (
        <div className="overflow-x-auto -mx-4 px-4">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border/50">
                <th className="pb-2 text-[10px] font-mono uppercase tracking-wider text-muted font-semibold">Meal</th>
                <th className="pb-2 text-[10px] font-mono uppercase tracking-wider text-muted font-semibold text-right px-2">Protein</th>
                <th className="pb-2 text-[10px] font-mono uppercase tracking-wider text-muted font-semibold text-right px-2">Fat</th>
                <th className="pb-2 text-[10px] font-mono uppercase tracking-wider text-muted font-semibold text-right px-2">Carbs</th>
                <th className="pb-2 text-[10px] font-mono uppercase tracking-wider text-muted font-semibold text-right px-2">Cal</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((m) => {
                const items = parseMealItems(m.items);
                const hasItems = items.length > 0;
                const isExpanded = expanded.has(m.id);

                return (
                  <Fragment key={m.id}>
                    <tr
                      className={`border-b border-border/30 ${hasItems ? "cursor-pointer hover:bg-white/5" : ""}`}
                      onClick={hasItems ? () => toggleExpand(m.id) : undefined}
                    >
                      <td className="py-1.5">
                        <span className="text-sm font-mono text-foreground">{m.name ?? "Unnamed"}</span>
                        {m.type && (
                          <span className={`ml-2 px-1.5 py-0.5 rounded text-[10px] font-mono uppercase ${MEAL_TYPE_COLORS[m.type] ?? "bg-white/10 text-muted"}`}>
                            {m.type}
                          </span>
                        )}
                        {m.time && <span className="text-[10px] text-muted ml-2">{m.time}</span>}
                        {hasItems && (
                          <span className="text-[10px] text-muted ml-1.5">
                            {isExpanded ? "\u25BC" : "\u25B6"} {items.length}
                          </span>
                        )}
                      </td>
                      <MacroCell value={m.protein_g} unit="g" />
                      <MacroCell value={m.fat_g} unit="g" />
                      <MacroCell value={m.carbs_g} unit="g" />
                      <MacroCell value={m.calories} unit="" />
                    </tr>
                    {isExpanded && items.map((item, i) => (
                      <tr key={`${m.id}-item-${i}`} className="border-b border-border/20">
                        <td className="py-1 pl-4">
                          <span className="text-xs font-mono text-foreground/60">{item.name}</span>
                        </td>
                        <MacroCell value={item.protein_g ?? null} unit="g" />
                        <MacroCell value={item.fat_g ?? null} unit="g" />
                        <MacroCell value={item.carbs_g ?? null} unit="g" />
                        <MacroCell value={item.calories ?? null} unit="" />
                      </tr>
                    ))}
                  </Fragment>
                );
              })}
              <tr className="font-semibold">
                <td className="pt-2 text-xs font-mono text-muted uppercase tracking-wider">Total</td>
                <MacroCell value={totals.protein} unit="g" />
                <MacroCell value={totals.fat} unit="g" />
                <MacroCell value={totals.carbs} unit="g" />
                <MacroCell value={totals.calories} unit="" />
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}
