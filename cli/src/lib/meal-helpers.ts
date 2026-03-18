export interface MealItem {
  name: string;
  protein_g?: number | null;
  fat_g?: number | null;
  carbs_g?: number | null;
  calories?: number | null;
}

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

export function parseItemNum(itemIndex: number, field: string, raw: unknown): number | undefined {
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  if (!Number.isFinite(n)) throw new Error(`Item ${itemIndex} "${field}" must be a finite number, got "${raw}"`);
  return n;
}

export function parseMealItems(json: string): MealItem[] {
  const raw = JSON.parse(json);
  if (!Array.isArray(raw)) throw new Error("--items must be a JSON array");
  return raw.map((item: any, i: number) => {
    if (!item?.name || typeof item.name !== "string") throw new Error(`Item ${i} missing "name" string`);
    return {
      name: item.name,
      protein_g: parseItemNum(i, "protein_g", item.protein_g),
      fat_g: parseItemNum(i, "fat_g", item.fat_g),
      carbs_g: parseItemNum(i, "carbs_g", item.carbs_g),
      calories: parseItemNum(i, "calories", item.calories),
    };
  });
}

export function sumItems(items: MealItem[]) {
  const sums = { protein_g: 0, fat_g: 0, carbs_g: 0, calories: 0 };
  const counts = { protein_g: 0, fat_g: 0, carbs_g: 0, calories: 0 };
  for (const item of items) {
    for (const k of ["protein_g", "fat_g", "carbs_g", "calories"] as const) {
      const v = item[k];
      if (v != null) { sums[k] += v; counts[k]++; }
    }
  }
  return {
    protein_g: counts.protein_g > 0 ? sums.protein_g : undefined,
    fat_g: counts.fat_g > 0 ? sums.fat_g : undefined,
    carbs_g: counts.carbs_g > 0 ? sums.carbs_g : undefined,
    calories: counts.calories > 0 ? sums.calories : undefined,
  };
}
