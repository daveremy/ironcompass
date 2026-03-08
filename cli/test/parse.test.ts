import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseJsonObject } from "../dist/lib/parse.js";

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
