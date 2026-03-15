# IronCompass Roadmap

## Dev Workflow

For each feature/task:

1. **Plan** — write up the approach
2. **Review plan** — loop with Codex + Gemini CLIs until both approve
3. **Implement** — after user's final go-ahead
4. **Simplify** — run code simplifier
5. **Review implementation** — loop with Codex + Gemini until both approve
6. **Polish** — tests, docs, final touches
7. **Commit** — reference GitHub issue, use PR for history

---

## Phase 1: Data Layer + CLI — #1

Get data flowing. Log everything from the terminal. Every command returns JSON.

| Issue | Task | Status |
|---|---|---|
| #2 | Supabase project setup + schema | **done** |
| #3 | CLI scaffold (`ironcompass` command) | **done** |
| #4 | `ironcompass log` commands (daily, sleep, fasting, workout, meal, pullups, bp, supplements) | **done** |
| #5 | `ironcompass query` commands (today, week, trend, streak, status) | **done** |

## Phase 2: MCP Server — #6

Expose IronCompass as MCP tools so Claude can call them directly from LifeOS sessions.

| Issue | Task | Status |
|---|---|---|
| #7 | MCP server scaffold | **done** |
| #8 | Log tools (all `ironcompass_log_*` tools) | **done** |
| #9 | Query tools (all `ironcompass_query_*` tools) | **done** |
| #10 | Register MCP server in LifeOS Claude config | **done** |
| #27 | Set up local Supabase test environment with seed data | closed |
| #30 | Generic custom metrics table + `ironcompass_log_metric` tool (coffee, water, etc.) | **done** |

## Phase 3: Web Dashboard — #11

The visual layer. Calendar view + metrics. Deploy to Vercel.

| Issue | Task | Status |
|---|---|---|
| #12 | Calendar view component (month view, color-coded workouts) | **done** |
| #13 | Day detail view (meals, metrics, notes on click) | **done** |
| #14 | Metrics dashboard (weight trend, sleep, streaks, BP) | **done** |
| #15 | Weekly summary view | **done** |
| #16 | Deploy to Vercel | closed |

### Design decision: multi-view navigation
All dashboard views (monthly calendar, weekly, daily) share a single page with `?view=` query param routing (`?view=daily&date=2026-03-06`). This makes every view deep-linkable so the AI assistant can open specific views by constructing a URL. Shell nav tabs and CalendarDay onClick will drive these params starting in #13.

## Phase 4: Data Display & Enrichment

Source integrations (Apple Health, Oura, Hevy) live in LifeOS, which reconciles data and sends it via MCP tools. IronCompass focuses on displaying enriched data well.

| Issue | Task | Status |
|---|---|---|
| #76 | Strava integration: activity linking, route maps, and embed support | **done** |

---

## Schema Enhancements

| Issue | Task | Status |
|---|---|---|
| #32 | Add `start_time` and `end_time` to workouts (dedup, HR correlation, chronological display) | **done** |
| #33 | Add `source` field to workouts (dedup, data quality, reconciliation) | **done** |
| #43 | Bug: `ironcompass_log_supplements` overwrites instead of appending | **done** |
| #44 | Change `energy` field from integer to decimal | **done** |
| #34 | Add `indoor_cycle` workout type | **done** |
| #35 | Add `details` JSONB column to workouts for type-specific data (strength sets, golf scores, etc.) | **done** |
| #37 | Deduplicate WorkoutType and Database types across CLI and web | **done** |
| #38 | Add `delete_meal` MCP tool | **done** |
| #39 | Make workout types table-driven instead of hardcoded | **done** |
| #40 | Structured workout details rendering (generic + type-specific renderers, maps for hike/run) | **done** |

## Bugs

| Issue | Task | Status |
|---|---|---|
| #48 | Streak cards show 0 when today not yet logged | **done** |
| #50 | Add axis labels to metrics dashboard charts | **done** |
| #63 | Workout times displayed in UTC instead of local timezone | **done** |

## Features

| Issue | Task | Status |
|---|---|---|
| #49 | Track personal records and longest streaks | **done** |
| #52 | Use `display_name` from workout_types table in UI | **done** |
| #55 | Add prev/next day navigation to daily detail view | **done** |
| #56 | Package IronCompass as a Claude Code plugin with companion skill | **done** |
| #58 | Weekly planning & visualization (TrainingPeaks-style) | **done** |
| #59 | Add `walk` workout type | **done** |
| #60 | Body composition section should include weight | **done** |
| #61 | Fasting card should show fast duration prominently | **done** |
| #65 | Streak badges on daily detail view | **done** |
| #67 | Logging streak should check all tables, not just daily_entries | **done** |
| #69 | Show streak badges on historical daily detail pages | **done** |
| #62 | Sleep card: composite score from multiple sources | todo |
| #68 | Add sickness/illness tracking | todo |
| #77 | Supplements: add replace mode and delete capability | **done** |
| #78 | Replace hardcoded sleep booleans with flexible sleep tags | **done** |
| #79 | Expand Vitals section with more daily metrics | todo |

## Testing

| Issue | Task | Status |
|---|---|---|
| #53 | Expand e2e test coverage: weekly details, edge cases, mobile | closed |
| #72 | Improve e2e test coverage (day nav, streaks, charts, weekly sections) | **done** |

## Future Ideas
- Apple Shortcuts for quick logging from iPhone
- Meal photo → macro estimation (vision API)
- AI-generated weekly health insights
- Supplement timing optimizer
- Training load / recovery scoring
