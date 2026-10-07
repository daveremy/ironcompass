import { describe, it } from "node:test";
import { spawnSync } from "node:child_process";
import assert from "node:assert/strict";

// lifeos#294: success()/fail() used to call process.exit() straight after
// writing, which truncated output larger than the pipe buffer (64 KB) when
// stdout or stderr was a pipe. These tests run the built output module in a
// child whose stdio is a pipe and check that every byte arrives.

const PAYLOAD_CHARS = 300_000; // well over the 64 KB pipe buffer

function runOutput(call: string) {
  const r = spawnSync(
    "node",
    ["-e", `import("./dist/output.js").then(m => { ${call} })`],
    {
      cwd: import.meta.dirname + "/..",
      encoding: "utf8",
      maxBuffer: 10 * 1024 * 1024,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

describe("output envelope through a pipe", () => {
  it("success() delivers the full payload and exits 0", () => {
    const { stdout, status } = runOutput(
      `m.success({ blob: "x".repeat(${PAYLOAD_CHARS}) })`,
    );
    assert.equal(status, 0);
    assert.ok(stdout.endsWith("\n"));
    const parsed = JSON.parse(stdout);
    assert.equal(parsed.ok, true);
    assert.equal(parsed.data.blob.length, PAYLOAD_CHARS);
  });

  it("fail() delivers the full error and exits 1", () => {
    const { stderr, status } = runOutput(
      `m.fail("e".repeat(${PAYLOAD_CHARS}))`,
    );
    assert.equal(status, 1);
    const parsed = JSON.parse(stderr);
    assert.equal(parsed.ok, false);
    assert.equal(parsed.error.length, PAYLOAD_CHARS);
  });

  it("only the first success()/fail() call is written", () => {
    const { stdout, stderr, status } = runOutput(
      `m.success({ a: 1 }); m.fail("late");`,
    );
    assert.equal(status, 0);
    assert.deepEqual(JSON.parse(stdout), { ok: true, data: { a: 1 } });
    assert.equal(stderr, "");
  });
});
