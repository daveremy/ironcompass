# IronCompass Skills for Claude Code

These skills teach Claude Code how to use IronCompass MCP tools conversationally. Install them in any project where you want Claude to log and review health data.

## Prerequisites

The IronCompass MCP server must be registered. See the [main README](../README.md#mcp-server) for setup.

## Install

Copy the skill files into your project's `.claude/skills/` directory:

```bash
# From your project root
mkdir -p .claude/skills/health-log .claude/skills/health-check
cp /path/to/ironcompass/skills/health-log.md .claude/skills/health-log/SKILL.md
cp /path/to/ironcompass/skills/health-check.md .claude/skills/health-check/SKILL.md
```

## Skills

### `/health-log`

Parses natural language and logs health data. Say things like:

- "Had a protein shake — 39g protein, 260 cal"
- "Hiked 2 miles in 45 minutes, 400ft elevation"
- "Weight 173.5, energy 3, no alcohol"
- "Slept 7.2 hours, Oura score 82"
- "Took my supplements: vitamin-d, magnesium, creatine"

Claude extracts the data and calls the right MCP tools.

### `/health-check`

Reviews health data from IronCompass:

- `/health-check` — today's summary
- `/health-check week` — weekly summary
- `/health-check trend weight` — weight trend
- `/health-check streak alcohol-free` — current streak
- `/health-check full` — comprehensive review

## Customization

These are generic versions. You can customize them for your own workflow:

- Add your specific supplement stack
- Set your protein/calorie targets
- Add your fasting protocol defaults
- Reference your training program files
- Adjust the presentation style
