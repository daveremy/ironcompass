import { describe, it } from "node:test";
import { spawn } from "node:child_process";
import assert from "node:assert/strict";

const MCP = "./dist/mcp.js";

function sendJsonRpc(proc: ReturnType<typeof spawn>, msg: object): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      proc.kill();
      reject(new Error("Timeout waiting for MCP response"));
    }, 5000);

    let buf = "";
    proc.stdout!.on("data", (chunk: Buffer) => {
      buf += chunk.toString();
      if (buf.includes("\n")) {
        clearTimeout(timeout);
        resolve(buf.trim());
      }
    });

    proc.stderr!.on("data", () => {});

    proc.stdin!.write(JSON.stringify(msg) + "\n");
  });
}

function spawnMcp() {
  return spawn("node", [MCP], {
    cwd: import.meta.dirname + "/..",
    stdio: ["pipe", "pipe", "pipe"],
    env: { ...process.env, PATH: process.env.PATH },
  });
}

async function initAndSend(proc: ReturnType<typeof spawn>, msg: object): Promise<any> {
  await sendJsonRpc(proc, {
    jsonrpc: "2.0",
    id: 0,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {},
      clientInfo: { name: "test", version: "0.0.1" },
    },
  });
  proc.stdin!.write(JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" }) + "\n");
  return JSON.parse(await sendJsonRpc(proc, msg));
}

const EXPECTED_TOOLS = [
  "ironcompass_query_today",
  "ironcompass_query_week",
  "ironcompass_query_trend",
  "ironcompass_query_streak",
  "ironcompass_log_daily",
  "ironcompass_log_sleep",
  "ironcompass_log_fasting",
  "ironcompass_log_bp",
  "ironcompass_log_workout",
  "ironcompass_log_meal",
  "ironcompass_log_pullups",
  "ironcompass_log_supplements",
  "ironcompass_log_bodycomp",
  "ironcompass_log_metric",
  "ironcompass_list_workout_types",
  "ironcompass_delete_metric",
  "ironcompass_delete_meal",
  "ironcompass_delete_workout",
];

describe("ironcompass MCP server", () => {
  it("responds to initialize with server info", async () => {
    const proc = spawnMcp();
    try {
      const raw = await sendJsonRpc(proc, {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: {},
          clientInfo: { name: "test", version: "0.0.1" },
        },
      });

      const response = JSON.parse(raw);
      assert.equal(response.jsonrpc, "2.0");
      assert.equal(response.id, 1);
      assert.ok(response.result, "Expected result in response");
      assert.equal(response.result.serverInfo.name, "ironcompass");
      assert.equal(response.result.serverInfo.version, "0.1.0");
      assert.ok(response.result.capabilities.tools, "Expected tools capability");
    } finally {
      proc.kill();
    }
  });

  it("lists all 18 tools with correct schemas", async () => {
    const proc = spawnMcp();
    try {
      const response = await initAndSend(proc, {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {},
      });

      assert.ok(response.result, "Expected result");
      const tools = response.result.tools;

      // All 18 tools present
      assert.equal(tools.length, 18);
      const names = tools.map((t: any) => t.name).sort();
      assert.deepEqual(names, [...EXPECTED_TOOLS].sort());

      // bp requires systolic and diastolic
      const bp = tools.find((t: any) => t.name === "ironcompass_log_bp");
      const bpRequired = bp.inputSchema.required ?? [];
      assert.ok(bpRequired.includes("systolic"), "systolic should be required");
      assert.ok(bpRequired.includes("diastolic"), "diastolic should be required");

      // workout type is a string (validated at runtime via DB)
      const workout = tools.find((t: any) => t.name === "ironcompass_log_workout");
      const typeSchema = workout.inputSchema.properties.type;
      assert.equal(typeSchema.type, "string", "type should be a string");

      // workout schema has details property
      assert.ok(workout.inputSchema.properties.details, "workout should have details property");

      // workout schema has start_time, end_time, source properties (#32, #33)
      assert.ok(workout.inputSchema.properties.start_time, "workout should have start_time property");
      assert.ok(workout.inputSchema.properties.end_time, "workout should have end_time property");
      assert.ok(workout.inputSchema.properties.source, "workout should have source property");

      // streak schema has as_of_date property (#69)
      const streak = tools.find((t: any) => t.name === "ironcompass_query_streak");
      assert.ok(streak.inputSchema.properties.as_of_date, "streak should have as_of_date property");
    } finally {
      proc.kill();
    }
  });

  it("streak with invalid as_of_date returns validation error", async () => {
    const proc = spawnMcp();
    try {
      const response = await initAndSend(proc, {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: {
          name: "ironcompass_query_streak",
          arguments: { metric: "workout", as_of_date: "2026-02-31" },
        },
      });

      assert.ok(response.result, "Expected result");
      const content = response.result.content[0].text;
      assert.ok(content.includes("not a real calendar date"), `Expected validation error, got: ${content}`);
    } finally {
      proc.kill();
    }
  });
});
