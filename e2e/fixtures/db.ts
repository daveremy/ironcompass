import { config } from "dotenv";
import path from "path";
import { createClient } from "@supabase/supabase-js";
import {
  TEST_DATE,
  DAILY_ENTRY,
  SLEEP,
  FASTING,
  BLOOD_PRESSURE,
  WORKOUTS,
  MEALS,
  PULLUPS,
  SUPPLEMENTS,
  BODY_COMPOSITION,
  METRIC_DEFINITIONS,
  METRIC_ROWS,
} from "./test-data";

// Load .env.local before reading env vars
config({ path: path.resolve(process.cwd(), ".env.local") });

function getClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY for e2e test setup"
    );
  }
  return createClient(supabaseUrl, serviceRoleKey);
}

const TABLES = [
  "daily_entries",
  "sleep",
  "fasting",
  "blood_pressure",
  "workouts",
  "meals",
  "pullups",
  "supplements",
  "body_composition",
  "custom_metrics",
  "metrics",
] as const;

export async function cleanupAll() {
  const db = getClient();
  await Promise.all(
    TABLES.map((table) => db.from(table).delete().eq("date", TEST_DATE))
  );
  // Clean up metric_definitions seeded by tests (no date column — delete by name)
  const defNames = METRIC_DEFINITIONS.map((d) => d.name);
  await db.from("metric_definitions").delete().in("name", defNames);
}

export async function seedAll() {
  const db = getClient();

  // daily_entries must be inserted first (other tables have FK to it)
  const dailyResult = await db.from("daily_entries").upsert(DAILY_ENTRY, { onConflict: "date" });
  if (dailyResult.error) throw new Error(`Seed daily_entries failed: ${dailyResult.error.message}`);

  // Seed metric_definitions first (metrics rows reference them)
  const defResult = await db.from("metric_definitions").upsert(METRIC_DEFINITIONS, { onConflict: "name" });
  if (defResult.error) throw new Error(`Seed metric_definitions failed: ${defResult.error.message}`);

  const results = await Promise.all([
    db.from("sleep").upsert(SLEEP, { onConflict: "date" }),
    db.from("fasting").upsert(FASTING, { onConflict: "date" }),
    db.from("blood_pressure").insert(BLOOD_PRESSURE),
    db.from("workouts").insert(WORKOUTS),
    db.from("meals").insert(MEALS),
    db.from("pullups").upsert(PULLUPS, { onConflict: "date" }),
    db.from("supplements").upsert(SUPPLEMENTS, { onConflict: "date" }),
    db.from("body_composition").upsert(BODY_COMPOSITION, { onConflict: "date" }),
    db.from("metrics").insert(METRIC_ROWS),
  ]);

  const errors = results.filter((r) => r.error);
  if (errors.length > 0) {
    const messages = errors.map((r) => r.error!.message).join("; ");
    throw new Error(`Seed failed: ${messages}`);
  }
}
