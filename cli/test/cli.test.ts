import { describe, it } from "node:test";
import { execFileSync } from "node:child_process";
import assert from "node:assert/strict";

const CLI = "./dist/index.js";

function run(...args: string[]): { stdout: string; stderr: string; exitCode: number } {
  try {
    const stdout = execFileSync("node", [CLI, ...args], {
      cwd: import.meta.dirname + "/..",
      encoding: "utf8",
      env: { ...process.env, PATH: process.env.PATH },
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (e: any) {
    return {
      stdout: e.stdout ?? "",
      stderr: e.stderr ?? "",
      exitCode: e.status ?? 1,
    };
  }
}

describe("ironcompass CLI", () => {
  it("--help returns usage info with exit 0", () => {
    const { stdout, exitCode } = run("--help");
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("IronCompass health tracking CLI"));
    assert.ok(stdout.includes("log"));
    assert.ok(stdout.includes("today"));
  });

  it("--version returns version with exit 0", () => {
    const { stdout, exitCode } = run("--version");
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("0.1.0"));
  });

  it("log --help lists all 9 subcommands", () => {
    const { stdout, exitCode } = run("log", "--help");
    assert.equal(exitCode, 0);
    for (const cmd of ["daily", "sleep", "fasting", "bp", "workout", "meal", "pullups", "supplements", "bodycomp"]) {
      assert.ok(stdout.includes(cmd), `missing subcommand: ${cmd}`);
    }
  });

  it("today --help shows --date option", () => {
    const { stdout, exitCode } = run("today", "--help");
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("--date"));
  });

  it("workout --type validates against DB workout types", () => {
    const { stderr, exitCode } = run("log", "workout", "--type", "swimming", "--duration", "30");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    // Error comes from validateWorkoutType — either "Unknown workout type" (table exists)
    // or "Failed to fetch workout types" (table not yet migrated)
    assert.ok(
      parsed.error.includes("workout type") || parsed.error.includes("workout_types"),
      `Expected workout type validation error, got: ${parsed.error}`
    );
  });

  it("log daily --help shows --date default as YYYY-MM-DD", () => {
    const { stdout } = run("log", "daily", "--help");
    assert.match(stdout, /default: "\d{4}-\d{2}-\d{2}"/);
  });

  it("bp requires --systolic and --diastolic", () => {
    const { stderr, exitCode } = run("log", "bp");
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes("--systolic"));
  });

  it("trend requires metric argument", () => {
    const { stderr, exitCode } = run("trend");
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes("metric"));
  });

  it("trend with unknown metric returns empty custom metric result", () => {
    const { stdout, exitCode } = run("trend", "bogus");
    assert.equal(exitCode, 0);
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.data.metric, "bogus");
    assert.equal(parsed.data.summary.count, 0);
  });

  it("records --help shows description", () => {
    const { stdout, exitCode } = run("records", "--help");
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("personal records"), stdout);
  });

  it("streak with invalid metric fails with valid streak list", () => {
    const { stderr, exitCode } = run("streak", "bogus");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("Unknown streak"));
    assert.ok(parsed.error.includes("alcohol-free"));
  });

  it("trend --days 0 fails with positive integer error", () => {
    const { stderr, exitCode } = run("trend", "weight", "--days", "0");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("positive integer"));
  });

  it("trend --days 3.5 fails with positive integer error", () => {
    const { stderr, exitCode } = run("trend", "weight", "--days", "3.5");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("positive integer"));
  });

  it("trend --days abc fails with parse error", () => {
    const { stderr, exitCode } = run("trend", "weight", "--days", "abc");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("not a number"));
  });

  // parseNum validation
  it("log pullups --total abc fails with parse error", () => {
    const { stderr, exitCode } = run("log", "pullups", "--total", "abc");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("not a number"));
  });

  it("log bp --systolic abc fails with parse error", () => {
    const { stderr, exitCode } = run("log", "bp", "--systolic", "abc", "--diastolic", "80");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("not a number"));
  });

  // sleep --help shows new options
  it("sleep --help shows readiness, avg-hr-sleep, hrv options", () => {
    const { stdout } = run("log", "sleep", "--help");
    assert.ok(stdout.includes("--readiness"), "missing --readiness");
    assert.ok(stdout.includes("--avg-hr-sleep"), "missing --avg-hr-sleep");
    assert.ok(stdout.includes("--hrv"), "missing --hrv");
  });

  // workout --type description mentions example types
  it("workout --help shows type option with example types", () => {
    const { stdout } = run("log", "workout", "--help");
    assert.ok(stdout.includes("--type"), "should show --type option");
    assert.ok(stdout.includes("strength"), "should mention strength as example");
  });

  // --details option exists
  it("workout --help shows --details option", () => {
    const { stdout } = run("log", "workout", "--help");
    assert.ok(stdout.includes("--details"), "missing --details option");
  });

  // --start-time, --end-time, --source options (#32, #33)
  it("workout --help shows --start-time, --end-time, --source options", () => {
    const { stdout } = run("log", "workout", "--help");
    assert.ok(stdout.includes("--start-time"), "missing --start-time option");
    assert.ok(stdout.includes("--end-time"), "missing --end-time option");
    assert.ok(stdout.includes("--source"), "missing --source option");
  });

  it("streak --help shows --as-of option", () => {
    const { stdout, exitCode } = run("streak", "--help");
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes("--as-of"), "missing --as-of option");
  });

  it("streak --as-of with invalid date fails with validation error", () => {
    const { stderr, exitCode } = run("streak", "workout", "--as-of", "2026-02-31");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("not a real calendar date"));
  });

  // empty supplements rejected
  it("log supplements --taken ',' fails with empty list error", () => {
    const { stderr, exitCode } = run("log", "supplements", "--taken", ",");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("at least one supplement"));
  });
});
