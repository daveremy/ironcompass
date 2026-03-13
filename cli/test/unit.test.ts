import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseNum, parseList, sparse } from "../src/lib/parse.ts";
import { todayDate, daysAgo, parseDate, daysBeforeDate } from "../src/lib/date.ts";
import { throwIfError } from "../src/db.ts";
import { scanStreaks, computeMaxRecord, computeMinRecord, computeDailySumMax } from "../src/lib/streak-helpers.ts";
import type { WorkoutStatus } from "../src/commands/plan.ts";

describe("parseNum", () => {
  it("returns undefined for undefined input", () => {
    assert.equal(parseNum("x", undefined), undefined);
  });

  it("parses valid integers", () => {
    assert.equal(parseNum("x", "42"), 42);
  });

  it("parses valid decimals", () => {
    assert.equal(parseNum("x", "3.14"), 3.14);
  });

  it("trims whitespace", () => {
    assert.equal(parseNum("x", "  7  "), 7);
  });

  it("throws on empty string", () => {
    assert.throws(() => parseNum("weight", ""), /Invalid weight: empty value/);
  });

  it("throws on non-numeric string", () => {
    assert.throws(() => parseNum("weight", "abc"), /Invalid weight: "abc" is not a number/);
  });

  it("throws on NaN-producing input", () => {
    assert.throws(() => parseNum("x", "12abc"), /not a number/);
  });

  it("throws on Infinity", () => {
    assert.throws(() => parseNum("x", "Infinity"), /not a number/);
  });
});

describe("parseList", () => {
  it("splits comma-separated values", () => {
    assert.deepEqual(parseList("a,b,c"), ["a", "b", "c"]);
  });

  it("trims whitespace from items", () => {
    assert.deepEqual(parseList("  a , b , c  "), ["a", "b", "c"]);
  });

  it("filters out empty segments", () => {
    assert.deepEqual(parseList(",a,,b,"), ["a", "b"]);
  });

  it("returns empty array for only commas", () => {
    assert.deepEqual(parseList(",,,"), []);
  });

  it("handles single item", () => {
    assert.deepEqual(parseList("vitamin-d"), ["vitamin-d"]);
  });
});

describe("sparse", () => {
  it("removes undefined values", () => {
    assert.deepEqual(sparse({ a: 1, b: undefined, c: "x" }), { a: 1, c: "x" });
  });

  it("keeps null values", () => {
    assert.deepEqual(sparse({ a: null, b: 2 }), { a: null, b: 2 });
  });

  it("keeps false and 0", () => {
    assert.deepEqual(sparse({ a: false, b: 0, c: "" }), { a: false, b: 0, c: "" });
  });

  it("returns empty object when all undefined", () => {
    assert.deepEqual(sparse({ a: undefined, b: undefined }), {});
  });

  it("returns same object when no undefined", () => {
    const input = { x: 1, y: "two" };
    assert.deepEqual(sparse(input), { x: 1, y: "two" });
  });
});

describe("todayDate", () => {
  it("returns YYYY-MM-DD format", () => {
    assert.match(todayDate(), /^\d{4}-\d{2}-\d{2}$/);
  });

  it("matches current date", () => {
    const now = new Date();
    const expected = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    assert.equal(todayDate(), expected);
  });
});

describe("daysAgo", () => {
  it("returns today for daysAgo(0)", () => {
    assert.equal(daysAgo(0), todayDate());
  });

  it("returns YYYY-MM-DD format", () => {
    assert.match(daysAgo(7), /^\d{4}-\d{2}-\d{2}$/);
  });

  it("returns a date before today for positive n", () => {
    assert.ok(daysAgo(1) < todayDate());
  });

  it("handles large values", () => {
    const result = daysAgo(365);
    assert.match(result, /^\d{4}-\d{2}-\d{2}$/);
    assert.ok(result < todayDate());
  });
});

describe("parseDate", () => {
  it("parses valid date", () => {
    const d = parseDate("2026-03-12");
    assert.equal(d.getFullYear(), 2026);
    assert.equal(d.getMonth(), 2); // March = 2
    assert.equal(d.getDate(), 12);
  });

  it("rejects invalid format", () => {
    assert.throws(() => parseDate("2026/03/12"), /Invalid date format/);
  });

  it("rejects impossible date (Feb 31)", () => {
    assert.throws(() => parseDate("2026-02-31"), /not a real calendar date/);
  });

  it("rejects impossible date (Apr 31)", () => {
    assert.throws(() => parseDate("2026-04-31"), /not a real calendar date/);
  });

  it("accepts Feb 28 in non-leap year", () => {
    const d = parseDate("2025-02-28");
    assert.equal(d.getDate(), 28);
  });

  it("rejects Feb 29 in non-leap year", () => {
    assert.throws(() => parseDate("2025-02-29"), /not a real calendar date/);
  });

  it("accepts Feb 29 in leap year", () => {
    const d = parseDate("2024-02-29");
    assert.equal(d.getDate(), 29);
  });
});

describe("daysBeforeDate", () => {
  it("returns same date for 0 days", () => {
    assert.equal(daysBeforeDate("2026-03-12", 0), "2026-03-12");
  });

  it("returns previous day for 1 day", () => {
    assert.equal(daysBeforeDate("2026-03-12", 1), "2026-03-11");
  });

  it("crosses month boundary", () => {
    assert.equal(daysBeforeDate("2026-03-01", 1), "2026-02-28");
  });

  it("crosses year boundary", () => {
    assert.equal(daysBeforeDate("2026-01-01", 1), "2025-12-31");
  });

  it("handles large offset", () => {
    assert.equal(daysBeforeDate("2026-03-12", 365), "2025-03-12");
  });
});

// --- Streak helpers ---

describe("scanStreaks", () => {
  it("empty data returns longest = 0, current = 0", () => {
    const result = scanStreaks(new Set(), "2026-03-12", 0, "2026-03-12");
    assert.equal(result.current, 0);
    assert.equal(result.longest, 0);
  });

  it("single continuous streak: longest = current", () => {
    const dates = new Set(["2026-03-12", "2026-03-11", "2026-03-10"]);
    const result = scanStreaks(dates, "2026-03-12", 0, "2026-03-10");
    assert.equal(result.current, 3);
    assert.equal(result.longest, 3);
  });

  it("broken streak with longer historical one", () => {
    // Current: 2 days (Mar 12, 11). Gap on Mar 10. Historical: 5 days (Mar 9-5)
    const dates = new Set([
      "2026-03-12", "2026-03-11",
      "2026-03-09", "2026-03-08", "2026-03-07", "2026-03-06", "2026-03-05",
    ]);
    const result = scanStreaks(dates, "2026-03-12", 0, "2026-03-05");
    assert.equal(result.current, 2);
    assert.equal(result.longest, 5);
  });

  it("multiple historical streaks: returns true maximum", () => {
    // Current: 1 (Mar 12). Gap Mar 11. Streak of 3 (Mar 10-8). Gap Mar 7. Streak of 4 (Mar 6-3).
    const dates = new Set([
      "2026-03-12",
      "2026-03-10", "2026-03-09", "2026-03-08",
      "2026-03-06", "2026-03-05", "2026-03-04", "2026-03-03",
    ]);
    const result = scanStreaks(dates, "2026-03-12", 0, "2026-03-03");
    assert.equal(result.current, 1);
    assert.equal(result.longest, 4);
  });

  it("streak at data boundary is correctly counted", () => {
    // All days from Mar 5 to Mar 12 = 8 day streak ending at boundary
    const dates = new Set([
      "2026-03-12", "2026-03-11", "2026-03-10", "2026-03-09",
      "2026-03-08", "2026-03-07", "2026-03-06", "2026-03-05",
    ]);
    const result = scanStreaks(dates, "2026-03-12", 0, "2026-03-05");
    assert.equal(result.current, 8);
    assert.equal(result.longest, 8);
  });

  it("current streak is longest: longest = current", () => {
    // Current: 4 (Mar 12-9). Historical: 2 (Mar 7-6).
    const dates = new Set([
      "2026-03-12", "2026-03-11", "2026-03-10", "2026-03-09",
      "2026-03-07", "2026-03-06",
    ]);
    const result = scanStreaks(dates, "2026-03-12", 0, "2026-03-06");
    assert.equal(result.current, 4);
    assert.equal(result.longest, 4);
  });

  it("offset=1 skips refDate for current streak", () => {
    // Mar 12 not logged (offset=1). Streak: Mar 11, 10.
    const dates = new Set(["2026-03-11", "2026-03-10"]);
    const result = scanStreaks(dates, "2026-03-12", 1, "2026-03-10");
    assert.equal(result.current, 2);
    assert.equal(result.longest, 2);
  });
});

// --- PR record helpers ---

describe("computeMaxRecord", () => {
  it("returns max value with earliest date on tie", () => {
    const rows = [
      { date: "2026-03-10", score: 90 },
      { date: "2026-03-08", score: 95 },
      { date: "2026-03-12", score: 95 },
    ];
    const result = computeMaxRecord(rows, "score");
    assert.deepEqual(result, { value: 95, date: "2026-03-08" });
  });

  it("returns null for empty array", () => {
    assert.equal(computeMaxRecord([], "score"), null);
  });

  it("skips null values", () => {
    const rows = [
      { date: "2026-03-10", score: null },
      { date: "2026-03-11", score: 80 },
    ];
    const result = computeMaxRecord(rows, "score");
    assert.deepEqual(result, { value: 80, date: "2026-03-11" });
  });

  it("returns null when all values are null", () => {
    const rows = [
      { date: "2026-03-10", score: null },
      { date: "2026-03-11", score: null },
    ];
    assert.equal(computeMaxRecord(rows, "score"), null);
  });
});

describe("computeMinRecord", () => {
  it("returns min value with earliest date on tie", () => {
    const rows = [
      { date: "2026-03-10", weight: 175 },
      { date: "2026-03-08", weight: 170 },
      { date: "2026-03-12", weight: 170 },
    ];
    const result = computeMinRecord(rows, "weight");
    assert.deepEqual(result, { value: 170, date: "2026-03-08" });
  });

  it("returns null for empty array", () => {
    assert.equal(computeMinRecord([], "weight"), null);
  });
});

describe("computeDailySumMax", () => {
  it("sums per date and returns max", () => {
    const rows = [
      { date: "2026-03-10", protein_g: 30 },
      { date: "2026-03-10", protein_g: 40 },
      { date: "2026-03-11", protein_g: 60 },
    ];
    const result = computeDailySumMax(rows, "protein_g");
    assert.deepEqual(result, { value: 70, date: "2026-03-10" });
  });

  it("earliest date wins on tie", () => {
    const rows = [
      { date: "2026-03-10", val: 50 },
      { date: "2026-03-12", val: 50 },
    ];
    const result = computeDailySumMax(rows, "val");
    assert.deepEqual(result, { value: 50, date: "2026-03-10" });
  });

  it("returns null for empty array", () => {
    assert.equal(computeDailySumMax([], "val"), null);
  });

  it("skips null values", () => {
    const rows = [
      { date: "2026-03-10", val: null },
      { date: "2026-03-11", val: 25 },
    ];
    const result = computeDailySumMax(rows, "val");
    assert.deepEqual(result, { value: 25, date: "2026-03-11" });
  });
});

describe("throwIfError", () => {
  it("does nothing when error is null", () => {
    assert.doesNotThrow(() => throwIfError({ error: null }));
  });

  it("does nothing when error is undefined", () => {
    assert.doesNotThrow(() => throwIfError({ error: undefined }));
  });

  it("throws with error message", () => {
    assert.throws(
      () => throwIfError({ error: { message: "connection refused" } }),
      /Database error: connection refused/,
    );
  });
});

// --- Workout status helper (pure logic, no DB) ---

function getWorkoutStatus(w: { planned: boolean | null; completed: boolean | null; date: string }, today: string): WorkoutStatus {
  const isPlannedOnly = w.planned === true && w.completed === false;
  if (isPlannedOnly) {
    return w.date < today ? "skipped" : "scheduled";
  }
  return "completed";
}

describe("getWorkoutStatus", () => {
  const today = "2026-03-13";

  it("planned=true, completed=false, future date => scheduled", () => {
    assert.equal(getWorkoutStatus({ planned: true, completed: false, date: "2026-03-14" }, today), "scheduled");
  });

  it("planned=true, completed=false, today => scheduled", () => {
    assert.equal(getWorkoutStatus({ planned: true, completed: false, date: "2026-03-13" }, today), "scheduled");
  });

  it("planned=true, completed=false, past date => skipped", () => {
    assert.equal(getWorkoutStatus({ planned: true, completed: false, date: "2026-03-12" }, today), "skipped");
  });

  it("planned=null, completed=null => completed", () => {
    assert.equal(getWorkoutStatus({ planned: null, completed: null, date: "2026-03-12" }, today), "completed");
  });

  it("planned=true, completed=true => completed", () => {
    assert.equal(getWorkoutStatus({ planned: true, completed: true, date: "2026-03-12" }, today), "completed");
  });

  it("planned=true, completed=null => completed", () => {
    assert.equal(getWorkoutStatus({ planned: true, completed: null, date: "2026-03-12" }, today), "completed");
  });

  it("planned=false, completed=null => completed", () => {
    assert.equal(getWorkoutStatus({ planned: false, completed: null, date: "2026-03-12" }, today), "completed");
  });
});
