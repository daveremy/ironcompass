/**
 * Pure functions for streak and PR computation — testable without Supabase.
 */

export interface LongestStreakResult {
  current: number;
  longest: number;
  longestEndIndex: number;
}

/**
 * Given a set of dates that "pass" (sorted descending, as YYYY-MM-DD strings),
 * compute current and longest streaks starting from refDate.
 *
 * @param passDates Set of date strings where the streak condition was met
 * @param refDate Reference date (typically today)
 * @param offset Number of days to skip from refDate (0 or 1)
 * @param earliestDate Earliest date in the dataset
 */
export function scanStreaks(
  passDates: Set<string>,
  refDate: string,
  offset: number,
  earliestDate: string,
): LongestStreakResult {
  const ref = new Date(refDate + "T00:00:00");

  function daysBack(n: number): string {
    const d = new Date(ref.getTime());
    d.setDate(d.getDate() - n);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  // Current streak
  let current = 0;
  for (let i = offset; ; i++) {
    const d = daysBack(i);
    if (d < earliestDate) break;
    if (passDates.has(d)) current++;
    else break;
  }

  // Longest streak scan
  let longest = current;
  let longestEnd = offset;

  let tempCount = 0;
  let tempEnd = current + offset;

  for (let i = current + offset; ; i++) {
    const d = daysBack(i);
    if (d < earliestDate) break;
    if (passDates.has(d)) {
      if (tempCount === 0) tempEnd = i;
      tempCount++;
    } else {
      if (tempCount > longest) { longest = tempCount; longestEnd = tempEnd; }
      tempCount = 0;
    }
  }
  if (tempCount > longest) { longest = tempCount; longestEnd = tempEnd; }

  return { current, longest, longestEndIndex: longestEnd };
}

/**
 * Find the max record value from an array of rows for a given column.
 * Returns the row with the earliest date in case of ties.
 */
export function computeMaxRecord(
  rows: Array<{ date: string; [key: string]: any }>,
  column: string,
): { value: number; date: string } | null {
  let best: { value: number; date: string } | null = null;
  // rows should be sorted by date ascending for tie-breaking
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  for (const row of sorted) {
    if (row[column] == null) continue;
    const val = Number(row[column]);
    if (best === null || val > best.value) {
      best = { value: val, date: row.date };
    }
  }
  return best;
}

/**
 * Find the min record value from an array of rows for a given column.
 * Returns the row with the earliest date in case of ties.
 */
export function computeMinRecord(
  rows: Array<{ date: string; [key: string]: any }>,
  column: string,
): { value: number; date: string } | null {
  let best: { value: number; date: string } | null = null;
  const sorted = [...rows].sort((a, b) => a.date.localeCompare(b.date));
  for (const row of sorted) {
    if (row[column] == null) continue;
    const val = Number(row[column]);
    if (best === null || val < best.value) {
      best = { value: val, date: row.date };
    }
  }
  return best;
}

/**
 * Sum a column per date, then find the date with the maximum sum.
 * Earliest date wins ties.
 */
export function computeDailySumMax(
  rows: Array<{ date: string; [key: string]: any }>,
  column: string,
): { value: number; date: string } | null {
  const byDate: Record<string, number> = {};
  for (const r of rows) {
    if (r[column] != null) byDate[r.date] = (byDate[r.date] ?? 0) + Number(r[column]);
  }
  const entries = Object.entries(byDate).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return null;

  let bestDate = entries[0][0];
  let bestVal = entries[0][1];
  for (const [date, val] of entries) {
    if (val > bestVal) { bestVal = val; bestDate = date; }
  }
  return { value: bestVal, date: bestDate };
}
