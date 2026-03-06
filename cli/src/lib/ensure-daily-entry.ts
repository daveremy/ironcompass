import { getSupabase } from "../db.js";

export async function ensureDailyEntry(date: string): Promise<void> {
  const { error } = await getSupabase()
    .from("daily_entries")
    .upsert({ date }, { onConflict: "date", ignoreDuplicates: true });

  if (error) {
    throw new Error(`Failed to ensure daily entry: ${error.message}`);
  }
}
