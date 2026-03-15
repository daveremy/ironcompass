import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { config } from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import type { Database } from "./types/database.js";

let _client: SupabaseClient<Database> | null = null;

export function getSupabase(): SupabaseClient<Database> {
  if (_client) return _client;

  const __dirname = dirname(fileURLToPath(import.meta.url));
  config({ path: resolve(__dirname, "../.env.local") });
  config({ path: resolve(__dirname, "../../.env.local") });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing SUPABASE_URL/NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Set in environment or .env.local"
    );
  }

  _client = createClient<Database>(url, key);
  return _client;
}

type TableName = Exclude<keyof Database["public"]["Tables"], "workout_types" | "weekly_plan" | "metric_definitions">;

export function throwIfError({ error }: { error: any }) {
  if (error) throw new Error(`Database error: ${error.message}`);
}

export async function upsertRow(table: TableName, payload: Record<string, unknown>) {
  const { data, error } = await getSupabase()
    .from(table)
    .upsert(payload as any, { onConflict: "date" })
    .select()
    .single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
}

export async function insertRow(table: TableName, payload: Record<string, unknown>) {
  const { data, error } = await getSupabase()
    .from(table)
    .insert(payload as any)
    .select()
    .single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
}

export async function deleteRowById(table: TableName, id: string) {
  const { data, error } = await getSupabase()
    .from(table)
    .delete()
    .eq("id", id)
    .select()
    .single();
  if (error) throw new Error(`Database error: ${error.message}`);
  return data;
}
