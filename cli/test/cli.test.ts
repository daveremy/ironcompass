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

  it("stub commands return JSON error with exit 1", () => {
    const { stderr, exitCode } = run("today");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("Not implemented"));
  });

  it("workout --type validates against allowed choices", () => {
    const { stderr, exitCode } = run("log", "workout", "--type", "swimming");
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes("Allowed choices"));
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

  // empty supplements rejected
  it("log supplements --taken ',' fails with empty list error", () => {
    const { stderr, exitCode } = run("log", "supplements", "--taken", ",");
    assert.equal(exitCode, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.ok(parsed.error.includes("at least one supplement"));
  });
});
