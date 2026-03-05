# IronCompass — Product Requirements Document

## Vision

IronCompass is a personal health tracking and visualization platform designed for Dave Remy — a 65-year-old retired athlete targeting 165 lbs, solid 4.5 pickleball, and ready-for-anything fitness. The system tracks weight, sleep, fasting, blood pressure, workouts, meals, pullups, and supplements through an AI-first interface.

**Design philosophy**: AI-friendly above all. Claude Code is the primary client. The web dashboard is a read-heavy visualization layer. The CLI and MCP server are the write-heavy input layers. Most data entry happens through natural conversation during daily LifeOS briefings.

## Core Principles

1. **AI-first** — every feature callable programmatically, structured JSON everywhere
2. **CLI over GUI** — terminal is the primary input interface
3. **Simple data model** — flat tables, no over-normalization
4. **Ship fast** — working software over perfect abstractions
5. **Motivating visuals** — the dashboard should make you want to fill in the data

## User Stories

### Daily Logging
- As Dave, I tell Claude "I weighed 174.5 today, energy was a 3, no alcohol" and it logs via MCP
- As Dave, I say "slept 7.2 hours, Apple score 78, Oura 85, mouth tape, no CPAP" and it logs
- As Dave, I report "did a hike — 56 min, 2.5 miles, 615 ft elevation, 316 cal, avg HR 91" and it logs
- As Dave, I describe meals conversationally and Claude extracts macros and logs them
- As Dave, I say "18 pullups today, six sets of 3" and it logs

### Queries & Visualization
- As Dave, I ask "how's my weight trending?" and get a 30-day summary with direction
- As Dave, I ask "how'd I sleep this week?" and get averages and scores
- As Dave, I view a calendar month on the dashboard with color-coded workout days
- As Dave, I click a day to see everything: meals, metrics, workouts, notes
- As Dave, I check my alcohol-free and fasting compliance streaks

### LifeOS Integration
- During daily briefings, Claude calls `ironcompass_query_today` to surface health status
- Claude proactively notes trends ("weight down 2 lbs this week", "sleep scores improving")
- Weekly reviews include health summaries pulled from IronCompass

## Data Model

### daily_entries
| Column | Type | Notes |
|--------|------|-------|
| date | date | Primary key |
| weight | decimal(5,1) | In pounds |
| energy | integer | 1-5 scale |
| alcohol | boolean | Nullable: NULL=not logged, false=confirmed no |
| notes | text | Free-form |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### sleep
| Column | Type | Notes |
|--------|------|-------|
| date | date | PK, FK to daily_entries |
| apple_score | integer | Apple Watch sleep score |
| oura_score | integer | Oura Ring sleep score |
| hours | decimal(3,1) | Hours slept |
| cpap | boolean | CPAP used |
| mouth_tape | boolean | Mouth tape used |
| notes | text | |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### fasting
| Column | Type | Notes |
|--------|------|-------|
| date | date | PK, FK to daily_entries |
| protocol | text | e.g., "16:8", "18:6", "OMAD" |
| window_start | time | Eating window start |
| window_end | time | Eating window end |
| compliant | boolean | Stuck to protocol |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### blood_pressure
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| date | date | FK to daily_entries |
| systolic | integer | mmHg |
| diastolic | integer | mmHg |
| time | time | Time of reading |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### workouts
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| date | date | FK to daily_entries |
| type | text | CHECK constraint on valid types |
| duration_min | integer | |
| distance_mi | decimal(5,2) | |
| elevation_ft | integer | |
| calories | integer | |
| avg_hr | integer | Average heart rate |
| notes | text | |
| planned | boolean | Was it scheduled |
| completed | boolean | Did it happen |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

Valid workout types: `pickleball`, `strength`, `hike`, `golf`, `run`, `elliptical`, `mobility`, `sauna`, `other`

### meals
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK, auto-generated |
| date | date | FK to daily_entries |
| time | time | Meal time |
| name | text | e.g., "salmon dinner" |
| description | text | Details |
| protein_g | decimal(5,1) | |
| fat_g | decimal(5,1) | |
| carbs_g | decimal(5,1) | |
| calories | integer | |
| notes | text | |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### pullups
| Column | Type | Notes |
|--------|------|-------|
| date | date | PK, FK to daily_entries |
| total_count | integer | Total reps |
| sets | integer[] | Array of reps per set |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### supplements
| Column | Type | Notes |
|--------|------|-------|
| date | date | PK, FK to daily_entries |
| supplements | text[] | Array of supplement names |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

### body_composition
| Column | Type | Notes |
|--------|------|-------|
| date | date | PK, FK to daily_entries |
| body_fat_pct | decimal(4,1) | From Hume Body Pod |
| muscle_mass_lbs | decimal(5,1) | |
| bone_mass_lbs | decimal(4,1) | |
| body_water_pct | decimal(4,1) | |
| visceral_fat | integer | 1-30 scale |
| bmr | integer | Basal metabolic rate |
| notes | text | |
| created_at | timestamptz | Auto |
| updated_at | timestamptz | Auto |

## CLI Commands

### Logging

```bash
# Daily metrics
ironcompass log --date 2026-03-05 --weight 174.5 --energy 3 --alcohol false
ironcompass log sleep --apple 78 --oura 85 --hours 7.2 --mouth-tape --no-cpap
ironcompass log fasting --protocol 16:8 --start 12:00 --end 20:00 --compliant
ironcompass log bp --systolic 128 --diastolic 78
ironcompass log workout --type hike --duration 56 --distance 2.5 --elevation 615 --calories 316 --hr 91
ironcompass log meal --name "salmon dinner" --protein 34 --fat 12 --carbs 25 --calories 340
ironcompass log pullups --total 18 --sets 3,3,3,3,3,3
ironcompass log supplements --taken "vitamin-d,magnesium,omega-3,creatine"
ironcompass log bodycomp --fat 22.3 --muscle 145 --bone 7.2 --water 55.1 --visceral 8 --bmr 1680
```

### Queries

```bash
ironcompass today                    # today's full summary
ironcompass week                     # weekly summary
ironcompass trend weight --days 30   # 30-day weight trend
ironcompass trend sleep --days 14    # sleep trend
ironcompass streak alcohol-free      # current alcohol-free streak
ironcompass streak fasting           # fasting compliance streak
ironcompass status                   # overall dashboard summary
```

All commands return structured JSON for Claude to parse.

## MCP Tools

| Tool | Description | Parameters |
|------|-------------|------------|
| `ironcompass_log_daily` | Log daily metrics | date, weight, energy, alcohol, notes |
| `ironcompass_log_sleep` | Log sleep data | date, apple_score, oura_score, hours, cpap, mouth_tape, notes |
| `ironcompass_log_fasting` | Log fasting window | date, protocol, window_start, window_end, compliant |
| `ironcompass_log_bp` | Log blood pressure | date, systolic, diastolic, time |
| `ironcompass_log_workout` | Log a workout | date, type, duration_min, distance_mi, elevation_ft, calories, avg_hr, notes, planned, completed |
| `ironcompass_log_meal` | Log a meal | date, time, name, description, protein_g, fat_g, carbs_g, calories, notes |
| `ironcompass_log_pullups` | Log pullup count | date, total_count, sets |
| `ironcompass_log_supplements` | Log supplements | date, supplements |
| `ironcompass_log_bodycomp` | Log body composition | date, body_fat_pct, muscle_mass_lbs, bone_mass_lbs, body_water_pct, visceral_fat, bmr, notes |
| `ironcompass_query_today` | Today's summary | — |
| `ironcompass_query_week` | Weekly summary | — |
| `ironcompass_query_trend` | Trend data | metric, days |
| `ironcompass_query_streak` | Streak data | metric |

## Web Dashboard Views

### Calendar View (primary)
- Month grid, days color-coded by workout type
- Color scheme: Green=pickleball, Blue=strength, Orange=hike, Purple=golf, Red=run, Gray=rest
- Multiple workouts per day supported (stacked color indicators)
- Click any day for full details

### Day Detail View
- Weight, energy, alcohol status
- Sleep scores and details
- Fasting window and compliance
- Blood pressure readings
- All workouts with stats
- All meals with macros
- Pullups and supplements
- Notes

### Metrics Dashboard
- Weight trend line with 165 lb goal line
- Sleep score trends (Apple + Oura)
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
- Active streaks

## Implementation Notes

### Lazy Anchor Pattern
All sub-tables (sleep, workouts, meals, etc.) reference `daily_entries(date)`. The CLI and MCP tools must upsert a `daily_entries` row (even if just the date) before inserting into any child table. This is handled at the application layer, not the database.

### Alcohol Tracking
The `alcohol` column is nullable. `NULL` = not logged yet, `false` = confirmed no alcohol, `true` = alcohol consumed. This distinction matters for accurate streak calculations.

## Non-Functional Requirements

- **Performance**: Dashboard loads in <2s, API responses <200ms
- **Availability**: Supabase handles uptime; Vercel for web
- **Data integrity**: Foreign key constraints, CHECK constraints on enums
- **Security**: Service role key server-side only, anon key for read-only dashboard
- **Single user**: No auth system needed — this is Dave's personal tool

## Architecture

```
┌─────────────────────────────────────────────┐
│              Claude (LifeOS)                 │
│         Daily briefing / conversation        │
└─────────────┬───────────────────────────────┘
              │ MCP tools
              ▼
┌─────────────────────────────────────────────┐
│           IronCompass MCP Server             │
│         (log_* and query_* tools)           │
└─────────────┬───────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────────────┐
│          ironcompass CLI                     │
│     (same API, terminal interface)          │
└─────────────┬───────────────────────────────┘
              │ Supabase JS client
              ▼
┌─────────────────────────────────────────────┐
│            Supabase (Postgres)              │
│    daily_entries, sleep, fasting, workouts, │
│    meals, blood_pressure, pullups,          │
│    supplements                              │
└─────────────┬───────────────────────────────┘
              │ Read-only queries
              ▼
┌─────────────────────────────────────────────┐
│         Next.js Web Dashboard               │
│   Calendar + Metrics + Weekly Summary       │
│          Deployed on Vercel                 │
└─────────────────────────────────────────────┘
```

## Build Phases

### Phase 1: Data Layer + CLI
- Supabase schema (this issue)
- CLI scaffold with `ironcompass` command
- All `log` commands
- All `query` commands

### Phase 2: MCP Server
- MCP server scaffold
- Log tools (all `ironcompass_log_*`)
- Query tools (all `ironcompass_query_*`)
- Register in LifeOS Claude config

### Phase 3: Web Dashboard
- Calendar view with color-coded workouts
- Day detail view
- Metrics dashboard with trends
- Weekly summary view
- Deploy to Vercel

### Phase 4: Integrations
- Health Auto Export webhook
- Hevy MCP / API integration
- Oura Ring API
- Strava API

## Success Metrics

- Daily data entry takes <2 minutes via conversation with Claude
- Dashboard renders a useful month view on first deploy
- All CLI commands return valid JSON
- MCP tools work seamlessly in LifeOS daily briefings
- Weight trend, sleep trends, and streaks are visible at a glance

## Future Ideas / Backlog

- Apple Shortcuts for quick logging from iPhone
- Meal photo → macro estimation (vision API)
- AI-generated weekly health insights
- Supplement timing optimizer
- Training load / recovery scoring
- Heart rate zone analysis from workout data
- Body composition tracking (beyond just weight)
- Workout templates / programs
- Goal setting and progress tracking
- Export to CSV/PDF for doctor visits
