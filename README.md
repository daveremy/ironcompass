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

## Quick Start

```bash
# Clone and install
git clone https://github.com/yourusername/ironcompass.git
cd ironcompass
npm install

# Set up environment
cp .env.local.example .env.local
# Fill in your Supabase URL, anon key, and service role key

# Run the dashboard
npm run dev

# Run the CLI
npx ironcompass status
```

## CLI Usage

### Log daily metrics

```bash
ironcompass log --date 2026-03-05 --weight 174.5 --energy 3 --alcohol false
ironcompass log sleep --apple 78 --oura 85 --hours 7.2 --mouth-tape --no-cpap
ironcompass log fasting --protocol 16:8 --start 12:00 --end 20:00 --compliant
ironcompass log bp --systolic 128 --diastolic 78
```

### Log workouts

```bash
ironcompass log workout --type hike --duration 56 --distance 2.5 --elevation 615 --calories 316 --hr 91
ironcompass log workout --type strength --duration 30 --notes "Day B: upper body + core"
```

### Log meals and supplements

```bash
ironcompass log meal --name "salmon dinner" --protein 34 --fat 12 --carbs 25 --calories 340
ironcompass log pullups --total 18 --sets 3,3,3,3,3,3
ironcompass log supplements --taken "vitamin-d,magnesium,omega-3,creatine"
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

## MCP Tools

| Tool | Description |
|------|-------------|
| `ironcompass_log_daily` | Log weight, energy, alcohol, notes |
| `ironcompass_log_sleep` | Log sleep scores, hours, CPAP, mouth tape |
| `ironcompass_log_fasting` | Log fasting protocol and compliance |
| `ironcompass_log_bp` | Log blood pressure reading |
| `ironcompass_log_workout` | Log workout with type, duration, stats |
| `ironcompass_log_meal` | Log meal with macros |
| `ironcompass_log_pullups` | Log pullup count and sets |
| `ironcompass_log_supplements` | Log supplements taken |
| `ironcompass_query_today` | Get today's full summary |
| `ironcompass_query_week` | Get weekly summary |
| `ironcompass_query_trend` | Get trend data for any metric |
| `ironcompass_query_streak` | Get current streak |

## Dashboard

Dark theme, athletic aesthetic. Three main views:

- **Calendar**: Month grid with color-coded workout days (green=pickleball, blue=strength, orange=hike, purple=golf, red=run). Click any day for full details.
- **Metrics**: Weight trend (with configurable goal line), sleep scores, BP trend, streaks, pullup progress, protein intake.
- **Weekly Summary**: Workouts completed vs planned, averages, deltas, streaks.

## Project Structure

```
ironcompass/
├── src/
│   └── app/              # Next.js App Router
│       ├── page.tsx      # Dashboard home
│       ├── layout.tsx    # Root layout
│       └── globals.css   # Global styles
├── supabase/
│   └── migrations/       # SQL migrations
├── CLAUDE.md             # AI project config
├── ROADMAP.md            # Issues and phases
├── PRD.md                # Product requirements
└── package.json
```

## Development

```bash
npm run dev       # Start Next.js dev server
npm run build     # Production build
npm run lint      # ESLint
```

## Build Phases

1. **Data Layer + CLI** — Supabase schema, CLI commands, log and query (current)
2. **MCP Server** — expose tools to Claude Code
3. **Web Dashboard** — calendar view, metrics, deploy to Vercel
4. **Integrations** — Health Auto Export, Hevy, Oura, Strava

## The Name

**Iron** — iron discipline. The iron will to show up every day and do the work.

**Compass** — 360-degree view of health. Weight, sleep, nutrition, fitness, vitals — all pointing toward true north.
