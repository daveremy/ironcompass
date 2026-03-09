---
name: ironcompass-usage
description: How to effectively use IronCompass MCP tools for health data logging and querying. Use when ironcompass MCP tools are available in the session.
user-invocable: false
---

# IronCompass Usage Guide

IronCompass is a personal health tracking platform. You log data via MCP tools and the user views it on a web dashboard.

## Core Pattern: Query Before Log

Always call `ironcompass_query_today` before prompting the user to log data. This shows what's already recorded so you can focus on what's missing and avoid duplicate inserts.

## Data Dependencies

Most tables have a foreign key to `daily_entries`. The log tools handle this automatically — you do **not** need to call `ironcompass_log_daily` first. The first log call for any date auto-creates a minimal daily entry.

## Upsert vs Insert Tools

Calling the wrong tool twice has different consequences:

**Upsert tools** (safe to re-call, updates existing row):
- `ironcompass_log_daily`, `ironcompass_log_sleep`, `ironcompass_log_fasting`, `ironcompass_log_pullups`, `ironcompass_log_bodycomp` — all keyed on date

**Insert tools** (creates a new row every call — will duplicate if called twice):
- `ironcompass_log_bp`, `ironcompass_log_workout`, `ironcompass_log_meal`, `ironcompass_log_metric`

For insert tools, always check `ironcompass_query_today` first to avoid duplicating existing records.

**Merge tool:**
- `ironcompass_log_supplements` — merges new supplements with the existing list for that date, does not overwrite

## Tool Parameters

All log tools accept an optional `date` (YYYY-MM-DD). If omitted, defaults to today. Always use explicit dates when logging past days.

### Supplements
Pass as an array of lowercase, hyphenated strings: `["vitamin-d", "omega-3", "creatine"]`.

### Custom Metrics
The `name` is automatically lowercased. Multiple entries per day per metric are summed in the dashboard. Include `unit` on at least the first entry (e.g., "cups", "ml").

### Workout Details
The `details` field is a JSON object with type-specific structure:
- Strength: `{"exercises": [{"name": "Bench Press", "sets": [{"reps": 8, "weight": 135}]}]}`
- Hike/Run: `{"trail": "Mission Peak", "out_and_back": true}`
- Golf: `{"course": "Pebble Beach", "score": 92, "holes": 18}`

Use `ironcompass_list_workout_types` to get valid type names. The `source` field defaults to "manual" — set to "apple_health", "hevy", "strava", etc. for integration data.

`start_time` and `end_time` accept HH:MM (auto-converted using the workout date) or full ISO 8601 datetime strings.

## Query Tools

**`ironcompass_query_today`** — All data for a single date. Accepts optional `date` param.

**`ironcompass_query_week`** — Last 7 days with aggregates (weight delta, avg sleep, workout count, protein/calories, fasting compliance, streaks). Always returns last 7 days from today — does not accept a date parameter.

**`ironcompass_query_trend`** — Time-series points and summary stats over N days. Built-in metrics: `weight`, `energy`, `sleep`, `hrv`, `hr-sleep`, `readiness`, `bp`, `pullups`, `calories`, `protein`, `body-fat`. Also accepts any custom metric name (aggregated as daily sums).
<!-- Built-in list sourced from VALID_METRICS in cli/src/commands/query.ts -->

**`ironcompass_query_streak`** — Current streak count and start date. Valid: `alcohol-free`, `fasting`, `workout`, `logging`. Streaks skip today if not yet logged (so a streak doesn't break just because it's morning).
<!-- Valid list sourced from VALID_STREAKS in cli/src/commands/query.ts -->

## Delete Tools

Require a UUID from a prior query result. Always confirm with the user before deleting.
- `ironcompass_delete_workout`, `ironcompass_delete_meal`, `ironcompass_delete_metric`

## Dashboard URLs

Every response includes a `dashboard_url`. URL patterns for deep linking:
- `/?view=daily&date=YYYY-MM-DD` — day view
- `/?view=weekly&date=YYYY-MM-DD` — weekly view (date = Monday)
- `/?view=metrics` — trends and streaks
- `/?month=YYYY-MM-DD` — calendar month
