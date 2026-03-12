import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseNum, parseList, sparse } from "../src/lib/parse.ts";
import { todayDate, daysAgo, parseDate, daysBeforeDate } from "../src/lib/date.ts";
import { throwIfError } from "../src/db.ts";

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
