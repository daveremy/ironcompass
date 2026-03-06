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
| #7 | MCP server scaffold | todo |
| #8 | Log tools (all `ironcompass_log_*` tools) | todo |
| #9 | Query tools (all `ironcompass_query_*` tools) | todo |
| #10 | Register MCP server in LifeOS Claude config | todo |

## Phase 3: Web Dashboard — #11

The visual layer. Calendar view + metrics. Deploy to Vercel.

| Issue | Task | Status |
|---|---|---|
| #12 | Calendar view component (month view, color-coded workouts) | todo |
| #13 | Day detail view (meals, metrics, notes on click) | todo |
| #14 | Metrics dashboard (weight trend, sleep, streaks, BP) | todo |
| #15 | Weekly summary view | todo |
| #16 | Deploy to Vercel | todo |

## Phase 4: Integrations — #17

Connect external data sources for automatic data flow.

| Issue | Task | Status |
|---|---|---|
| #18 | Health Auto Export webhook endpoint | todo |
| #19 | Hevy MCP / API integration | todo |
| #20 | Oura Ring API integration (see [oura-cli](https://github.com/daveremy/oura-cli)) | in progress |
| #21 | Strava API integration | todo |
| #22 | Hevy webhook → auto-log workouts | todo |

---

## Future Ideas
- Apple Shortcuts for quick logging from iPhone
- Meal photo → macro estimation (vision API)
- AI-generated weekly health insights
- Supplement timing optimizer
- Training load / recovery scoring
