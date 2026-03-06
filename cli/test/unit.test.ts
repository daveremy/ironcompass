import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseNum, parseList, sparse } from "../src/lib/parse.ts";
import { todayDate, daysAgo } from "../src/lib/date.ts";
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
