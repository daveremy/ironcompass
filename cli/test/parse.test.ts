import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseJsonObject, parseTimestamp, mergeSupplements } from "../dist/lib/parse.js";

describe("parseJsonObject", () => {
  it("parses a valid JSON object", () => {
    assert.deepEqual(parseJsonObject('{"key":"val"}'), { key: "val" });
  });

  it("throws on invalid JSON syntax", () => {
    assert.throws(() => parseJsonObject("{invalid"), /Invalid JSON/);
  });

  it("throws on a number primitive", () => {
    assert.throws(() => parseJsonObject("123"), /JSON object/);
  });

  it("throws on an array", () => {
    assert.throws(() => parseJsonObject("[1,2]"), /JSON object/);
  });

  it("throws on a string primitive", () => {
    assert.throws(() => parseJsonObject('"hello"'), /JSON object/);
  });

  it("throws on null", () => {
    assert.throws(() => parseJsonObject("null"), /JSON object/);
  });
});

describe("parseTimestamp", () => {
  it("converts HH:MM to ISO 8601 with date and local timezone offset", () => {
    const result = parseTimestamp("2026-03-07", "08:30");
    assert.match(result, /^2026-03-07T08:30:00[+-]\d{2}:\d{2}$/);
  });

  it("supports single-digit hours", () => {
    const result = parseTimestamp("2026-03-07", "8:30");
    assert.match(result, /^2026-03-07T08:30:00[+-]\d{2}:\d{2}$/);
  });

  it("passes through an ISO 8601 string with offset unchanged", () => {
    const iso = "2026-03-07T08:30:00-08:00";
    assert.equal(parseTimestamp("2026-03-07", iso), iso);
  });

  it("passes through an ISO 8601 string with Z unchanged", () => {
    assert.equal(parseTimestamp("2026-03-07", "2026-03-07T14:00:00Z"), "2026-03-07T14:00:00Z");
  });

  it("adds local offset to ISO 8601 string without timezone", () => {
    const result = parseTimestamp("2026-03-10", "2026-03-10T07:59:00");
    assert.match(result, /^2026-03-10T07:59:00[+-]\d{2}:\d{2}$/);
  });

  it("adds local offset to ISO 8601 string without seconds or timezone", () => {
    const result = parseTimestamp("2026-03-10", "2026-03-10T07:59");
    assert.match(result, /^2026-03-10T07:59:00[+-]\d{2}:\d{2}$/);
  });
});

describe("mergeSupplements", () => {
  it("merges two disjoint lists", () => {
    const result = mergeSupplements(["omega-3", "vitamin-d"], ["creatine", "magnesium"]);
    assert.deepEqual(result, ["omega-3", "vitamin-d", "creatine", "magnesium"]);
  });

  it("deduplicates overlapping supplements", () => {
    const result = mergeSupplements(["omega-3", "vitamin-d"], ["vitamin-d", "creatine"]);
    assert.deepEqual(result, ["omega-3", "vitamin-d", "creatine"]);
  });

  it("handles empty existing list", () => {
    const result = mergeSupplements([], ["omega-3", "creatine"]);
    assert.deepEqual(result, ["omega-3", "creatine"]);
  });

  it("handles empty incoming list", () => {
    const result = mergeSupplements(["omega-3", "creatine"], []);
    assert.deepEqual(result, ["omega-3", "creatine"]);
  });
});
