import type { MealRow } from "@/lib/types";
import SectionCard from "./section-card";

function MacroCell({ value, unit }: { value: number | null; unit: string }) {
  return (
    <td className="px-2 py-1 text-right text-xs font-mono text-foreground/80">
      {value != null ? <>{value}{unit && <span className="text-muted ml-0.5">{unit}</span>}</> : "--"}
    </td>
  );
}

export default function SectionMeals({ data }: { data: MealRow[] }) {
  const totals = data.reduce(
    (acc, m) => ({
      protein: acc.protein + (m.protein_g ?? 0),
      fat: acc.fat + (m.fat_g ?? 0),
      carbs: acc.carbs + (m.carbs_g ?? 0),
      calories: acc.calories + (m.calories ?? 0),
    }),
    { protein: 0, fat: 0, carbs: 0, calories: 0 }
  );

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
              {data.map((m) => (
                <tr key={m.id} className="border-b border-border/30">
                  <td className="py-1.5">
                    <span className="text-sm font-mono text-foreground">{m.name ?? "Unnamed"}</span>
                    {m.time && <span className="text-[10px] text-muted ml-2">{m.time}</span>}
                  </td>
                  <MacroCell value={m.protein_g} unit="g" />
                  <MacroCell value={m.fat_g} unit="g" />
                  <MacroCell value={m.carbs_g} unit="g" />
                  <MacroCell value={m.calories} unit="" />
                </tr>
              ))}
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
