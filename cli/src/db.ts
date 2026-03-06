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
