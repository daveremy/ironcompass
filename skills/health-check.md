---
name: health-check
description: Review health data from IronCompass. Use during daily check-ins, weekly reviews, or when the user asks about health trends and streaks.
argument-hint: "[today | week | trend <metric> | streak <metric>]"
allowed-tools: mcp__ironcompass__ironcompass_query_today, mcp__ironcompass__ironcompass_query_week, mcp__ironcompass__ironcompass_query_trend, mcp__ironcompass__ironcompass_query_streak
---

Query IronCompass and present health data conversationally. Not a data dump — highlight what matters.

## When to use this skill

- **Daily check-in**: Review what's been logged, identify gaps
- **Weekly review**: Summarize the week's health data
- **Ad-hoc**: When the user asks "how's my weight trending", "how'd I sleep this week", "what's my streak", etc.

## Arguments

Parse from $ARGUMENTS:
- `today` or no args → daily summary (default)
- `week` → weekly summary
- `trend <metric>` → trend for metric (weight, energy, sleep, hrv, hr-sleep, readiness, bp, pullups, calories, protein, body-fat)
- `streak <metric>` → streak for metric (alcohol-free, fasting, workout, logging)
- `full` → comprehensive review (today + week + key streaks + weight trend)

## Daily check-in flow

1. Call query_today for yesterday's date
2. Review what's logged vs what's missing:
   - Daily metrics (weight, energy, alcohol)
   - Sleep data
   - Meals — how many logged? Total protein?
   - Fasting — compliant?
   - Workout — completed?
   - Supplements
3. Ask the user about gaps conversationally, then use /health-log to record answers
4. Call query_today for today to see what's already in

## Weekly review flow

1. Call query_week
2. Call query_streak for alcohol-free, fasting, workout, logging
3. Call query_trend for weight (7 days) and sleep (7 days)
4. Summarize conversationally:
   - Weight direction and delta
   - Workout count
   - Sleep averages
   - Protein averages
   - Streaks — celebrate milestones, flag breaks
   - What went well, what to adjust

## Presentation style

- Conversational, not clinical
- Lead with wins ("4 workouts this week, nice")
- Flag concerns without lecturing ("protein averaged 120g — below your target")
- Use specific numbers, not vague summaries
- Keep it brief unless the user asks for detail
