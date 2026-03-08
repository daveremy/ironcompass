---
name: health-log
description: Log health data to IronCompass from conversational input. Use when the user mentions meals, workouts, sleep, weight, supplements, fasting, blood pressure, pullups, or body composition.
argument-hint: "<natural language description of what to log>"
allowed-tools: mcp__ironcompass__ironcompass_log_daily, mcp__ironcompass__ironcompass_log_sleep, mcp__ironcompass__ironcompass_log_fasting, mcp__ironcompass__ironcompass_log_bp, mcp__ironcompass__ironcompass_log_workout, mcp__ironcompass__ironcompass_log_meal, mcp__ironcompass__ironcompass_log_pullups, mcp__ironcompass__ironcompass_log_supplements, mcp__ironcompass__ironcompass_log_bodycomp, mcp__ironcompass__ironcompass_query_today
---

Parse natural language and log health data to IronCompass via MCP tools. Multiple items can be logged from a single message.

## When to use this skill

Trigger when the user mentions any of:
- What they ate or drank (→ log_meal)
- A workout, hike, run, gym session (→ log_workout)
- Weight (→ log_daily)
- Energy level (→ log_daily)
- Alcohol or no alcohol (→ log_daily)
- Sleep data, Oura/Apple scores, hours slept (→ log_sleep)
- Fasting window, eating window (→ log_fasting)
- Blood pressure reading (→ log_bp)
- Pullups (→ log_pullups)
- Supplements taken (→ log_supplements)
- Body composition / Body Pod results (→ log_bodycomp)

## How to parse

- **Meals**: Extract name, protein, fat, carbs, calories from context. Log what's stated, omit what's not.
- **Workouts**: Map to types: pickleball, strength, hike, golf, run, elliptical, mobility, sauna, hot_tub, indoor_cycle, other. Extract duration, distance, elevation, calories, HR from what's stated.
- **Weight**: Parse number as lbs.
- **Energy**: Parse 1-5 scale. If ambiguous ("feeling great" → 4-5, "okay" → 3, "tired" → 1-2), confirm before logging.
- **Sleep**: Apple score, Oura score, hours, CPAP (bool), mouth tape (bool), readiness, avg HR, HRV.
- **Fasting**: Protocol (16:8, 18:6, OMAD), window start/end times, compliant (bool).
- **Supplements**: Parse list of supplement names.
- **Body composition**: body fat %, muscle mass lbs, bone mass lbs, body water %, visceral fat score, BMR.
- **Date**: Default to today. If user says "yesterday" or a specific date, use that.

## Steps

1. Parse $ARGUMENTS (or conversational context) to identify what needs logging
2. For each item, call the appropriate MCP tool with extracted fields
3. If critical info is ambiguous (e.g., can't tell the workout type), ask before logging
4. After logging, briefly confirm what was recorded — don't be verbose
5. If multiple things need logging, call tools in parallel when independent

## Examples

User says: "Had a 45-min hike this morning, about 2 miles, 400ft elevation. Then protein shake after — 39g protein, 260 cal."
→ Call log_workout(type: "hike", duration_min: 45, distance_mi: 2, elevation_ft: 400, completed: true)
→ Call log_meal(name: "protein shake", protein_g: 39, calories: 260)

User says: "Weight was 173.5 this morning. Slept 7.2 hours, Oura gave me 82. No alcohol yesterday, energy was a 3."
→ Call log_daily(weight: 173.5, energy: 3, alcohol: false)
→ Call log_sleep(hours: 7.2, oura_score: 82)

## Notes

- Don't ask for data the user didn't mention — log what's available, skip the rest
- After logging, you can call query_today to show the user their running daily summary
