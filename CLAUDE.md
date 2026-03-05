# IronCompass — Project Config

## What This Is
A personal health tracking and visualization platform. AI-first design — Claude Code is the primary client, not a human at a keyboard. Named for iron discipline (Ironman 2005), 360° health compass, and true north direction.

## Owner
Dave Remy — 65, retired, active athlete (pickleball, hiking, strength, golf). Targeting 165 lbs, solid 4.5 pickleball, ready for 20-mile hikes anytime.

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
- date, weight, energy (1-5), alcohol (bool), notes
- sleep: apple_score, oura_score, hours, cpap (bool), mouth_tape (bool), notes
- fasting: protocol, window_start, window_end, compliant (bool)
- blood_pressure: systolic, diastolic, time

### Workouts
- date, type (pickleball/strength/hike/golf/run/elliptical/mobility/sauna/other)
- duration_min, distance_mi, elevation_ft, calories
- avg_hr, notes, planned (bool), completed (bool)

### Meals
- date, time, name, description
- protein_g, fat_g, carbs_g, calories
- notes

### Pullups
- date, total_count, sets (array of reps per set)

### Supplements
- date, supplements taken (array)

### Body Composition
- date, body_fat_pct, muscle_mass_lbs, bone_mass_lbs, body_water_pct, visceral_fat, bmr, notes
- Source: Hume Body Pod (via Apple Health sync or manual entry)

## CLI Commands

```bash
# Daily metrics
ironcompass log --date 2026-03-05 --weight 174.5 --energy 3 --alcohol false
ironcompass log sleep --apple 78 --oura 85 --hours 7.2 --mouth-tape --no-cpap
ironcompass log fasting --protocol 16:8 --start 12:00 --end 20:00 --compliant
ironcompass log bp --systolic 128 --diastolic 78

# Workouts
ironcompass log workout --type hike --duration 56 --distance 2.5 --elevation 615 --calories 316 --hr 91
ironcompass log workout --type strength --duration 30 --notes "Day B: upper body + core"

# Meals
ironcompass log meal --name "salmon dinner" --protein 34 --fat 12 --carbs 25 --calories 340
ironcompass log meal --name "protein shake" --protein 39 --fat 6 --carbs 14 --calories 260

# Pullups
ironcompass log pullups --total 18 --sets 3,3,3,3,3,3

# Supplements
ironcompass log supplements --taken "vitamin-d,magnesium,omega-3,creatine"

# Body composition
ironcompass log bodycomp --fat 22.3 --muscle 145 --bone 7.2 --water 55.1 --visceral 8 --bmr 1680

# Queries
ironcompass today                    # today's full summary
ironcompass week                     # weekly summary
ironcompass trend weight --days 30   # 30-day weight trend
ironcompass trend sleep --days 14    # sleep trend
ironcompass streak alcohol-free      # current alcohol-free streak
ironcompass streak fasting           # fasting compliance streak
ironcompass status                   # overall dashboard summary (for daily briefing)
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
- `ironcompass_log_supplements` — log supplements taken
- `ironcompass_log_bodycomp` — log body composition (Hume Body Pod)
- `ironcompass_query_today` — get today's summary
- `ironcompass_query_week` — get weekly summary
- `ironcompass_query_trend` — get trend data for a metric
- `ironcompass_query_streak` — get current streak for a metric

## Web Dashboard Views

### Calendar View (primary)
- Month view, days color-coded by workout type
- Green=pickleball, Blue=strength, Orange=hike, Purple=golf, Red=run, Gray=rest
- Multiple workouts per day shown
- Click day for full details (meals, metrics, notes)

### Metrics Dashboard
- Weight trend line (goal line at 165)
- Sleep score trends
- Fasting compliance streak
- Alcohol-free streak
- Pullup daily count + trend
- Blood pressure trend
- Protein intake vs target

### Weekly Summary
- Workouts completed vs planned
- Average sleep score
- Weight delta
- Macro averages
- Streaks

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
3. **Implement** — after Dave's final go-ahead
4. **Simplify** — run code simplifier skill
5. **Review implementation** — loop with `codex` and `gemini` CLIs until both approve
6. **Polish** — tests, docs, final touches
7. **Commit** — reference GitHub issue number in commit message

Use GitHub issues for all work. ROADMAP.md references issues. Use PRs for historical record.

## Preferences
- No over-engineering. Ship fast, iterate.
- CLI and MCP are more important than the web UI initially
- Every command returns structured JSON (for Claude to parse)
- Dark theme, high contrast
