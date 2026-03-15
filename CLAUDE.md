# IronCompass — Project Config

## What This Is
A personal health tracking and visualization platform. AI-first design — Claude Code is the primary client, not a human at a keyboard. Named for iron discipline, 360° health compass, and true north direction.

## Design Intent
Built for a single active individual tracking their own health. Single-user by design — no auth, no multi-tenancy. The user configures their own goals (target weight, fitness milestones, etc.) and IronCompass tracks progress toward them.

## Architecture

### Core Principle
**AI-friendly above all.** Every feature should be callable programmatically. The web dashboard is a read-heavy visualization layer. The CLI/MCP is the write-heavy input layer. Claude issues most commands behind the scenes during daily briefings.

### Stack
- **Framework**: Next.js (App Router, TypeScript, Tailwind)
- **Data**: SQLite (local) → Supabase (when ready to deploy)
- **CLI**: `ironcompass` Node CLI — primary data input interface
- **MCP Server**: Exposes tools directly to Claude Code sessions
- **Web Dashboard**: Calendar view + metrics — deployed on Vercel
- **Design**: Frontend design skill installed. Bold, distinctive, not generic.

### Data Flow
```
Claude (LifeOS session)
  ↓ MCP tools / CLI commands
IronCompass API
  ↓
SQLite/Supabase
  ↓
Web Dashboard (read-only visualization)
```

## Data Model

### Daily Entry
- date, weight, energy (1-5, decimal), alcohol (bool), notes
- sleep: apple_score, oura_score, hours, cpap (bool), mouth_tape (bool), notes
- fasting: protocol, window_start, window_end, compliant (bool)
- blood_pressure: systolic, diastolic, time

### Workouts
- date, type (pickleball/strength/hike/golf/run/elliptical/mobility/sauna/indoor_cycle/other)
- duration_min, distance_mi, elevation_ft, calories
- avg_hr, notes, planned (bool), completed (bool), details (jsonb)
- start_time (timestamptz), end_time (timestamptz), source (text)

### Meals
- date, time, name, description
- protein_g, fat_g, carbs_g, calories
- notes

### Pullups
- date, total_count, sets (array of reps per set)

### Unified Metrics (metric_definitions + metrics)
- **metric_definitions**: name (PK), display_name, type (numeric/tag), unit, category
- **metrics**: id (UUID), date, metric_name (FK), numeric_value, text_value, unit, category, notes
- Categories: `supplement` (tag), `sleep_tag` (tag), `custom` (numeric)
- Supplements and sleep tags are tag-type metrics (no numeric_value)
- Custom metrics are numeric-type (coffee cups, water intake, mood, etc.)
- Multiple numeric entries per day per metric; tags deduplicated per day+category
- metric_name lowercased at app layer; definitions auto-created on first log

### Body Composition
- date, body_fat_pct, muscle_mass_lbs, bone_mass_lbs, body_water_pct, visceral_fat, bmr, notes
- Source: Hume Body Pod (via Apple Health sync or manual entry)

## CLI Commands

```bash
# Daily metrics
ironcompass log daily --date 2026-03-05 --weight 174.5 --energy 3 --no-alcohol
ironcompass log sleep --apple 78 --oura 85 --hours 7.2 --mouth-tape --no-cpap
ironcompass log fasting --protocol 16:8 --start 12:00 --end 20:00 --compliant
ironcompass log bp --systolic 128 --diastolic 78

# Workouts
ironcompass log workout --type hike --duration 56 --distance 2.5 --elevation 615 --calories 316 --hr 91
ironcompass log workout --type strength --duration 30 --notes "Day B: upper body + core"
ironcompass log workout --type run --duration 30 --start-time 08:30 --end-time 09:00 --source manual

# Meals
ironcompass log meal --name "salmon dinner" --protein 34 --fat 12 --carbs 25 --calories 340
ironcompass log meal --name "protein shake" --protein 39 --fat 6 --carbs 14 --calories 260

# Pullups
ironcompass log pullups --total 18 --sets 3,3,3,3,3,3

# Supplements
ironcompass log supplements --taken "vitamin-d,magnesium,omega-3,creatine"
ironcompass log supplements --taken "vitamin-d,omega-3" --mode replace  # replace all for that date

# Sleep tags
ironcompass log sleep-tags --tags "melatonin,mouth-tape,meditation"

# Body composition
ironcompass log bodycomp --fat 22.3 --muscle 145 --bone 7.2 --water 55.1 --visceral 8 --bmr 1680

# Custom metrics
ironcompass log metric --name coffee --value 1 --unit cups
ironcompass log metric --name water --value 500 --unit ml

# Queries
ironcompass today                    # today's full summary
ironcompass week                     # weekly summary
ironcompass trend weight --days 30   # 30-day weight trend
ironcompass trend sleep --days 14    # sleep trend
ironcompass trend coffee --days 7    # custom metric trend
ironcompass streak alcohol-free      # current alcohol-free streak
ironcompass streak fasting           # fasting compliance streak
ironcompass status                   # overall dashboard summary (for daily briefing)

# Weekly Plan
ironcompass plan show                          # show active plan template
ironcompass plan set --schedule '<json>'        # set weekly plan from JSON
ironcompass plan instantiate [--week 2026-03-09] # create planned workout rows for a week
ironcompass plan status [--week 2026-03-09]     # plan-vs-actual for the week
```

## MCP Tools

The MCP server exposes these as tools Claude can call directly:
- `ironcompass_log_daily` — log daily metrics
- `ironcompass_log_sleep` — log sleep data
- `ironcompass_log_fasting` — log fasting window
- `ironcompass_log_workout` — log a workout
- `ironcompass_log_meal` — log a meal with macros
- `ironcompass_log_pullups` — log pullup count
- `ironcompass_log_bp` — log blood pressure
- `ironcompass_log_supplements` — log supplements taken (merge or replace mode)
- `ironcompass_log_sleep_tags` — log sleep tags (e.g., melatonin, meditation)
- `ironcompass_log_bodycomp` — log body composition (Hume Body Pod)
- `ironcompass_log_metric` — log a custom numeric metric
- `ironcompass_list_workout_types` — list all valid workout types with display names and colors
- `ironcompass_delete_supplement` — delete a single supplement by name and date
- `ironcompass_delete_metric` — delete a custom metric entry by ID
- `ironcompass_delete_meal` — delete a meal by ID
- `ironcompass_delete_workout` — delete a workout by ID
- `ironcompass_query_today` — get today's summary (includes today's plan + week progress if active)
- `ironcompass_query_week` — get weekly summary (includes plan status if active)
- `ironcompass_query_trend` — get trend data for a metric
- `ironcompass_query_streak` — get current streak for a metric
- `ironcompass_set_plan` — set/replace active weekly training plan template
- `ironcompass_get_plan` — get the active weekly plan template
- `ironcompass_instantiate_plan` — create planned workout rows for a week (idempotent)
- `ironcompass_query_plan` — get plan-vs-actual status with target progress

## Weekly Planning

### How It Works
1. **Set a plan** — `ironcompass_set_plan` with a schedule (day-of-week → workouts) and optional targets (total sessions, duration, per-type)
2. **Instantiate weekly** — `ironcompass_instantiate_plan` creates planned workout rows for a specific week. Idempotent (safe to re-run). Must be called each week.
3. **Track progress** — `ironcompass_query_plan` shows plan-vs-actual with matching, target progress, and summary
4. **Log actuals** — Normal `ironcompass_log_workout` calls. Matched to plan by date + type (one-to-one).

### Workout Status
- **Scheduled**: `planned=true, completed=false`, today or future → hollow dot on calendar
- **Skipped**: `planned=true, completed=false`, past date → gray dot on calendar
- **Completed**: either `planned=true, completed=true` (in-place) or matched to a separate actual workout

### Plan Template Format
```json
{
  "monday": [{ "type": "pickleball", "duration_min": 90 }],
  "tuesday": [{ "type": "strength", "duration_min": 45, "notes": "Day A" }],
  "wednesday": [],
  "thursday": [{ "type": "pickleball", "duration_min": 90 }],
  "friday": [{ "type": "strength", "duration_min": 45, "notes": "Day B" }],
  "saturday": [{ "type": "hike" }],
  "sunday": []
}
```

### Targets (optional)
```json
{
  "total_sessions": 6,
  "total_duration_min": 350,
  "by_type": { "strength": { "sessions": 2 }, "pickleball": { "sessions": 2 } }
}
```

## Web Dashboard Views

### Calendar View (primary)
- Month view, days color-coded by workout type
- Green=pickleball, Blue=strength, Orange=hike, Purple=golf, Red=run, Rose=indoor_cycle, Gray=rest
- Multiple workouts per day shown
- Click day for full details (meals, metrics, notes)
- 8th column (WK) shows weekly summaries: workout count, sleep hours, weight delta, fasting ratio
- Click WK column to navigate to dedicated weekly view

### Weekly View
- Dedicated `?view=weekly&date=<monday>` view with prev/next week navigation
- Sections: Overview (days logged, weight delta, alcohol), Sleep (avg hours/oura/apple), Workouts (count + type badges + list), Nutrition (avg daily protein/calories), Fasting (compliant days), Pullups (total + active days)
- Plan Progress card shows session/duration/per-type targets when active plan exists
- Planned workouts shown with hollow dots, skipped with gray strikethrough
- URL auto-syncs to Monday of selected week for deep-linking

### Metrics Dashboard
- Weight trend line (configurable goal line)
- Sleep score trends
- Fasting compliance streak
- Alcohol-free streak
- Pullup daily count + trend
- Blood pressure trend
- Protein intake vs target

## Design Direction
Athletic, bold, dark theme. Think Strava meets a fighter pilot's HUD. Not clinical — motivating. The design should make you want to fill in the data because it looks good when you do.

## Build Phases
1. **Data layer + CLI** — SQLite schema, CLI commands, log and query
2. **MCP server** — expose tools to Claude Code
3. **Web dashboard** — calendar view, metrics, deploy to Vercel
4. **Integrations** — Health Auto Export webhook, Hevy MCP, Oura API, Strava API

## Dev Workflow

For each feature/task:
1. **Plan** — write up the approach in the issue
2. **Review plan** — loop with `codex` and `gemini` CLIs until both approve
3. **Implement** — after user's final go-ahead
4. **Simplify** — run code simplifier skill
5. **Review implementation** — loop with `codex` and `gemini` CLIs until both approve
6. **Polish** — tests, docs, final touches
7. **Commit** — reference GitHub issue number in commit message

Use GitHub issues for all work. ROADMAP.md references issues. Use PRs for historical record.

**PR descriptions must include `closes #<issue>` so GitHub auto-closes the issue on merge.** Use the `closes` keyword in the PR body, not just `(#X)` in commit messages.

## Preferences
- No over-engineering. Ship fast, iterate.
- CLI and MCP are more important than the web UI initially
- Every command returns structured JSON (for Claude to parse)
- Dark theme, high contrast
