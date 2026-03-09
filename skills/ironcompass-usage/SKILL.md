---
name: ironcompass-usage
description: How to effectively use IronCompass MCP tools for health data logging and querying. Use when ironcompass MCP tools are available in the session.
user-invocable: false
---

# IronCompass Usage Guide

This skill teaches AI assistants how to effectively use the IronCompass MCP tools. IronCompass is a personal health tracking platform — you log data via MCP tools and the user views it on a web dashboard.

## Core Pattern: Query Before Log

Always call `ironcompass_query_today` before prompting the user to log data. This tells you what's already been recorded so you can:
- Avoid asking about data that's already logged
- Focus the conversation on what's missing
- Prevent duplicate inserts for insert-only tables (see below)

## Data Dependencies

`daily_entries` is the parent table. Most other tables have a foreign key to it. The log tools handle this automatically via `ensureDailyEntry()` — you do **not** need to call `ironcompass_log_daily` before other tools. But be aware: if nothing has been logged for a date yet, the first log tool call for that date will auto-create a minimal daily entry.

## Upsert vs Insert Tools

This is critical to understand — calling the wrong tool twice has different consequences:

**Upsert tools** (safe to re-call, updates existing row):
- `ironcompass_log_daily` — keyed on date
- `ironcompass_log_sleep` — keyed on date
- `ironcompass_log_fasting` — keyed on date
- `ironcompass_log_pullups` — keyed on date
- `ironcompass_log_bodycomp` — keyed on date

**Insert tools** (creates new row every call — will duplicate if called twice):
- `ironcompass_log_bp` — multiple readings per day are valid
- `ironcompass_log_workout` — multiple workouts per day are valid
- `ironcompass_log_meal` — multiple meals per day are valid
- `ironcompass_log_metric` — multiple entries per metric per day are valid

**Merge tool** (special behavior):
- `ironcompass_log_supplements` — merges new supplements with existing list for that date, does not overwrite

Before inserting a workout or meal, check `ironcompass_query_today` to see if it already exists. If the user says "I had a protein shake" and today's query already shows a protein shake meal, don't insert another one.

## Tool Parameters

All log tools accept an optional `date` parameter (YYYY-MM-DD format). If omitted, defaults to today. Always use explicit dates when logging data for past days.

### Supplements
Pass as an array of lowercase, hyphenated strings: `["vitamin-d", "omega-3", "creatine", "magnesium"]`. The tool merges with any existing supplements for that date.

### Custom Metrics
The `name` parameter is automatically lowercased. Multiple entries per day per metric are summed in the dashboard (e.g., logging coffee twice with value 1 shows total 2). Include `unit` on at least the first entry (e.g., "cups", "ml", "score").

### Workout Details
The `details` field is a JSON object with type-specific structure. Common patterns:

**Strength:**
```json
{
  "exercises": [
    { "name": "Bench Press", "sets": [{ "reps": 8, "weight": 135 }, { "reps": 8, "weight": 135 }] },
    { "name": "Pull-ups", "sets": [{ "reps": 10, "weight": 0 }] }
  ]
}
```

**Hike/Run** (optional, displayed on map if coordinates provided):
```json
{
  "trail": "Mission Peak",
  "out_and_back": true
}
```

**Golf:**
```json
{
  "course": "Pebble Beach",
  "score": 92,
  "holes": 18
}
```

Use `ironcompass_list_workout_types` to get valid workout type names. The `source` field defaults to "manual" — set it to "apple_health", "hevy", "strava", etc. when the data comes from an integration.

### Workout Times
`start_time` and `end_time` accept either HH:MM (converted to ISO 8601 using the workout date) or full ISO 8601 datetime strings.

## Query Tools

### `ironcompass_query_today`
Returns all data for a single date: daily metrics, sleep, fasting, BP, workouts, meals, pullups, supplements, body composition, custom metrics. Use this as your primary "what's been logged" check.

### `ironcompass_query_week`
Returns the last 7 days with aggregates: weight delta, avg sleep, workout count/types, avg daily protein/calories, fasting compliance, alcohol days, pullup totals, custom metric averages.

### `ironcompass_query_trend`
Returns time-series data points and summary statistics for a metric over N days.

Built-in metrics: `weight`, `energy`, `sleep`, `hrv`, `hr-sleep`, `readiness`, `bp`, `pullups`, `calories`, `protein`, `body-fat`

Also accepts any custom metric name (e.g., `coffee`, `water`). Custom metrics are aggregated as daily sums.

### `ironcompass_query_streak`
Returns current streak count and start date. Valid streaks: `alcohol-free`, `fasting`, `workout`, `logging`

Streaks skip today if not yet logged (so a streak doesn't break just because it's morning).

## Delete Tools

All delete tools require a UUID. Get the ID from a query result first (e.g., from `ironcompass_query_today`). Always confirm with the user before deleting.

- `ironcompass_delete_workout` — delete a specific workout
- `ironcompass_delete_meal` — delete a specific meal
- `ironcompass_delete_metric` — delete a specific custom metric entry

## Dashboard URLs

Every log and query response includes a `dashboard_url` field. You can share this URL with the user so they can view the data in the web dashboard. The dashboard supports these URL patterns:
- `/?view=daily&date=YYYY-MM-DD` — single day view
- `/?view=weekly&date=YYYY-MM-DD` — weekly view (date = Monday of the week)
- `/?view=metrics` — metrics dashboard with trends and streaks
- `/?month=YYYY-MM-DD` — calendar view for a specific month

## Example Workflows

### Daily check-in
1. `ironcompass_query_today` → see what's logged
2. Ask about missing categories (weight? sleep? meals? supplements?)
3. Log responses with appropriate tools
4. Share the dashboard URL for the day

### Weekly review
1. `ironcompass_query_week` → get 7-day summary
2. Highlight trends (weight direction, sleep consistency, workout frequency)
3. Note streaks and compliance
4. Optionally `ironcompass_query_trend` for deeper analysis on specific metrics

### Logging a complex day retroactively
1. `ironcompass_query_today` with explicit date → check what exists
2. Log daily entry first if weight/energy/alcohol known
3. Log sleep, fasting, workouts, meals in any order (ensureDailyEntry handles FK)
4. Log supplements last (merge behavior means you can add more later)
