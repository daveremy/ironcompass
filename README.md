# IronCompass

Personal health tracking and visualization platform. AI-first design — Claude Code is the primary client, not a human at a keyboard.

Named for iron discipline, 360-degree health compass, and true north direction.

## Architecture

```
Claude (LifeOS) → MCP Server → Supabase (Postgres) → Next.js Dashboard (Vercel)
                  CLI ──────↗
```

- **Supabase**: Postgres database for all health data
- **CLI**: `ironcompass` — primary data input from terminal
- **MCP Server**: Exposes tools directly to Claude Code sessions
- **Web Dashboard**: Next.js + Tailwind — calendar view + metrics, deployed on Vercel

The CLI and MCP server share the same Supabase client. The dashboard is read-only visualization.

## Setup

### Prerequisites

- Node.js 20+
- A Supabase project with the schema applied (see `supabase/migrations/`)

### Install

```bash
git clone https://github.com/daveremy/ironcompass.git
cd ironcompass
npm install
cd cli && npm install && npm run build && cd ..
```

### Environment

Create `.env.local` in the project root:

```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Database

```bash
supabase db push
```

Or apply migrations from `supabase/migrations/` manually in order.

### CLI

```bash
# Run directly
node cli/dist/index.js --help

# Or link globally
cd cli && npm link
ironcompass --help
```

## CLI Usage

### Log daily metrics

```bash
ironcompass log daily --date 2026-03-05 --weight 174.5 --energy 3 --no-alcohol
ironcompass log sleep --apple 78 --oura 85 --hours 7.2 --mouth-tape --no-cpap
ironcompass log fasting --protocol 16:8 --start 12:00 --end 20:00 --compliant
ironcompass log bp --systolic 128 --diastolic 78
```

### Log workouts

```bash
ironcompass log workout --type hike --duration 56 --distance 2.5 --elevation 615 --calories 316 --hr 91
ironcompass log workout --type strength --duration 30 --notes "Day B: upper body + core"
ironcompass log workout --type indoor_cycle --duration 45 --calories 380 --hr 142
ironcompass log workout --type strength --duration 30 --details '{"exercises":[{"name":"bench press","sets":[{"reps":8,"weight":135}]}]}'
```

### Log meals, supplements, and body composition

```bash
ironcompass log meal --name "salmon dinner" --protein 34 --fat 12 --carbs 25 --calories 340
ironcompass log pullups --total 18 --sets 3,3,3,3,3,3
ironcompass log supplements --taken "vitamin-d,magnesium,omega-3,creatine"
ironcompass log bodycomp --fat 22.3 --muscle 145 --bone 7.2 --water 55.1
```

### Query data

```bash
ironcompass today                    # today's full summary
ironcompass week                     # weekly summary
ironcompass trend weight --days 30   # 30-day weight trend
ironcompass trend sleep --days 14    # sleep trend
ironcompass streak alcohol-free      # alcohol-free streak
ironcompass streak fasting           # fasting compliance streak
ironcompass status                   # overall dashboard summary
```

All commands return structured JSON.

## MCP Server

IronCompass exposes 17 tools via [Model Context Protocol](https://modelcontextprotocol.io/) so Claude can log and query health data directly.

### Register for this project

Already configured in `.mcp.json` — works automatically when Claude Code opens this project.

### Register globally (all Claude Code sessions)

```bash
claude mcp add --scope user ironcompass -- node /path/to/ironcompass/cli/dist/mcp.js
```

### Register for another project (e.g. LifeOS)

Add to that project's `.mcp.json`:

```json
{
  "mcpServers": {
    "ironcompass": {
      "command": "node",
      "args": ["/path/to/ironcompass/cli/dist/mcp.js"]
    }
  }
}
```

### Available tools

| Tool | Description |
|------|-------------|
| `ironcompass_log_daily` | Log weight, energy, alcohol, notes |
| `ironcompass_log_sleep` | Log sleep scores, hours, CPAP, mouth tape, HRV |
| `ironcompass_log_fasting` | Log fasting protocol and compliance |
| `ironcompass_log_bp` | Log blood pressure reading |
| `ironcompass_log_workout` | Log workout with type, duration, stats, details |
| `ironcompass_log_meal` | Log meal with macros |
| `ironcompass_log_pullups` | Log pullup count and sets |
| `ironcompass_log_supplements` | Log supplements taken |
| `ironcompass_log_bodycomp` | Log body composition (Hume Body Pod) |
| `ironcompass_log_metric` | Log a custom numeric metric |
| `ironcompass_query_today` | Get today's full summary |
| `ironcompass_query_week` | Get weekly summary |
| `ironcompass_query_trend` | Get trend data for any metric |
| `ironcompass_query_streak` | Get current streak |
| `ironcompass_delete_metric` | Delete a custom metric entry |
| `ironcompass_delete_meal` | Delete a meal entry |
| `ironcompass_delete_workout` | Delete a workout entry |

### Claude Code skills

Optional skills that teach Claude to use IronCompass conversationally. See [`skills/README.md`](skills/README.md) for install instructions.

- **`/health-log`** — Parse natural language ("had a protein shake, 39g protein") and log via MCP tools
- **`/health-check`** — Review health data, trends, and streaks conversationally

## Dashboard

Dark theme, athletic aesthetic. Three main views:

- **Calendar**: Month grid with color-coded workout days (green=pickleball, blue=strength, orange=hike, purple=golf, red=run, rose=indoor_cycle). Click any day for full details.
- **Metrics**: Weight trend (with configurable goal line), sleep scores, BP trend, streaks, pullup progress, protein intake.
- **Weekly Summary**: Workouts completed vs planned, averages, deltas, streaks.

## Project Structure

```
ironcompass/
├── cli/
│   ├── src/
│   │   ├── commands/     # log.ts, query.ts
│   │   ├── lib/          # date.ts, parse.ts, ensure-daily-entry.ts
│   │   ├── types/        # database.ts (generated)
│   │   ├── db.ts         # Supabase client + helpers
│   │   ├── output.ts     # JSON output helpers
│   │   ├── mcp.ts        # MCP server entry point
│   │   └── index.ts      # CLI entry point
│   └── test/             # CLI tests
├── src/
│   └── app/              # Next.js App Router
├── supabase/
│   └── migrations/       # SQL migrations
├── skills/               # Claude Code skills (installable)
├── CLAUDE.md             # AI project config
├── ROADMAP.md            # Issues and phases
├── PRD.md                # Product requirements
└── package.json
```

## Development

```bash
# Next.js dashboard
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint

# CLI
cd cli
npm run build     # Compile TypeScript
npm run dev       # Watch mode
npm test          # Run all tests (46 tests)
npm run typecheck # Type check without emitting
```

## Build Phases

1. **Data Layer + CLI** — Supabase schema, CLI commands, log and query ✓
2. **MCP Server** — expose tools to Claude Code ✓
3. **Web Dashboard** — calendar view, metrics, deploy to Vercel
4. **Integrations** — Health Auto Export, Hevy, Oura, Strava

## The Name

**Iron** — iron discipline. The iron will to show up every day and do the work.

**Compass** — 360-degree view of health. Weight, sleep, nutrition, fitness, vitals — all pointing toward true north.
